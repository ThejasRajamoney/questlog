import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  
  const [stats, setStats] = useLocalStorage('questlog_stats', {
    xp: 0,
    health: 100,
    mana: 50,
    gold: 0,
    verifiedXp: 0,
    streak: 1,
  });

  const [tasks, setTasks] = useLocalStorage('questlog_tasks', []);
  const [habits, setHabits] = useLocalStorage('questlog_habits', []);
  const [notes, setNotes] = useLocalStorage('questlog_notes', []);
  const [rewards, setRewards] = useLocalStorage('questlog_rewards', [
    { id: '1', title: '1 hr of Video Games', cost: 50 },
    { id: '2', title: 'Watch an Episode', cost: 30 },
    { id: '3', title: 'Buy a Coffee', cost: 100 },
  ]);
  const [flashcards, setFlashcards] = useLocalStorage('questlog_flashcards', []);
  const [gpaData, setGpaData] = useLocalStorage('questlog_gpa', { gpa: 4.0, target: 4.0, courses: [] });
  const [lastLoginDate, setLastLoginDate] = useLocalStorage('questlog_last_login', new Date().toDateString());
  const [dailyXpEarned, setDailyXpEarned] = useLocalStorage('questlog_daily_xp', 0);
  const [isFocusing, setIsFocusing] = useState(false);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync with Supabase when logged in
  useEffect(() => {
    if (!session?.user) return;

    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setStats({
          xp: profile.xp,
          gold: profile.gold,
          health: profile.health,
          mana: profile.mana,
          verifiedXp: profile.verified_xp || 0,
          streak: profile.streak || 1
        });
      }

      const { data: dbTasks } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
      if (dbTasks) setTasks(dbTasks.map(t => ({ ...t, createdAt: t.created_at })));
      
      const { data: dbHabits } = await supabase.from('habits').select('*').eq('user_id', session.user.id);
      if (dbHabits) setHabits(dbHabits.map(h => ({ ...h, habitType: h.habit_type, createdAt: h.created_at })));

      const { data: dbRewards } = await supabase.from('rewards').select('*').eq('user_id', session.user.id);
      if (dbRewards && dbRewards.length > 0) setRewards(dbRewards);

      const { data: dbFlash } = await supabase.from('flashcards').select('*').eq('user_id', session.user.id);
      if (dbFlash) setFlashcards(dbFlash);

      const { data: dbGpa } = await supabase.from('profiles').select('gpa_data').eq('id', session.user.id).single();
      if (dbGpa?.gpa_data) setGpaData(dbGpa.gpa_data);
    };

    fetchData();
  }, [session]);

  // AUTO-SYNC TO CLOUD
  useEffect(() => {
    if (!session?.user) return;
    supabase.from('profiles').upsert({
      id: session.user.id,
      xp: stats.xp,
      gold: stats.gold,
      health: stats.health,
      mana: stats.mana,
      verified_xp: stats.verifiedXp,
      streak: stats.streak,
      last_login_date: lastLoginDate,
      gpa_data: gpaData
    }).then();
  }, [stats, lastLoginDate, gpaData, session]);

  useEffect(() => {
    if (!session?.user) return;
    // For simplicity in this demo, we'll do a full sync
    // In a real app, you'd sync individual changes
    const syncTasks = async () => {
       await supabase.from('tasks').delete().eq('user_id', session.user.id);
       if (tasks.length > 0) {
         await supabase.from('tasks').insert(tasks.map(t => ({
           user_id: session.user.id,
           text: t.text,
           type: t.type,
           completed: t.completed,
           created_at: t.createdAt
         })));
       }
    };
    syncTasks();
  }, [tasks, session]);

  useEffect(() => {
    if (!session?.user) return;
    const syncHabits = async () => {
       await supabase.from('habits').delete().eq('user_id', session.user.id);
       if (habits.length > 0) {
         await supabase.from('habits').insert(habits.map(h => ({
           user_id: session.user.id,
           text: h.text,
           habit_type: h.habitType,
           score: h.score,
           created_at: h.createdAt
         })));
       }
    };
    syncHabits();
  }, [habits, session]);

  useEffect(() => {
    if (!session?.user) return;
    const syncRewards = async () => {
       await supabase.from('rewards').delete().eq('user_id', session.user.id);
       if (rewards.length > 0) {
         await supabase.from('rewards').insert(rewards.map(r => ({
           user_id: session.user.id,
           title: r.title,
           cost: r.cost,
           created_at: new Date().toISOString()
         })));
       }
    };
    syncRewards();
  }, [rewards, session]);

  useEffect(() => {
    if (!session?.user) return;
    const syncFlash = async () => {
       await supabase.from('flashcards').delete().eq('user_id', session.user.id);
       if (flashcards.length > 0) {
         await supabase.from('flashcards').insert(flashcards.map(f => ({
           user_id: session.user.id,
           question: f.question,
           answer: f.answer,
           created_at: new Date().toISOString()
         })));
       }
    };
    syncFlash();
  }, [flashcards, session]);


  // Daily reset check
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      // Handle Streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasActiveYesterday = lastLoginDate === yesterday.toDateString();
      
      setStats(prev => ({
        ...prev,
        streak: wasActiveYesterday ? prev.streak + 1 : 1
      }));

      setTasks(prev => prev.map(t => t.type === 'daily' ? { ...t, completed: false } : t));
      setLastLoginDate(today);
      setDailyXpEarned(0); // Reset daily cap
    }
  }, [lastLoginDate, setTasks, setLastLoginDate, setStats, setDailyXpEarned]);


  const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const xpProgress = ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const gainXp = useCallback((amount, options = {}) => {
    const { isVerified = false } = options;
    const XP_CAP = 500;
    
    let multiplier = 1;
    if (isFocusing) multiplier = 5;
    
    let finalAmount = amount * multiplier;

    if (!isVerified && dailyXpEarned >= XP_CAP) {
      console.log("Daily XP Cap Reached! Use AI Grader or Focus Timer for more.");
      return false;
    }

    setStats((prev) => ({ 
      ...prev, 
      xp: prev.xp + finalAmount,
      verifiedXp: isVerified ? (prev.verifiedXp || 0) + finalAmount : prev.verifiedXp
    }));
    
    if (!isVerified) {
      setDailyXpEarned(prev => prev + finalAmount);
    }
    return true;
  }, [isFocusing, dailyXpEarned, setStats, setDailyXpEarned]);

  const gainGold = useCallback((amount) => {
    setStats((prev) => ({ ...prev, gold: (prev.gold || 0) + amount }));
  }, [setStats]);

  const spendGold = useCallback((amount) => {
    let success = false;
    setStats((prev) => {
      const currentGold = prev.gold || 0;
      if (currentGold >= amount) {
        success = true;
        return { ...prev, gold: currentGold - amount };
      }
      return prev;
    });
    return success;
  }, [setStats]);

  const loseHealth = useCallback((amount) => {
    setStats((prev) => ({ ...prev, health: Math.max(0, prev.health - amount) }));
  }, [setStats]);

  const useMana = useCallback((amount) => {
    setStats((prev) => ({ ...prev, mana: Math.max(0, prev.mana - amount) }));
  }, [setStats]);

  const value = {
    session,
    stats,
    level,
    xpProgress,
    nextLevelXp,
    gainXp,
    gainGold,
    spendGold,
    loseHealth,
    useMana,
    isFocusing,
    setIsFocusing,
    tasks,
    setTasks,
    habits,
    setHabits,
    notes,
    setNotes,
    rewards,
    setRewards,
    flashcards,
    setFlashcards,
    gpaData,
    setGpaData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

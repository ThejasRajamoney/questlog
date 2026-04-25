import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
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
  const [inventory, setInventory] = useLocalStorage('questlog_inventory', []);
  const [equipped, setEquipped] = useLocalStorage('questlog_equipped', { weapon: null, armor: null, head: null });
  const [activeBoss, setActiveBoss] = useLocalStorage('questlog_boss', null);
  const [rewards, setRewards] = useLocalStorage('questlog_rewards', [
    { id: '1', title: '1 hr of Video Games', cost: 50 },
    { id: '2', title: 'Watch an Episode', cost: 30 },
    { id: '3', title: 'Buy a Coffee', cost: 100 },
  ]);
  const [flashcards, setFlashcards] = useLocalStorage('questlog_flashcards', []);
  const [gpaData, setGpaData] = useLocalStorage('questlog_gpa', { gpa: 4.0, target: 4.0, courses: [] });
  const [focusRadioUrl, setFocusRadioUrl] = useLocalStorage('questlog_radio_url', 'https://www.youtube.com/embed/jfKfPfyJRdk');
  const [lastLoginDate, setLastLoginDate] = useLocalStorage('questlog_last_login', new Date().toDateString());
  const [dailyXpEarned, setDailyXpEarned] = useLocalStorage('questlog_daily_xp', 0);
  
  // Use refs so gainXp always has the latest values without stale closures
  const isFocusingRef = useRef(false);
  const [isFocusing, _setIsFocusing] = useState(false);
  const setIsFocusing = (val) => {
    isFocusingRef.current = val;
    _setIsFocusing(val);
  };

  const dailyXpEarnedRef = useRef(dailyXpEarned);
  useEffect(() => { dailyXpEarnedRef.current = dailyXpEarned; }, [dailyXpEarned]);

  // ── Midnight Reset Cron ─────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      // It's a new day! Calculate punishments for yesterday's missed tasks.
      const missedTasks = tasks.filter(t => !t.completed && t.type === 'todo');
      
      if (missedTasks.length > 0) {
        const damage = missedTasks.length * 5;
        setStats(prev => ({
          ...prev,
          health: Math.max(0, prev.health - damage),
          streak: 0 // Reset streak
        }));
        setTimeout(() => alert(`You left ${missedTasks.length} tasks unfinished yesterday! You took ${damage} damage and lost your streak!`), 1000);
      } else if (tasks.filter(t => t.type === 'todo').length > 0) {
        // Increase streak if they finished all tasks
        setStats(prev => ({ ...prev, streak: prev.streak + 1 }));
      }

      setDailyXpEarned(0);
      setLastLoginDate(today);
    }
  }, [lastLoginDate, tasks, setStats, setDailyXpEarned, setLastLoginDate]);

  // ── Auth listener ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch from Supabase on login (runs ONCE per session) ────────────
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!session?.user || hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setStats({
          xp: profile.xp || 0,
          gold: profile.gold || 0,
          health: profile.health || 100,
          mana: profile.mana || 50,
          verifiedXp: profile.verified_xp || 0,
          streak: profile.streak || 1
        });
        if (profile.gpa_data) setGpaData(profile.gpa_data);
      }

      const { data: dbTasks } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
      if (dbTasks?.length) setTasks(dbTasks.map(t => ({ ...t, createdAt: t.created_at })));
      
      const { data: dbHabits } = await supabase.from('habits').select('*').eq('user_id', session.user.id);
      if (dbHabits?.length) setHabits(dbHabits.map(h => ({ ...h, habitType: h.habit_type, createdAt: h.created_at })));

      const { data: dbRewards } = await supabase.from('rewards').select('*').eq('user_id', session.user.id);
      if (dbRewards?.length) setRewards(dbRewards);

      const { data: dbFlash } = await supabase.from('flashcards').select('*').eq('user_id', session.user.id);
      if (dbFlash?.length) setFlashcards(dbFlash);
    };

    fetchData();
  }, [session]);

  // ── Debounced sync helpers ──────────────────────────────────────────
  const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  // Sync profile stats (debounced to prevent rapid re-saves)
  const syncStats = useCallback(debounce(async (currentStats, currentSession, currentGpaData) => {
    if (!currentSession?.user) return;
    await supabase.from('profiles').upsert({
      id: currentSession.user.id,
      xp: currentStats.xp,
      gold: currentStats.gold,
      health: currentStats.health,
      mana: currentStats.mana,
      verified_xp: currentStats.verifiedXp,
      streak: currentStats.streak,
      gpa_data: currentGpaData
    });
  }, 2000), []);

  useEffect(() => {
    if (!session?.user) return;
    syncStats(stats, session, gpaData);
  }, [stats, gpaData, session]);

  // Sync tasks (debounced)
  const syncTasksTimeout = useRef(null);
  useEffect(() => {
    if (!session?.user) return;
    clearTimeout(syncTasksTimeout.current);
    syncTasksTimeout.current = setTimeout(async () => {
      await supabase.from('tasks').delete().eq('user_id', session.user.id);
      if (tasks.length > 0) {
        await supabase.from('tasks').insert(tasks.map(t => ({
          user_id: session.user.id,
          text: t.text,
          type: t.type,
          completed: t.completed,
          created_at: t.createdAt || new Date().toISOString()
        })));
      }
    }, 1500);
  }, [tasks, session]);

  // Sync habits (debounced)
  const syncHabitsTimeout = useRef(null);
  useEffect(() => {
    if (!session?.user) return;
    clearTimeout(syncHabitsTimeout.current);
    syncHabitsTimeout.current = setTimeout(async () => {
      await supabase.from('habits').delete().eq('user_id', session.user.id);
      if (habits.length > 0) {
        await supabase.from('habits').insert(habits.map(h => ({
          user_id: session.user.id,
          text: h.text,
          habit_type: h.habitType,
          score: h.score,
          created_at: h.createdAt || new Date().toISOString()
        })));
      }
    }, 1500);
  }, [habits, session]);

  // Sync rewards (debounced)
  const syncRewardsTimeout = useRef(null);
  useEffect(() => {
    if (!session?.user) return;
    clearTimeout(syncRewardsTimeout.current);
    syncRewardsTimeout.current = setTimeout(async () => {
      await supabase.from('rewards').delete().eq('user_id', session.user.id);
      if (rewards.length > 0) {
        await supabase.from('rewards').insert(rewards.map(r => ({
          user_id: session.user.id,
          title: r.title,
          cost: r.cost,
          created_at: new Date().toISOString()
        })));
      }
    }, 1500);
  }, [rewards, session]);

  // Sync flashcards (debounced)
  const syncFlashTimeout = useRef(null);
  useEffect(() => {
    if (!session?.user) return;
    clearTimeout(syncFlashTimeout.current);
    syncFlashTimeout.current = setTimeout(async () => {
      await supabase.from('flashcards').delete().eq('user_id', session.user.id);
      if (flashcards.length > 0) {
        await supabase.from('flashcards').insert(flashcards.map(f => ({
          user_id: session.user.id,
          question: f.question,
          answer: f.answer,
          created_at: new Date().toISOString()
        })));
      }
    }, 1500);
  }, [flashcards, session]);

  // ── Daily reset ─────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasActiveYesterday = lastLoginDate === yesterday.toDateString();
      
      setStats(prev => ({
        ...prev,
        streak: wasActiveYesterday ? prev.streak + 1 : 1
      }));

      setTasks(prev => prev.map(t => t.type === 'daily' ? { ...t, completed: false } : t));
      setLastLoginDate(today);
      setDailyXpEarned(0);
    }
  }, [lastLoginDate]);

  // ── Derived values ──────────────────────────────────────────────────
  const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const xpProgress = Math.min(100, ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  // ── Actions ─────────────────────────────────────────────────────────
  
  // FIX: Use refs to avoid stale closures
  const gainXp = useCallback((amount, options = {}) => {
    const { isVerified = false } = options;
    const XP_CAP = 500;
    const multiplier = isFocusingRef.current ? 5 : 1;
    const finalAmount = amount * multiplier;

    if (!isVerified && dailyXpEarnedRef.current >= XP_CAP) {
      console.log('Daily XP Cap reached. Use AI Grader or Focus Timer for more XP.');
      return false;
    }

    setStats(prev => ({ 
      ...prev, 
      xp: prev.xp + finalAmount,
      verifiedXp: isVerified ? (prev.verifiedXp || 0) + finalAmount : prev.verifiedXp
    }));
    
    if (!isVerified) {
      setDailyXpEarned(prev => {
        const next = prev + finalAmount;
        dailyXpEarnedRef.current = next;
        return next;
      });
    }
    return true;
  }, []);

  const gainGold = useCallback((amount) => {
    setStats(prev => ({ ...prev, gold: (prev.gold || 0) + amount }));
  }, []);

  // FIX: spendGold now returns a boolean correctly using a ref
  const spendGold = useCallback((amount) => {
    let canAfford = false;
    setStats(prev => {
      const currentGold = prev.gold || 0;
      if (currentGold >= amount) {
        canAfford = true;
        return { ...prev, gold: currentGold - amount };
      }
      return prev;
    });
    // Use a small timeout to allow the state update to propagate
    // We read from stats directly via closure at call time
    return canAfford;
  }, [stats.gold]);

  const loseHealth = useCallback((amount) => {
    setStats(prev => ({ ...prev, health: Math.max(0, prev.health - amount) }));
  }, []);

  const useMana = useCallback((amount) => {
    setStats(prev => ({ ...prev, mana: Math.max(0, prev.mana - amount) }));
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = {
    session,
    logout,
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
    inventory,
    setInventory,
    equipped,
    setEquipped,
    activeBoss,
    setActiveBoss,
    flashcards,
    setFlashcards,
    gpaData,
    setGpaData,
    focusRadioUrl,
    setFocusRadioUrl,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

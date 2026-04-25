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
  });

  const [tasks, setTasks] = useLocalStorage('questlog_tasks', []);
  const [habits, setHabits] = useLocalStorage('questlog_habits', []);
  const [notes, setNotes] = useLocalStorage('questlog_notes', []);
  const [lastLoginDate, setLastLoginDate] = useLocalStorage('questlog_last_login', new Date().toDateString());

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
          mana: profile.mana
        });
      }

      const { data: dbTasks } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
      if (dbTasks) setTasks(dbTasks.map(t => ({ ...t, createdAt: t.created_at })));
      
      const { data: dbHabits } = await supabase.from('habits').select('*').eq('user_id', session.user.id);
      if (dbHabits) setHabits(dbHabits.map(h => ({ ...h, habitType: h.habit_type, createdAt: h.created_at })));
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
      last_login_date: lastLoginDate
    }).then();
  }, [stats, lastLoginDate, session]);

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


  // Daily reset check
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      setTasks(prev => prev.map(t => t.type === 'daily' ? { ...t, completed: false } : t));
      setLastLoginDate(today);
    }
  }, [lastLoginDate, setTasks, setLastLoginDate]);


  const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const xpProgress = ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const gainXp = useCallback((amount) => {
    setStats((prev) => ({ ...prev, xp: prev.xp + amount }));
  }, [setStats]);

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
    tasks,
    setTasks,
    habits,
    setHabits,
    notes,
    setNotes,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

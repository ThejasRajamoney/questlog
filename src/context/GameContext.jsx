import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';

const GameContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [hydratedSessionId, setHydratedSessionId] = useState(null);
  
  const [stats, setStats] = useLocalStorage('questlog_stats', {
    xp: 0,
    health: 100,
    mana: 50,
    gold: 0,
    verifiedXp: 0,
    streak: 1,
    goldEarnedToday: 0,
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
  const setIsFocusing = useCallback((val) => {
    isFocusingRef.current = val;
    _setIsFocusing(val);
  }, []);

  const dailyXpEarnedRef = useRef(dailyXpEarned);
  useEffect(() => { dailyXpEarnedRef.current = dailyXpEarned; }, [dailyXpEarned]);

  const fetchedUserIdRef = useRef(null);
  const hydratedUserIdRef = useRef(null);
  const statsSyncTimeoutRef = useRef(null);
  const taskSyncTimeoutRef = useRef(null);
  const habitSyncTimeoutRef = useRef(null);
  const rewardSyncTimeoutRef = useRef(null);
  const flashcardSyncTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // ── Midnight Reset Cron ─────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate === today) return;

    const todoTasks = tasks.filter(t => t.type === 'todo');
    const missedTasks = todoTasks.filter(t => !t.completed);

    if (missedTasks.length > 0) {
      const damage = missedTasks.length * 5;
      setStats(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage),
        streak: 0,
        goldEarnedToday: 0,
      }));
      setTimeout(() => alert(`You left ${missedTasks.length} tasks unfinished yesterday! You took ${damage} damage and lost your streak!`), 1000);
    } else if (todoTasks.length > 0) {
      setStats(prev => ({
        ...prev,
        streak: prev.streak + 1,
        goldEarnedToday: 0,
      }));
    } else {
      setStats(prev => ({ ...prev, goldEarnedToday: 0 }));
    }

    setTasks(prev => prev.map(t => (t.type === 'daily' ? { ...t, completed: false } : t)));
    setDailyXpEarned(0);
    setLastLoginDate(today);
  }, [lastLoginDate, tasks, setStats, setTasks, setDailyXpEarned, setLastLoginDate]);

  // ── Auth listener ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch from Supabase on login (runs ONCE per session) ────────────
  useEffect(() => {
    if (!session?.user) {
      fetchedUserIdRef.current = null;
      hydratedUserIdRef.current = null;
      return;
    }

    if (fetchedUserIdRef.current === session.user.id) return;
    fetchedUserIdRef.current = session.user.id;
    hydratedUserIdRef.current = null;
    const userId = session.user.id;

    const fetchData = async () => {
      try {
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('xp, gold, health, mana, verified_xp, streak, gpa_data')
          .eq('id', userId)
          .maybeSingle();

        if (fetchedUserIdRef.current !== userId) return;
        
        if (pError) {
          console.warn('Profile Fetch Error (PostgREST):', pError.message);
        } else if (profile) {
          setStats(prev => ({
            ...prev,
            xp: profile.xp ?? 0,
            gold: profile.gold ?? 0,
            health: profile.health ?? 100,
            mana: profile.mana ?? 50,
            verifiedXp: profile.verified_xp ?? 0,
            streak: profile.streak ?? 1,
          }));
          setGpaData(profile.gpa_data || { gpa: 4.0, target: 4.0, courses: [] });
        }
      } catch (err) {
        console.error('Critical Profile Fetch Error:', err);
      }

      if (fetchedUserIdRef.current !== userId) return;

      const { data: dbTasks, error: tasksError } = await supabase.from('tasks').select('*').eq('user_id', userId);
      if (tasksError) {
        console.warn('Tasks Fetch Error:', tasksError.message);
      } else {
        setTasks((dbTasks ?? []).map(t => ({ ...t, createdAt: t.created_at })));
      }

      if (fetchedUserIdRef.current !== userId) return;

      const { data: dbHabits, error: habitsError } = await supabase.from('habits').select('*').eq('user_id', userId);
      if (habitsError) {
        console.warn('Habits Fetch Error:', habitsError.message);
      } else {
        setHabits((dbHabits ?? []).map(h => ({ ...h, habitType: h.habit_type, createdAt: h.created_at })));
      }

      if (fetchedUserIdRef.current !== userId) return;

      const { data: dbRewards, error: rewardsError } = await supabase.from('rewards').select('*').eq('user_id', userId);
      if (rewardsError) {
        console.warn('Rewards Fetch Error:', rewardsError.message);
      } else {
        setRewards(dbRewards ?? []);
      }

      if (fetchedUserIdRef.current !== userId) return;

      const { data: dbFlash, error: flashError } = await supabase.from('flashcards').select('*').eq('user_id', userId);
      if (flashError) {
        console.warn('Flashcards Fetch Error:', flashError.message);
      } else {
        setFlashcards(dbFlash ?? []);
      }

      if (fetchedUserIdRef.current !== userId) return;

      hydratedUserIdRef.current = userId;
      setHydratedSessionId(userId);
    };

    fetchData();
  }, [session, setStats, setGpaData, setTasks, setHabits, setRewards, setFlashcards]);

  // ── Debounced sync helpers ──────────────────────────────────────────
  useEffect(() => {
    if (!session?.user || hydratedSessionId !== session.user.id) return undefined;

    clearTimeout(statsSyncTimeoutRef.current);
    statsSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          xp: stats.xp ?? 0,
          gold: stats.gold ?? 0,
          health: stats.health ?? 100,
          mana: stats.mana ?? 50,
          streak: stats.streak ?? 1,
          gpa_data: gpaData,
        });
        if (error) console.warn('Supabase Sync Warning:', error.message);
      } catch (e) {
        console.error('Supabase Sync Error:', e);
      }
    }, 2000);

    return () => clearTimeout(statsSyncTimeoutRef.current);
  }, [stats, gpaData, session, hydratedSessionId]);

  // Sync tasks (debounced)
  useEffect(() => {
    if (!session?.user || hydratedSessionId !== session.user.id) return undefined;

    clearTimeout(taskSyncTimeoutRef.current);
    taskSyncTimeoutRef.current = setTimeout(async () => {
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

    return () => clearTimeout(taskSyncTimeoutRef.current);
  }, [tasks, session, hydratedSessionId]);

  // Sync habits (debounced)
  useEffect(() => {
    if (!session?.user || hydratedSessionId !== session.user.id) return undefined;

    clearTimeout(habitSyncTimeoutRef.current);
    habitSyncTimeoutRef.current = setTimeout(async () => {
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

    return () => clearTimeout(habitSyncTimeoutRef.current);
  }, [habits, session, hydratedSessionId]);

  // Sync rewards (debounced)
  useEffect(() => {
    if (!session?.user || hydratedSessionId !== session.user.id) return undefined;

    clearTimeout(rewardSyncTimeoutRef.current);
    rewardSyncTimeoutRef.current = setTimeout(async () => {
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

    return () => clearTimeout(rewardSyncTimeoutRef.current);
  }, [rewards, session, hydratedSessionId]);

  // Sync flashcards (debounced)
  useEffect(() => {
    if (!session?.user || hydratedSessionId !== session.user.id) return undefined;

    clearTimeout(flashcardSyncTimeoutRef.current);
    flashcardSyncTimeoutRef.current = setTimeout(async () => {
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
    return () => clearTimeout(flashcardSyncTimeoutRef.current);
  }, [flashcards, session, hydratedSessionId]);

  // ── Derived values ──────────────────────────────────────────────────
  const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const xpProgress = Math.min(100, ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  // ── Actions ─────────────────────────────────────────────────────────
  
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    clearTimeout(notificationTimeoutRef.current);
    setNotification({ message, type, id: crypto.randomUUID() });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(notificationTimeoutRef.current), []);
  
  // FIX: Use refs to avoid stale closures
  const gainXp = useCallback((amount, options = {}) => {
    const { isVerified = false } = options;
    const XP_CAP = 500;
    const multiplier = isFocusingRef.current ? 5 : 1;
    const requestedAmount = amount * multiplier;

    if (!isVerified) {
      const remaining = Math.max(0, XP_CAP - dailyXpEarnedRef.current);
      if (remaining <= 0) {
        showNotification("Daily XP Cap reached! Use the AI Assignment Grader for Verified XP!", "warning");
        return false;
      }

      const finalAmount = Math.min(requestedAmount, remaining);
      if (finalAmount < requestedAmount) {
        showNotification(`Daily XP Cap reached! You earned ${finalAmount} XP.`, 'warning');
      }
      setStats(prev => ({
        ...prev,
        xp: (prev.xp || 0) + finalAmount,
      }));

      setDailyXpEarned(prev => {
        const next = prev + finalAmount;
        dailyXpEarnedRef.current = next;
        return next;
      });
      return true;
    }

    setStats(prev => ({
      ...prev,
      xp: (prev.xp || 0) + requestedAmount,
      verifiedXp: (prev.verifiedXp || 0) + requestedAmount,
    }));
    return true;
  }, [showNotification, setStats, setDailyXpEarned]);

  const gainGold = useCallback((amount) => {
    const GOLD_CAP = 100;
    const earnedToday = stats.goldEarnedToday || 0;
    const remaining = Math.max(0, GOLD_CAP - earnedToday);
    if (remaining <= 0) return;
    const allowedAmount = Math.min(amount, remaining);
    if (allowedAmount < amount) {
      showNotification(`Daily gold cap reached! You earned ${allowedAmount} Gold.`, 'warning');
    }
    setStats(prev => ({
      ...prev,
      gold: (prev.gold || 0) + allowedAmount,
      goldEarnedToday: earnedToday + allowedAmount
    }));
  }, [stats.goldEarnedToday, setStats, showNotification]);

  // FIX: spendGold now returns a boolean correctly using a ref
  const spendGold = useCallback((amount) => {
    if ((stats.gold || 0) < amount) return false;
    setStats(prev => ({ ...prev, gold: (prev.gold || 0) - amount }));
    return true;
  }, [stats.gold, setStats]);

  const loseHealth = useCallback((amount) => {
    setStats(prev => ({ ...prev, health: Math.max(0, prev.health - amount) }));
  }, [setStats]);

  const useMana = useCallback((amount) => {
    setStats(prev => ({ ...prev, mana: Math.max(0, prev.mana - amount) }));
  }, [setStats]);

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
    notification,
    showNotification
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

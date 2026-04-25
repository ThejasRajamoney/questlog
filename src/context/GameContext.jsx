import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [stats, setStats] = useLocalStorage('questlog_stats', {
    xp: 0,
    health: 100,
    mana: 50,
  });

  const [tasks, setTasks] = useLocalStorage('questlog_tasks', []);
  const [habits, setHabits] = useLocalStorage('questlog_habits', []);
  const [notes, setNotes] = useLocalStorage('questlog_notes', []);

  const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const xpProgress = ((stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const gainXp = useCallback((amount) => {
    setStats((prev) => ({ ...prev, xp: prev.xp + amount }));
  }, [setStats]);

  const loseHealth = useCallback((amount) => {
    setStats((prev) => ({ ...prev, health: Math.max(0, prev.health - amount) }));
  }, [setStats]);

  const useMana = useCallback((amount) => {
    setStats((prev) => ({ ...prev, mana: Math.max(0, prev.mana - amount) }));
  }, [setStats]);

  const value = {
    stats,
    level,
    xpProgress,
    nextLevelXp,
    gainXp,
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

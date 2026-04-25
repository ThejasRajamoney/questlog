import React from 'react';
import { useGame } from '../context/GameContext';
import { Heart, Zap, Sparkles, Coins } from 'lucide-react';

export function Topbar() {
  const { stats, level, xpProgress, nextLevelXp } = useGame();

  const healthPct = stats.health;
  const manaPct = stats.mana;

  const getPet = (lvl) => {
    if (lvl < 5) return { emoji: '💧', name: 'Slime Drop' };
    if (lvl < 10) return { emoji: '🔵', name: 'Blue Slime' };
    if (lvl < 20) return { emoji: '🛡️', name: 'Armored Slime' };
    return { emoji: '👑', name: 'King Slime' };
  };

  const pet = getPet(level);

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-40 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar + Level badge */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex flex-col items-center justify-center shadow-md">
            <span className="text-white text-lg font-black leading-none">{level}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white text-[12px] shadow-sm" title={`Pet: ${pet.name}`}>
            {pet.emoji}
          </div>
        </div>

        {/* Bars */}
        <div className="flex-1 space-y-1.5 max-w-[200px]">
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-sky-500 fill-sky-500 shrink-0" />
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${manaPct}%` }}
              />
            </div>
          </div>

          {/* XP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-600 shrink-0">XP</span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gold & Stats */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-xl border border-amber-100 shadow-sm">
          <Coins size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-sm font-black text-amber-600">{stats.gold || 0}</span>
        </div>
      </div>
    </header>
  );
}

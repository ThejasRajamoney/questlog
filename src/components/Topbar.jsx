import React from 'react';
import { useGame } from '../context/GameContext';
import { Heart, Zap, Sparkles } from 'lucide-react';

export function Topbar() {
  const { stats, level, xpProgress, nextLevelXp } = useGame();

  const healthPct = stats.health;
  const manaPct = stats.mana;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar + Level badge */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-black">{level}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            <Sparkles size={10} className="text-white fill-white" />
          </div>
        </div>

        {/* Bars */}
        <div className="flex-1 space-y-1.5">
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${healthPct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-semibold w-6 text-right">{stats.health}</span>
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
            <span className="text-[10px] text-gray-400 font-semibold w-6 text-right">{stats.mana}</span>
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
            <span className="text-[10px] text-gray-400 font-semibold w-12 text-right">{stats.xp} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
}

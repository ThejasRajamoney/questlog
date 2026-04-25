import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Star, Medal, Users } from 'lucide-react';
import { clsx } from 'clsx';

const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

export function Leaderboard() {
  const { stats, level } = useGame();

  // Only the real user — no fake data
  const allUsers = useMemo(() => [
    {
      id: 'me',
      name: 'Hero Student (You)',
      avatar: '⭐',
      xp: stats.xp,
      level,
      isCurrentUser: true,
    },
  ], [stats.xp, level]);

  const myRank = 1;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">How do you compare?</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Leaderboard</h1>
      </div>

      {/* Your rank card */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-3xl shadow-md">
          ⭐
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Your Rank</p>
          <p className="text-gray-800 font-black text-2xl">#{myRank}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-semibold">Total XP</p>
          <p className="font-black text-orange-500 text-lg">{stats.xp.toLocaleString()}</p>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-50">
          <Trophy size={18} className="text-orange-500" />
          <h3 className="font-black text-gray-800 text-base">Top Scholars</h3>
        </div>

        {allUsers.length === 1 ? (
          <div className="flex flex-col items-center py-10 px-6 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center">
              <Users size={32} className="text-orange-300" />
            </div>
            <p className="font-bold text-gray-500">You're the only one here so far!</p>
            <p className="text-sm text-gray-400">Complete tasks to earn XP and climb the ranks when others join.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allUsers.map((user, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={user.id}
                  className={clsx(
                    'flex items-center gap-3 px-5 py-3.5 transition-colors',
                    user.isCurrentUser ? 'bg-orange-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                    isTop3
                      ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]} shadow-sm`
                      : 'bg-gray-100'
                  )}>
                    {isTop3
                      ? <Medal size={16} className="text-white" />
                      : <span className="text-xs font-black text-gray-400">{rank}</span>}
                  </div>

                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl shrink-0">
                    {user.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'font-bold text-sm truncate',
                      user.isCurrentUser ? 'text-orange-600' : 'text-gray-800'
                    )}>
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-emerald-500 fill-emerald-500" />
                      <span className="text-[11px] text-gray-400 font-semibold">Level {user.level}</span>
                    </div>
                  </div>

                  <span className={clsx(
                    'text-sm font-black',
                    isTop3 ? 'text-amber-500' : user.isCurrentUser ? 'text-orange-500' : 'text-gray-500'
                  )}>
                    {user.xp.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

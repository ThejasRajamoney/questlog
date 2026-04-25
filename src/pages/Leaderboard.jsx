import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { supabase } from '../lib/supabase';
import { Trophy, Star, Medal, Users, Loader2, ShieldCheck, Flame } from 'lucide-react';
import { clsx } from 'clsx';

const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

export function Leaderboard() {
  const { session, stats } = useGame();
  const [globalUsers, setGlobalUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, xp, verified_xp, streak')
        .order('xp', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setGlobalUsers(data.map((u, i) => ({
          id: u.id,
          name: u.id === session?.user?.id ? 'Hero Student (You)' : `Explorer #${u.id.slice(0, 4)}`,
          avatar: ['🔥', '⚔️', '🛡️', '🧙', '🏹', '💎'][i % 6],
          xp: u.xp,
          verifiedXp: u.verified_xp || 0,
          streak: u.streak || 1,
          level: Math.floor(Math.sqrt(u.xp / 100)) + 1,
          isCurrentUser: u.id === session?.user?.id
        })));
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [session, stats.xp]);

  const myRank = globalUsers.findIndex(u => u.isCurrentUser) + 1;

  return (
    <div className="space-y-4 pb-4">
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">The Global Ranks</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Hall of Heroes</h1>
      </div>

      {/* Your rank card */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-3xl shadow-md relative">
          {myRank === 1 ? '👑' : '⭐'}
          {stats.verifiedXp > 0 && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Global Rank</p>
          <div className="flex items-center gap-2">
            <p className="text-gray-800 font-black text-2xl">{loading ? '...' : `#${myRank || '?'}`}</p>
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              <Flame size={12} className="text-orange-500 fill-orange-500" />
              <span className="text-xs font-black text-orange-600">{stats.streak}d</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-semibold">Verified XP</p>
          <p className="font-black text-emerald-500 text-lg">{stats.verifiedXp?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden min-h-[300px]">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-50">
          <Trophy size={18} className="text-orange-500" />
          <h3 className="font-black text-gray-800 text-base">Top 10 Legends</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-orange-400" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {globalUsers.map((user, index) => {
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
                    isTop3 ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]} shadow-sm` : 'bg-gray-100'
                  )}>
                    {isTop3 ? <Medal size={16} className="text-white" /> : <span className="text-xs font-black text-gray-400">{rank}</span>}
                  </div>

                  <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl shrink-0">
                    {user.avatar}
                    {user.verifiedXp > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                        <ShieldCheck size={10} className="text-emerald-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={clsx('font-black text-sm truncate', user.isCurrentUser ? 'text-orange-600' : 'text-gray-800')}>
                        {user.name}
                      </p>
                      <div className="flex items-center gap-0.5 text-orange-400">
                        <Flame size={10} className="fill-orange-400" />
                        <span className="text-[10px] font-bold">{user.streak}d</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-emerald-500 fill-emerald-500" />
                      <span className="text-[11px] text-gray-400 font-bold tracking-tight">LEVEL {user.level}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={clsx('text-sm font-black', isTop3 ? 'text-amber-500' : 'text-gray-500')}>
                      {user.xp.toLocaleString()}
                    </p>
                    {user.verifiedXp > 0 && (
                      <p className="text-[9px] font-black text-emerald-500 tracking-tighter">VERIFIED</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Legend */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-emerald-800">Become a Verified Scholar</p>
          <p className="text-[10px] text-emerald-600 leading-tight">Use the AI Assignment Grader in the Project tab to earn Verified XP and a Shield badge!</p>
        </div>
      </div>
    </div>
  );
}

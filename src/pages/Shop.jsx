import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Plus, Trash2, Tag, Gift } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function Shop() {
  const { stats, spendGold } = useGame();
  const [rewards, setRewards] = useLocalStorage('questlog_rewards', [
    { id: '1', title: '1 hr of Video Games', cost: 50 },
    { id: '2', title: 'Watch an Episode', cost: 30 },
    { id: '3', title: 'Buy a Coffee', cost: 100 },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');

  const addReward = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCost) return;
    setRewards([{ id: crypto.randomUUID(), title: newTitle.trim(), cost: Number(newCost) }, ...rewards]);
    setNewTitle('');
    setNewCost('');
  };

  const deleteReward = (id) => setRewards(rewards.filter(r => r.id !== id));

  const buyReward = (reward) => {
    if (spendGold(reward.cost)) {
      alert(`🎉 You bought: ${reward.title}! Enjoy your reward!`);
    } else {
      alert(`Not enough gold! You need ${reward.cost - (stats.gold || 0)} more.`);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">Treat yourself</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Rewards Shop</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Your Balance</p>
          <div className="flex items-center gap-2 mt-1">
            <Coins size={24} className="text-amber-500 fill-amber-500" />
            <p className="text-gray-800 font-black text-3xl">{stats.gold || 0}</p>
          </div>
        </div>
      </div>

      {/* Add Reward Form */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden p-4">
        <h3 className="font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Tag size={16} className="text-amber-500" />
          Create Custom Reward
        </h3>
        <form onSubmit={addReward} className="flex gap-2">
          <input type="text" placeholder="Reward name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
          <input type="number" placeholder="Cost" value={newCost} onChange={e => setNewCost(e.target.value)} className="w-16 shrink-0 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-amber-400" />
          <button type="submit" className="w-10 h-10 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors">
            <Plus size={20} />
          </button>
        </form>
      </div>

      {/* Rewards List */}
      <div className="space-y-3">
        {rewards.map(reward => {
          const canAfford = (stats.gold || 0) >= reward.cost;
          return (
            <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 slide-up">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Gift size={20} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{reward.title}</p>
                <button onClick={() => deleteReward(reward.id)} className="text-[10px] text-rose-400 hover:text-rose-500 font-bold uppercase tracking-wide">Delete</button>
              </div>
              <button 
                onClick={() => buyReward(reward)}
                className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-1.5 transition-all active:scale-95 ${canAfford ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Coins size={14} className={canAfford ? 'fill-white' : 'fill-gray-400'} />
                {reward.cost}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

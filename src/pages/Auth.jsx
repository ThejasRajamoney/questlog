import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: isSignUp ? 'Check your email for the confirmation link!' : 'Logged in!' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            {isSignUp ? 'Create Quest Account' : 'Welcome Back, Hero'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Sync your progress across all devices</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all"
              placeholder="hero@questlog.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {message && (
          <div className={clsx(
            "p-4 rounded-2xl text-xs font-bold text-center border",
            message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
          )}>
            {message.text}
          </div>
        )}

        <div className="text-center pt-2">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-gray-400 hover:text-emerald-500 transition-colors"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

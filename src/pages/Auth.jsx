import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { LogIn, UserPlus, ShieldCheck, Sparkles, Sword, Trophy } from 'lucide-react';
import gsap from 'gsap';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState(null);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const formRef = useRef(null);
  const floatersRef = useRef([]);

  useEffect(() => {
    // Initial entry animation
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 })
        .fromTo(cardRef.current, { y: 100, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" }, "-=0.5")
        .fromTo(titleRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" }, "-=0.8")
        .fromTo(formRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");

      // Floating icons animation
      floatersRef.current.forEach((el, i) => {
        gsap.to(el, {
          y: "random(-20, 20)",
          x: "random(-20, 20)",
          rotation: "random(-15, 15)",
          duration: "random(2, 4)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });
    });

    return () => ctx.revert();
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      gsap.fromTo(cardRef.current, { x: -10 }, { x: 0, duration: 0.1, repeat: 5, yoyo: true });
    } else {
      setMessage({ type: 'success', text: isSignUp ? 'Success! Check your email for a link.' : 'Victory! Logging in...' });
    }
    setLoading(false);
  };

  return (
    <div ref={containerRef} className="min-h-screen relative flex items-center justify-center bg-[#0a0a0c] overflow-hidden px-4 font-sans select-none">
      
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Floating Quest Icons */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {[Sword, Trophy, Sparkles, ShieldCheck].map((Icon, i) => (
          <div 
            key={i} 
            ref={el => floatersRef.current[i] = el}
            className="absolute text-emerald-500/20"
            style={{ 
              top: `${20 + i * 20}%`, 
              left: `${i % 2 === 0 ? 15 : 80}%`,
              filter: 'blur(1px)'
            }}
          >
            <Icon size={48 + i * 12} strokeWidth={1} />
          </div>
        ))}
      </div>

      <div ref={cardRef} className="relative w-full max-w-[440px] bg-white/[0.03] backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 p-8 md:p-12 space-y-8">
        
        <div ref={titleRef} className="text-center space-y-2">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 mb-2">
            <Sparkles className="text-emerald-400 animate-pulse" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {isSignUp ? 'Begin Your Journey' : 'Resume Your Quest'}
          </h1>
          <p className="text-emerald-500/60 text-sm font-bold tracking-wide uppercase">
            {isSignUp ? 'Join the rank of scholars' : 'The library awaits your return'}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Identify Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
              placeholder="e.g. merlin@questlog.com"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Secret Code</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            disabled={loading}
            className="group relative w-full py-5 rounded-2xl bg-emerald-500 overflow-hidden text-white font-black text-sm shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus size={18} strokeWidth={3} /> : <LogIn size={18} strokeWidth={3} />}
                  <span>{isSignUp ? 'Create Avatar' : 'Enter Workspace'}</span>
                </>
              )}
            </div>
          </button>
        </form>

        {message && (
          <div className={clsx(
            "p-5 rounded-2xl text-xs font-black text-center border animate-in fade-in slide-in-from-top-4 duration-500",
            message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          )}>
            {message.text}
          </div>
        )}

        <div className="text-center pt-4 border-t border-white/5">
          <button 
            onClick={() => {
              gsap.to(cardRef.current, { opacity: 0, x: isSignUp ? 20 : -20, duration: 0.3, onComplete: () => setIsSignUp(!isSignUp) });
            }}
            className="text-[11px] font-black text-white/40 hover:text-emerald-400 tracking-widest uppercase transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isSignUp ? 'Already a legend? Log In' : "New hero? Start your legend"}
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">
        QuestLog © 2026
      </div>
    </div>
  );
}

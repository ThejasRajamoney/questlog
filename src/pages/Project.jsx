import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Timer, Brain, BookOpen, Flame, Loader2 } from 'lucide-react';
import { AssignmentGrader } from '../components/AssignmentGrader';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { clsx } from 'clsx';

// ─── Focus Timer (functional countdown) ──────────────────────────────
function FocusTimerModule() {
  const { gainXp, gainGold, setIsFocusing } = useGame();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const timerRef = React.useRef(null);

  const toggle = () => {
    if (running) {
      clearInterval(timerRef.current);
      setRunning(false);
      setIsFocusing(false);
    } else {
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            setIsFocusing(false);
            gainXp(50);
            gainGold(10);
            alert("Pomodoro finished! You earned 50 XP and 10 Gold!");
            return 25 * 60;
          }
          return s - 1;
        });
      }, 1000);
      setRunning(true);
      setIsFocusing(true);
    }
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setSeconds(25 * 60);
  };

  React.useEffect(() => () => clearInterval(timerRef.current), []);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="flex flex-col items-center py-2 gap-2">
      <span className="font-pixel text-2xl text-violet-600 tracking-widest">
        {mins}:{secs}
      </span>
      <div className="flex gap-2 mt-1">
        <button
          onClick={toggle}
          className="px-4 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-black transition-transform active:scale-95"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold transition-transform active:scale-95"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Reading Tracker (user-entered books) ────────────────────────────
function ReadingTrackerModule() {
  const [books, setBooks] = useLocalStorage('questlog_reading', []);
  const [input, setInput] = useState('');

  const addBook = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setBooks([...books, { title: input.trim(), pct: 0 }]);
    setInput('');
  };

  const updatePct = (i, val) => {
    setBooks(books.map((b, idx) => idx === i ? { ...b, pct: Number(val) } : b));
  };

  return (
    <div className="py-2 space-y-2">
      {books.length === 0 && (
        <p className="text-xs text-gray-400 text-center pb-1">No books added yet</p>
      )}
      {books.map((book, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-gray-600 font-semibold truncate">{book.title}</span>
            <span className="text-[10px] text-gray-400 font-semibold">{book.pct}%</span>
          </div>
          <input
            type="range"
            min={0} max={100}
            value={book.pct}
            onChange={(e) => updatePct(i, e.target.value)}
            className="w-full accent-indigo-500"
          />
        </div>
      ))}
      <form onSubmit={addBook} className="flex gap-1 pt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a book..."
          className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-indigo-400"
        />
        <button type="submit" className="w-7 h-7 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
          <Plus size={14} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
}

// ─── Streak Tracker (counts completed tasks from context) ─────────────
function StreakModule() {
  const { tasks } = useGame();
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col items-center py-2">
      <Flame
        size={36}
        className={completedCount > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}
      />
      <span className="font-black text-gray-800 text-2xl mt-1">{completedCount}</span>
      <span className="text-xs text-gray-400 font-semibold">tasks completed</span>
    </div>
  );
}

// ─── AI Assistant (Task breakdown using Groq) ───────────────────────────
function AIAssistantModule() {
  const { setTasks } = useGame();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const breakdownTask = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) { setError('API Key missing in .env'); return; }

    setLoading(true);
    setError(null);
    
    try {
      const PROMPT = `You are an AI task planner. Break this large task into 3-5 small, actionable sub-tasks. Respond ONLY with a valid JSON array of strings. Task: "${input}"`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: PROMPT }],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      const jsonStr = raw.replace(/```json|```/g, '').trim();
      const subtasks = JSON.parse(jsonStr);

      if (!Array.isArray(subtasks)) throw new Error('Invalid format');

      const newTasks = subtasks.map(t => ({
        id: crypto.randomUUID(),
        text: t,
        type: 'todo',
        completed: false,
        createdAt: new Date().toISOString()
      }));

      setTasks(prev => [...newTasks, ...prev]);
      setInput('');
      setError('✅ Added to To-Dos!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError('Failed to break down task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-2">
      <form onSubmit={breakdownTask} className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Write a 10 page paper"
          className="w-full text-xs bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-300 resize-none"
          rows={2}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-1.5 rounded-xl bg-fuchsia-500 text-white text-[11px] uppercase tracking-wider font-black flex items-center justify-center gap-1 hover:bg-fuchsia-600 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
          Break Down Task
        </button>
      </form>
      {error && <p className={clsx("text-center text-[10px] mt-2 font-bold", error.includes('✅') ? "text-emerald-500" : "text-rose-500")}>{error}</p>}
    </div>
  );
}

// ─── MODULE DEFINITIONS ───────────────────────────────────────────────
const MODULES = [
  {
    id: 'focus',
    icon: Timer,
    title: 'Focus Timer',
    subtitle: 'Pomodoro • 25 min',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    accent: 'bg-violet-500',
    content: <FocusTimerModule />,
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'AI Assistant',
    subtitle: 'Task breakdown',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    accent: 'bg-fuchsia-500',
    content: <AIAssistantModule />,
  },
  {
    id: 'reading',
    icon: BookOpen,
    title: 'Reading Tracker',
    subtitle: 'Books & progress',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    accent: 'bg-indigo-500',
    content: <ReadingTrackerModule />,
  },
  {
    id: 'streak',
    icon: Flame,
    title: 'Completion Count',
    subtitle: 'Tasks done',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    accent: 'bg-orange-500',
    content: <StreakModule />,
  },
];

// ─── PROJECT PAGE ─────────────────────────────────────────────────────
export function Project() {
  return (
    <div className="space-y-4 pb-4">
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">Your workspace</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Projects</h1>
      </div>

      {/* ── AI Assignment Grader (full-width featured) ── */}
      <AssignmentGrader />

      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
              <div className={`${mod.bg} px-4 pt-4 pb-2 flex items-center gap-2`}>
                <div className={`w-8 h-8 ${mod.accent} rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-gray-800 text-sm truncate">{mod.title}</h3>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{mod.subtitle}</p>
                </div>
              </div>
              <div className="px-4 pb-4">{mod.content}</div>
            </div>
          );
        })}

        {/* Add Module slot */}
        <div className="bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-8 cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors col-span-2">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
            <Plus size={20} className="text-gray-400" />
          </div>
          <span className="text-sm font-bold text-gray-400">Add Module</span>
        </div>
      </div>
    </div>
  );
}

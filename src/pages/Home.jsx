import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

// ─── XP Float Animation ──────────────────────────────────────────────
function XpBubble({ id, onDone }) {
  return (
    <div
      className="xp-float pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg"
      onAnimationEnd={onDone}
    >
      +15 XP
    </div>
  );
}

// ─── HABIT ITEM (with +/- circle buttons, Habitica style) ─────────────
function HabitItem({ habit, onPlus, onMinus, onDelete }) {
  const [xpPop, setXpPop] = useState(false);

  const handlePlus = () => {
    onPlus(habit.id);
    setXpPop(true);
  };

  const typeColor = {
    good: 'bg-sky-400',
    bad: 'bg-orange-400',
    both: 'bg-emerald-500',
  }[habit.habitType] || 'bg-emerald-500';

  return (
    <div className="group relative flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 slide-up">
      {/* Colored circle button */}
      <button
        onClick={handlePlus}
        className={clsx(
          "w-11 h-11 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0 transition-transform active:scale-90 shadow-md",
          typeColor
        )}
      >
        {habit.habitType === 'bad' ? '−' : '+'}
      </button>

      {/* Label */}
      <span className="flex-1 text-gray-800 font-semibold text-[15px] leading-tight">
        {habit.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(habit.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-400 transition-all"
      >
        <Trash2 size={16} />
      </button>

      {/* XP pop */}
      {xpPop && <XpBubble id={habit.id} onDone={() => setXpPop(false)} />}
    </div>
  );
}

// ─── DAILY / TODO ITEM ────────────────────────────────────────────────
function TaskItem({ task, onComplete, onDelete }) {
  const [xpPop, setXpPop] = useState(false);

  const handleComplete = () => {
    if (!task.completed) {
      onComplete(task.id);
      setXpPop(true);
    } else {
      onComplete(task.id);
    }
  };

  return (
    <div className={clsx(
      "group relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm border transition-all slide-up",
      task.completed
        ? "bg-gray-50 border-gray-100 opacity-60"
        : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md"
    )}>
      {/* Checkbox circle */}
      <button
        onClick={handleComplete}
        className={clsx(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90",
          task.completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-400"
        )}
      >
        {task.completed && <CheckCircle2 size={16} className="text-white fill-white" strokeWidth={0} />}
      </button>

      <span className={clsx(
        "flex-1 text-[15px] font-semibold leading-tight",
        task.completed ? "line-through text-gray-400" : "text-gray-800"
      )}>
        {task.text}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-400 transition-all"
      >
        <Trash2 size={16} />
      </button>

      {xpPop && <XpBubble id={task.id} onDone={() => setXpPop(false)} />}
    </div>
  );
}

// ─── ADD TASK FORM ────────────────────────────────────────────────────
function AddTaskForm({ placeholder, onAdd, accentColor = 'bg-emerald-500' }) {
  const [text, setText] = useState('');
  const inputRef = useRef();

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex gap-2 mt-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 shadow-sm"
      />
      <button
        type="submit"
        className={clsx(
          "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform active:scale-90",
          accentColor
        )}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </form>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────
function SectionCard({ title, emoji, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-50">
        <span className="text-xl">{emoji}</span>
        <h2 className="text-base font-black text-gray-800 tracking-tight">{title}</h2>
      </div>
      <div className="px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────
export function Home() {
  const { tasks, setTasks, habits, setHabits, gainXp, stats, level, xpProgress } = useGame();

  // Task actions
  const addTask = (type) => (text) => {
    setTasks((prev) => [{
      id: crypto.randomUUID(),
      text,
      type,
      completed: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const completeTask = (id) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id === id) {
        if (!t.completed) gainXp(15);
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  // Habit actions
  const addHabit = (text, habitType = 'both') => {
    setHabits((prev) => [{
      id: crypto.randomUUID(),
      text,
      habitType,
      score: 0,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const scoreHabit = (id) => {
    setHabits((prev) => prev.map((h) => h.id === id ? { ...h, score: h.score + 1 } : h));
    gainXp(10);
  };

  const deleteHabit = (id) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const dailies = tasks.filter((t) => t.type === 'daily');
  const todos = tasks.filter((t) => t.type === 'todo');
  const completedTodos = todos.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 pb-4">
      {/* Page header on gradient */}
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">Welcome back!</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Your Quest Board</h1>
      </div>

      {/* ── Habits ── */}
      <SectionCard title={`${habits.length} Habits`} emoji="⚡">
        {habits.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-2">No habits yet. Add one below!</p>
        )}
        {habits.map((h) => (
          <HabitItem
            key={h.id}
            habit={h}
            onPlus={scoreHabit}
            onDelete={deleteHabit}
          />
        ))}

        {/* Quick-add with type selector */}
        <HabitAddForm onAdd={addHabit} />
      </SectionCard>

      {/* ── Dailies ── */}
      <SectionCard title="Dailies" emoji="🗓">
        {dailies.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-2">No dailies yet.</p>
        )}
        {dailies.map((t) => (
          <TaskItem key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} />
        ))}
        <AddTaskForm placeholder="Add a daily..." onAdd={addTask('daily')} accentColor="bg-sky-500" />
      </SectionCard>

      {/* ── To-Dos ── */}
      <SectionCard title={`To-Dos  ${completedTodos}/${todos.length}`} emoji="✅">
        {todos.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-2">Nothing on the list yet.</p>
        )}
        {todos.map((t) => (
          <TaskItem key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} />
        ))}
        <AddTaskForm placeholder="Add a to-do..." onAdd={addTask('todo')} accentColor="bg-violet-500" />
      </SectionCard>
    </div>
  );
}

// ─── HABIT ADD FORM (with +/-/both picker) ────────────────────────────
function HabitAddForm({ onAdd }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('both');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim(), type);
    setText('');
    setType('both');
  };

  const typeOptions = [
    { value: 'good', label: '+', color: 'bg-sky-400 text-white', outline: 'border-sky-400' },
    { value: 'bad', label: '−', color: 'bg-orange-400 text-white', outline: 'border-orange-400' },
    { value: 'both', label: '±', color: 'bg-emerald-500 text-white', outline: 'border-emerald-500' },
  ];

  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      {/* Type selector */}
      <div className="flex gap-2">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={clsx(
              "flex-1 py-1.5 rounded-xl text-sm font-black border-2 transition-all",
              type === opt.value ? `${opt.color} ${opt.outline}` : "bg-white text-gray-400 border-gray-200"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a habit..."
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 shadow-sm"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md transition-transform active:scale-90"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

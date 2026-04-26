import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

const HABIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const INITIAL_CLOCK = Date.now();

function formatCooldown(ms) {
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── XP Float Animation ──────────────────────────────────────────────
function XpBubble({ onDone, type = 'xp' }) {
  return (
    <div
      className={clsx(
        "xp-float pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg",
        type === 'gold' ? 'bg-amber-400' : 'bg-emerald-500'
      )}
      onAnimationEnd={onDone}
    >
      {type === 'gold' ? '+2 Gold' : '+15 XP'}
    </div>
  );
}

// ─── HABIT ITEM (with +/- circle buttons, Habitica style) ─────────────
function HabitItem({ habit, onPlus, onMinus, onDelete, locked, cooldownText }) {
  const [xpPop, setXpPop] = useState(false);

  const handlePlus = () => {
    if (locked) return;
    onPlus(habit.id);
    setXpPop(true);
  };

  const handleMinus = () => {
    if (locked) return;
    if (onMinus) onMinus(habit.id);
  };

  return (
    <div className="group relative flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 slide-up">
      {/* Colored circle button */}
      {(habit.habitType === 'both' || habit.habitType === 'good') && (
        <button
          onClick={handlePlus}
          disabled={locked}
          className={clsx(
            'w-11 h-11 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0 transition-transform active:scale-90 shadow-md bg-sky-400',
            locked && 'opacity-40 cursor-not-allowed'
          )}
        >
          +
        </button>
      )}
      {(habit.habitType === 'both' || habit.habitType === 'bad') && (
        <button
          onClick={handleMinus}
          disabled={locked}
          className={clsx(
            'w-11 h-11 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0 transition-transform active:scale-90 shadow-md bg-orange-400',
            locked && 'opacity-40 cursor-not-allowed'
          )}
        >
          −
        </button>
      )}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="block truncate text-gray-800 font-semibold text-[15px] leading-tight">
          {habit.text}
        </span>
        {locked && (
          <span className="block text-[10px] font-black uppercase tracking-wider text-rose-500 mt-0.5">
            Locked {cooldownText}
          </span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(habit.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-400 transition-all"
      >
        <Trash2 size={16} />
      </button>

      {/* XP/Gold pop */}
      {xpPop && (
        <>
          <XpBubble onDone={() => setXpPop(false)} />
          <div className="absolute top-2 left-1/3 -translate-x-1/2"><XpBubble type="gold" onDone={() => {}} /></div>
        </>
      )}
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

      {xpPop && (
        <>
          <XpBubble onDone={() => setXpPop(false)} />
          <div className="absolute top-2 left-1/3 -translate-x-1/2"><XpBubble type="gold" onDone={() => {}} /></div>
        </>
      )}
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
  const { tasks, setTasks, habits, setHabits, gainXp, gainGold, loseHealth, equipped, activeBoss, setActiveBoss, showNotification } = useGame();
  const [habitCooldowns, setHabitCooldowns] = useLocalStorage('questlog_habit_cooldowns', {});
  const [clockTick, setClockTick] = useState(INITIAL_CLOCK);
  const habitCooldownRef = useRef(habitCooldowns);

  useEffect(() => {
    const tick = () => setClockTick(Date.now());
    tick();
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    habitCooldownRef.current = habitCooldowns;
  }, [habitCooldowns]);

  const getHabitRemainingFrom = (cooldowns, id) => {
    const lastUsedAt = cooldowns[id];
    if (!lastUsedAt) return 0;
    return Math.max(0, HABIT_COOLDOWN_MS - (clockTick - lastUsedAt));
  };

  const getHabitRemaining = (id) => getHabitRemainingFrom(habitCooldowns, id);

  const lockHabit = (id) => {
    const now = clockTick;
    habitCooldownRef.current = { ...habitCooldownRef.current, [id]: now };
    setHabitCooldowns(prev => ({ ...prev, [id]: now }));
  };

  const runHabitAction = (id, action) => {
    const remaining = getHabitRemainingFrom(habitCooldownRef.current, id);
    if (remaining > 0) {
      showNotification(`That habit is locked for ${formatCooldown(remaining)}.`, 'warning');
      return;
    }

    action(id);
    lockHabit(id);
  };

  const damageBoss = (amount) => {
    if (!activeBoss) return;
    setActiveBoss(prev => {
      const newHp = Math.max(0, prev.hp - amount);
      if (newHp === 0) {
        const defeatedBossId = prev.id;
        setTimeout(() => {
          showNotification(`You defeated ${prev.name}! +50 XP, +20 Gold!`, 'success');
          gainXp(50);
          gainGold(20);
          setActiveBoss(current => (current?.id === defeatedBossId ? null : current));
        }, 300);
      }
      return { ...prev, hp: newHp };
    });
  };

  const spawnBoss = () => {
    const bossNames = ["Calculus Dragon", "Procrastination Demon", "Midterm Monster", "Essay Phantom"];
    const emojis = ["🐉", "👹", "👾", "👻"];
    const idx = Math.floor(Math.random() * bossNames.length);
    setActiveBoss({
      id: crypto.randomUUID(),
      name: bossNames[idx],
      emoji: emojis[idx],
      hp: 100,
      maxHp: 100
    });
  };

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
        if (!t.completed) {
          gainXp(15);
          gainGold(2);
          if (activeBoss) damageBoss(15); // Deal 15 damage to boss
        }
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
    gainGold(1);
    if (activeBoss) damageBoss(10); // Deal 10 damage to boss
  };

  const penaltyHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, score: Math.max(0, h.score - 1) } : h));
    loseHealth(5);
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitCooldowns(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const dailies = tasks.filter((t) => t.type === 'daily');
  const todos = tasks.filter((t) => t.type === 'todo');
  const completedTodos = todos.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 pb-4">
      {/* Page header on gradient */}
      <div className="pb-4 text-center relative z-10 pt-2">
        <h1 className="text-white text-3xl font-black tracking-tight drop-shadow-md">Your Quest Board</h1>
      </div>

      {/* Visual Avatar & Boss Area - Now in a card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-row items-center justify-center gap-8 slide-up relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

        {/* Visual Avatar */}
        <div className="flex flex-col items-center z-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Hero</p>
          <div className="relative w-24 h-24 bg-gray-50 rounded-full border-4 border-white shadow-[0_8px_16px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
            <div className="text-5xl drop-shadow-sm">🧍</div>
            {equipped?.armor && <div className="absolute top-4 text-5xl drop-shadow-md z-10 pointer-events-none">{equipped.armor.emoji}</div>}
            {equipped?.head && <div className="absolute -top-5 text-5xl drop-shadow-md z-20 pointer-events-none">{equipped.head.emoji}</div>}
            {equipped?.weapon && <div className="absolute -right-3 top-6 text-4xl drop-shadow-md z-10 rotate-12 pointer-events-none">{equipped.weapon.emoji}</div>}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-xs font-black text-gray-300 italic z-10">VS</div>

        {/* Boss Battle */}
        <div className="flex flex-col items-center z-10">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Current Target</p>
          {activeBoss ? (
            <div className="relative w-24 h-24 flex flex-col items-center justify-end group">
              <div className="text-5xl drop-shadow-lg animate-bounce mb-2">{activeBoss.emoji}</div>
              
              {/* Boss HP Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden relative shadow-inner">
                <div 
                  className="h-full bg-rose-500 transition-all duration-300" 
                  style={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}
                />
              </div>
              <div className="absolute -bottom-6 text-[9px] font-black text-gray-500 whitespace-nowrap">
                {activeBoss.name} {activeBoss.hp}/{activeBoss.maxHp}
              </div>
            </div>
          ) : (
            <button onClick={spawnBoss} className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-500 transition-all">
              <span className="text-xl mb-1">⚔️</span>
              <span className="text-[9px] font-bold">Summon Boss</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Habits ── */}
      <SectionCard title={`${habits.length} Habits`} emoji="⚡">
        {habits.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-2">No habits yet. Add one below!</p>
        )}
        {habits.map((h) => {
          const remaining = getHabitRemaining(h.id);
          return (
            <HabitItem
              key={h.id}
              habit={h}
              locked={remaining > 0}
              cooldownText={formatCooldown(remaining)}
              onPlus={(id) => runHabitAction(id, scoreHabit)}
              onMinus={(id) => runHabitAction(id, penaltyHabit)}
              onDelete={deleteHabit}
            />
          );
        })}

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
      <SectionCard title={`To-Do's ${completedTodos}/${todos.length}`} emoji="✅">
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

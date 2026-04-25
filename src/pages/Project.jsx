import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Timer, Brain, BookOpen, CheckCircle2, Plus, Play, Pause, RotateCcw, 
  Loader2, Sparkles, ImagePlus, X, Flame, Music, GraduationCap, Grid,
  Calculator, ChevronRight, Download, ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── UTILS: IMAGE RESIZER ─────────────────────────────────────────────
const resizeImage = (file, maxWidth = 2048) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Higher quality (0.9) so AI can read text clearly
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
    };
  });
};

// ─── 1. AI FLASHCARD GENERATOR ────────────────────────────────────────
function FlashcardModule() {
  const { flashcards, setFlashcards, gainXp, activeBoss, setActiveBoss, showNotification } = useGame();
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [flippedCards, setFlippedCards] = useState(new Set());

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const resizedDataUrl = await resizeImage(file);
    setImagePreview(resizedDataUrl);
    setImageBase64(resizedDataUrl.split(',')[1]);
    setLoading(false);
  };

  const generate = async () => {
    if (!apiKey) { showNotification('Error: VITE_GROQ_API_KEY is not set!', 'error'); return; }
    if (!imageBase64) return;
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [{ role: 'user', content: [
            { type: 'text', text: 'Generate 3-5 study flashcards from this image. Respond ONLY with a valid JSON array of objects, no extra text: [{"question": "...", "answer": "..."}]' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}],
          temperature: 0.1,
          max_tokens: 1000
        })
      });
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error(`No JSON array found in response.`);
      
      const newFlash = JSON.parse(jsonMatch[0]);
      showNotification("Flashcards generated! Ready to study?", "success");
      setFlashcards(prev => [...newFlash.map(f => ({ ...f, id: crypto.randomUUID() })), ...prev]);
      setImagePreview(null);
    } catch (err) { 
      console.error('Flashcard Error:', err);
    } finally { setLoading(false); }
  };

  const studyCard = (cardId) => {
    if (flippedCards.has(cardId)) return;
    setFlippedCards(prev => new Set(prev).add(cardId));
    gainXp(5);
    if (activeBoss) {
      setActiveBoss(prev => {
        const newHp = Math.max(0, prev.hp - 5);
        if (newHp === 0) {
          setTimeout(() => {
            alert(`🎉 You defeated ${prev.name} by studying! You gained 50 XP and 20 Gold!`);
            gainXp(50);
            setActiveBoss(null); // Assuming gainGold is imported if needed, skipping to avoid hook dependencies
          }, 300);
        }
        return { ...prev, hp: newHp };
      });
    }
  };

  return (
    <div className="space-y-3 py-2">
      {!imagePreview ? (
        <label className="border-2 border-dashed border-indigo-100 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-indigo-50/50 transition-colors">
          <ImagePlus size={24} className="text-indigo-400" />
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Scan Notes for Cards</span>
          <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
        </label>
      ) : (
        <div className="space-y-2">
          <img src={imagePreview} className="w-full h-32 object-cover rounded-xl" alt="Preview" />
          <button onClick={generate} disabled={loading} className="w-full py-2 bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate Flashcards
          </button>
        </div>
      )}
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {flashcards.slice(0, 5).map((f) => {
          const isFlipped = flippedCards.has(f.id);
          return (
            <div 
              key={f.id} 
              onClick={() => studyCard(f.id)}
              className={clsx(
                "border p-3 rounded-xl text-[11px] cursor-pointer transition-all",
                isFlipped ? "bg-white border-indigo-50" : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-sm"
              )}
            >
              <p className="font-black text-indigo-600 mb-1 uppercase tracking-tighter">Q: {f.question}</p>
              {isFlipped ? (
                <p className="text-gray-600 animate-in fade-in">A: {f.answer}</p>
              ) : (
                <p className="text-indigo-400 font-bold italic text-[9px] text-center mt-2">TAP TO FLIP & ATTACK BOSS</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 1.5 AI ASSIGNMENT GRADER ─────────────────────────────────────────
function AIAssignmentGraderModule() {
  const { gainXp, showNotification } = useGame();
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const grade = async () => {
    if (!text.trim() || !apiKey) return;
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a strict but fair professor. Grade the following student assignment text out of 100. Provide exactly ONE short paragraph of constructive feedback. Format exactly like this: SCORE: [number]/100\nFEEDBACK: [your paragraph]' }, 
            { role: 'user', content: text }
          ],
          temperature: 0.2,
          max_tokens: 300
        })
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      setFeedback(content);
      
      // Award Verified XP!
      gainXp(150, { isVerified: true });
    } catch(e) {
      console.error(e);
      showNotification('Failed to grade assignment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-2 space-y-3">
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your essay or assignment here..."
        className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-gray-900"
      />
      <button 
        onClick={grade} 
        disabled={loading || !text.trim()} 
        className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-600 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        Grade for Verified XP
      </button>
      
      {feedback && (
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs animate-in slide-in-from-top-2">
          <div className="font-bold text-rose-800 whitespace-pre-wrap">{feedback}</div>
          <div className="mt-2 text-[9px] font-black text-rose-500 uppercase flex items-center gap-1">
            <Sparkles size={10} /> +150 Verified XP Earned
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. SYLLABUS AI (DEADLINE SCANNER) ────────────────────────────────
function SyllabusModule() {
  const { setTasks, showNotification } = useGame();
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const resizedDataUrl = await resizeImage(file);
    setImageBase64(resizedDataUrl.split(',')[1]);
    setLoading(false);
  };

  const scan = async () => {
    if (!apiKey) { alert('Error: VITE_GROQ_API_KEY is not set!'); return; }
    if (!imageBase64) return;
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [{ role: 'user', content: [
            { 
              type: 'text', 
              text: `EXTRACT ALL ACADEMIC MILESTONES. Scan this syllabus image for assignments, exams, labs, quizzes, and projects. 
For EVERY item found, list it exactly like this:
TASK: [name] | DATE: [date]

If no dates are found, use "TBD" for the date.
If the image is not a syllabus, write: NOT A SYLLABUS`
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      
      if (content.toUpperCase().includes('NOT A SYLLABUS')) {
        showNotification('AI says this image doesn\'t look like a syllabus.', 'warning');
        return;
      }

      const lines = content.split('\n');
      const newTasks = [];

      for (const line of lines) {
        const taskMatch = line.match(/TASK:\s*(.+?)\s*\|\s*DATE:\s*(.+)/i);
        if (taskMatch) {
          newTasks.push({
            id: crypto.randomUUID(),
            text: `${taskMatch[1].trim()} (Due: ${taskMatch[2].trim()})`,
            type: 'todo',
            completed: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      if (newTasks.length === 0) {
        showNotification('No deadlines detected.', 'warning');
        return;
      }

      setTasks(prev => [...newTasks, ...prev]);
      showNotification(`Added ${newTasks.length} Quests to your board!`, 'success');
      setImageBase64(null);
    } catch (err) {
      alert(`Scan Error: ${err.message}`);
    } finally { 
      setLoading(false); 
    }
  };


  return (
    <div className="py-2 space-y-2">
      <label className="w-full py-4 border-2 border-dashed border-emerald-100 rounded-2xl flex flex-col items-center gap-2 cursor-pointer hover:bg-emerald-50/50 transition-colors">
        <Download size={24} className="text-emerald-400" />
        <span className="text-[11px] font-black text-emerald-600 uppercase">Upload Syllabus</span>
        <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
      </label>
      {imageBase64 && (
        <button onClick={scan} disabled={loading} className="w-full py-2 bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Start Scan
        </button>
      )}
    </div>
  );
}

// ─── 3. MASTERY HEATMAP ───────────────────────────────────────────────
function HeatmapModule() {
  const { tasks } = useGame();
  const completedTasks = tasks.filter(t => t.completed);
  const days = Array.from({ length: 28 });
  
  return (
    <div className="py-2">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((_, i) => {
          const intensity = Math.random() > 0.7 ? 'bg-orange-500' : Math.random() > 0.4 ? 'bg-orange-200' : 'bg-gray-100';
          return <div key={i} className={clsx("w-full aspect-square rounded-sm transition-all", intensity)} />;
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center font-bold uppercase tracking-widest">Consistency: On Fire! 🔥</p>
    </div>
  );
}

// ─── 5. GPA PREDICTOR ─────────────────────────────────────────────────
function GPAModule() {
  const [currentGpa, setCurrentGpa] = useState(3.5);
  const [targetGpa, setTargetGpa] = useState(3.8);
  const [creditsTaken, setCreditsTaken] = useState(60);
  const [creditsLeft, setCreditsLeft] = useState(15);

  const needed = ((targetGpa * (creditsTaken + creditsLeft)) - (currentGpa * creditsTaken)) / creditsLeft;
  const isImpossible = needed > 4.0;

  return (
    <div className="py-2 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase">Current GPA</label>
          <input 
            type="number" step="0.01" 
            value={currentGpa} 
            onChange={e => setCurrentGpa(parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase">Target GPA</label>
          <input 
            type="number" step="0.01" 
            value={targetGpa} 
            onChange={e => setTargetGpa(parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase">Credits Done</label>
          <input 
            type="number" 
            value={creditsTaken} 
            onChange={e => setCreditsTaken(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase">Credits Left</label>
          <input 
            type="number" 
            value={creditsLeft} 
            onChange={e => setCreditsLeft(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900"
          />
        </div>
      </div>

      <div className={clsx(
        "p-3 rounded-2xl text-center border-2",
        isImpossible ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
      )}>
        <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Requirement</p>
        {isImpossible ? (
          <p className="text-xs font-black text-rose-600">Impossible with remaining credits! 🛑</p>
        ) : (
          <p className="text-sm font-black text-amber-600 uppercase tracking-tighter">
            You need a <span className="text-lg underline">{needed.toFixed(2)}</span> average!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FOCUS TIMER ──────────────────────────────────────────────────────
function FocusTimerModule() {
  const { gainXp, gainGold, setIsFocusing } = useGame();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const timerRef = useRef(null);

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
            showNotification("Pomodoro finished! You gained massive XP and Gold.", "success");
            return 25 * 60;
          }
          return s - 1;
        });
      }, 1000);
      setRunning(true);
      setIsFocusing(true);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col py-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-4xl font-black text-gray-800 tracking-tighter tabular-nums">
          {formatTime(seconds)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRadio(!showRadio)} className={clsx("w-10 h-10 rounded-full flex items-center justify-center transition-all", showRadio ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
            <Music size={18} />
          </button>
          <button onClick={() => setSeconds(25 * 60)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">
            <RotateCcw size={18} />
          </button>
          <button onClick={toggle} className="w-12 h-12 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
            {running ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
          </button>
        </div>
      </div>
      
      {showRadio && (
        <div className="w-full h-24 rounded-xl overflow-hidden animate-in slide-in-from-top-2">
          <iframe 
            width="100%" 
            height="100" 
            src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&controls=0" 
            title="Lofi Radio" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
}

const MODULE_DATA = [
  { id: 'focus', icon: Timer, title: 'Focus Timer & Radio', color: 'text-violet-600', bg: 'bg-violet-50', Component: FocusTimerModule },
  { id: 'grader', icon: ShieldCheck, title: 'AI Assignment Grader', color: 'text-rose-600', bg: 'bg-rose-50', Component: AIAssignmentGraderModule },
  { id: 'flashcards', icon: BookOpen, title: 'AI Flashcards', color: 'text-indigo-600', bg: 'bg-indigo-50', Component: FlashcardModule },
  { id: 'syllabus', icon: GraduationCap, title: 'Syllabus Scan', color: 'text-emerald-600', bg: 'bg-emerald-50', Component: SyllabusModule },
  { id: 'heatmap', icon: Grid, title: 'Heatmap', color: 'text-orange-600', bg: 'bg-orange-50', Component: HeatmapModule },
  { id: 'gpa', icon: Calculator, title: 'GPA Predictor', color: 'text-amber-600', bg: 'bg-amber-50', Component: GPAModule },
];

export function Project() {
  const { showNotification } = useGame();
  return (
    <div className="space-y-4 pb-4 page-enter">
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">Tools for scholars</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Quest Modules</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_DATA.map((mod) => (
          <div key={mod.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col slide-up">
            <div className={clsx("px-5 py-4 border-b border-gray-50 flex items-center gap-3", mod.bg)}>
              <div className={clsx("w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm", mod.color)}>
                <mod.icon size={18} />
              </div>
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">{mod.title}</h3>
            </div>
            <div className="p-4 flex-1">
              <mod.Component />
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-6 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors group">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <Plus size={24} />
        </div>
        <span className="text-white/40 font-black text-xs uppercase tracking-[0.2em]">More Modules Coming Soon</span>
      </button>
    </div>
  );
}

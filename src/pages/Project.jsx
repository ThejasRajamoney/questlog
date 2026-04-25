import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Timer, Brain, BookOpen, CheckCircle2, Plus, Play, Pause, RotateCcw, 
  Loader2, Sparkles, ImagePlus, X, Flame, Music, GraduationCap, Grid,
  Calculator, ChevronRight, Download
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── UTILS: IMAGE RESIZER ─────────────────────────────────────────────
const resizeImage = (file, maxWidth = 1024) => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

// ─── 1. AI FLASHCARD GENERATOR ────────────────────────────────────────
function FlashcardModule() {
  const { flashcards, setFlashcards } = useGame();
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

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
    if (!imageBase64 || !apiKey) return;
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [{ role: 'user', content: [
            { type: 'text', text: 'Generate 3-5 study flashcards from this image. Respond ONLY with a JSON array: [{"question": "...", "answer": "..."}]' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}],
          temperature: 0.1,
          max_tokens: 600
        })
      });
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.match(/\[.*\]/s)?.[0] || '[]';
      const newFlash = JSON.parse(raw);
      setFlashcards(prev => [...newFlash, ...prev]);
      setImagePreview(null);
    } catch (err) { 
      console.error('Flashcard Error:', err);
      alert('Failed to generate cards.'); 
    }
    finally { setLoading(false); }
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
        {flashcards.slice(0, 5).map((f, i) => (
          <div key={i} className="bg-white border border-indigo-50 p-3 rounded-xl text-[11px]">
            <p className="font-black text-indigo-600 mb-1 uppercase tracking-tighter">Q: {f.question}</p>
            <p className="text-gray-600">A: {f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. SYLLABUS AI (DEADLINE SCANNER) ────────────────────────────────
function SyllabusModule() {
  const { setTasks } = useGame();
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
    if (!imageBase64 || !apiKey) return;
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [{ role: 'user', content: [
            { type: 'text', text: 'Scan this syllabus image and extract major assignment deadlines. Respond ONLY with a valid JSON array of objects: [{"title": "Assignment Name", "date": "YYYY-MM-DD"}]' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}]
        })
      });
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.match(/\[.*\]/s)?.[0] || '[]';
      const scannedTasks = JSON.parse(raw);
      
      const newTasks = scannedTasks.map(t => ({
        id: crypto.randomUUID(),
        text: `${t.title} (Due: ${t.date})`,
        type: 'todo',
        completed: false,
        createdAt: new Date().toISOString()
      }));

      setTasks(prev => [...newTasks, ...prev]);
      alert(`✅ Success! ${newTasks.length} deadlines added to Home.`);
      setImageBase64(null);
    } catch (err) { 
      console.error('Scan Error:', err);
      alert('Scan failed. Open console for details.'); 
    }
    finally { setLoading(false); }
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
  const { gpaData, setGpaData } = useGame();
  return (
    <div className="py-2 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Current GPA</p>
          <p className="text-xl font-black text-gray-800">{gpaData.gpa.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Target</p>
          <p className="text-xl font-black text-amber-500">{gpaData.target.toFixed(2)}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 w-[85%] rounded-full" />
        </div>
        <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-tighter">You need an A- in Physics to hit your target!</p>
      </div>
    </div>
  );
}

// ─── FOCUS TIMER ──────────────────────────────────────────────────────
function FocusTimerModule() {
  const { gainXp, gainGold, setIsFocusing } = useGame();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
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
            alert("Pomodoro finished!");
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
    <div className="flex items-center justify-between py-2">
      <div className="text-3xl font-black text-gray-800 tracking-tighter tabular-nums">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setSeconds(25 * 60)} className="p-2 text-gray-400 hover:text-gray-600"><RotateCcw size={20} /></button>
        <button onClick={toggle} className="w-12 h-12 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
          {running ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
        </button>
      </div>
    </div>
  );
}

const MODULE_DATA = [
  { id: 'focus', icon: Timer, title: 'Focus Timer', color: 'text-violet-600', bg: 'bg-violet-50', content: <FocusTimerModule /> },
  { id: 'flashcards', icon: BookOpen, title: 'AI Flashcards', color: 'text-indigo-600', bg: 'bg-indigo-50', content: <FlashcardModule /> },
  { id: 'syllabus', icon: GraduationCap, title: 'Syllabus Scan', color: 'text-emerald-600', bg: 'bg-emerald-50', content: <SyllabusModule /> },
  { id: 'heatmap', icon: Grid, title: 'Heatmap', color: 'text-orange-600', bg: 'bg-orange-50', content: <HeatmapModule /> },
  { id: 'gpa', icon: Calculator, title: 'GPA Predictor', color: 'text-amber-600', bg: 'bg-amber-50', content: <GPAModule /> },
];

export function Project() {
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
              {mod.content}
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

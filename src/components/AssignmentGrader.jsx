import React, { useState, useRef } from 'react';
import { Upload, Star, Sparkles, X, Loader2, ImagePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useGame } from '../context/GameContext';

// ─── Star Rating Display ───────────────────────────────────────────────────
function StarRating({ stars }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={28}
          className={clsx(
            'transition-all duration-300',
            s <= stars
              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
              : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  );
}

// ─── Star label ────────────────────────────────────────────────────────────
const STAR_LABELS = {
  1: { label: 'Needs Major Work', color: 'text-rose-500', bg: 'bg-rose-50' },
  2: { label: 'Below Average', color: 'text-orange-500', bg: 'bg-orange-50' },
  3: { label: 'Average', color: 'text-amber-500', bg: 'bg-amber-50' },
  4: { label: 'Good Work!', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  5: { label: 'Excellent! ⭐', color: 'text-violet-600', bg: 'bg-violet-50' },
};

// ─── Main Component ────────────────────────────────────────────────────────
export function AssignmentGrader() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const { gainXp } = useGame();

  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setImageFile(file);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const gradeAssignment = async () => {
    if (!apiKey) { setError('API Key is missing from .env'); return; }
    if (!imageBase64) { setError('Please upload an image first.'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const PROMPT = `You are an expert academic assignment grader. Carefully analyze this assignment image and respond ONLY with a valid JSON object in this exact format:
{
  "stars": <integer 1-5>,
  "verdict": "<one-line verdict>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      const jsonStr = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (!parsed.stars || !parsed.verdict) throw new Error('Unexpected response format.');
      setResult(parsed);
      
      // Award Verified XP!
      gainXp(100, { isVerified: true });
    } catch (err) {
      setError(err.message || 'Something went wrong while grading.');
    } finally {
      setLoading(false);
    }
  };

  const starInfo = result ? STAR_LABELS[result.stars] : null;

  return (
    <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-white text-base">AI Assignment Grader</h3>
          <p className="text-white/70 text-xs font-medium">Powered by Groq Vision</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!imagePreview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
              dragging ? 'border-violet-400 bg-violet-50 scale-[1.01]' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
              <ImagePlus size={28} className="text-violet-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-600 text-sm">Drop your assignment here</p>
              <p className="text-xs text-gray-400 mt-0.5">or tap to browse</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            <img src={imagePreview} alt="Assignment" className="w-full max-h-64 object-contain" />
            <button onClick={clearImage} className="absolute top-2 right-2 w-8 h-8 bg-gray-900/60 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {imagePreview && !result && (
          <button
            onClick={gradeAssignment}
            disabled={loading}
            className={clsx(
              'w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all flex items-center justify-center gap-2',
              loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 active:scale-95 shadow-md'
            )}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Grading...</> : <><Sparkles size={18} /> Grade My Assignment</>}
          </button>
        )}

        {error && <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-sm text-rose-600 font-medium">{error}</div>}

        {result && starInfo && (
          <div className="space-y-4 slide-up">
            <div className={clsx('rounded-2xl p-5 text-center space-y-3', starInfo.bg)}>
              <StarRating stars={result.stars} />
              <div>
                <span className={clsx('text-lg font-black', starInfo.color)}>{starInfo.label}</span>
                <p className="text-gray-600 text-sm mt-1">{result.verdict}</p>
              </div>
            </div>

            {result.strengths?.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wide">✅ Strengths</h4>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-emerald-800"><span className="text-emerald-500 font-bold shrink-0">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.improvements?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wide">🔧 Improvements</h4>
                <ul className="space-y-1.5">
                  {result.improvements.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-amber-800"><span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={clearImage} className="w-full py-3 rounded-2xl font-bold text-gray-500 text-sm border-2 border-dashed border-gray-200 hover:border-violet-300 hover:text-violet-500 transition-colors">
              Grade Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

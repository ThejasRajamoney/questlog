import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Music, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export function PersistentRadio() {
  const { focusRadioUrl, setFocusRadioUrl } = useGame();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const getEmbedUrl = (url) => {
    if (url.includes('embed')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    setFocusRadioUrl(getEmbedUrl(inputUrl));
    setInputUrl('');
  };

  return (
    <div className={clsx(
      "fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[60] transition-all duration-500",
      isExpanded ? "bottom-[80px]" : "bottom-[90px]"
    )}>
      <div className={clsx(
        "mx-4 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500",
        isExpanded ? "h-[300px]" : "h-[48px]"
      )}>
        {/* Header / Mini Bar */}
        <div 
          className="h-[48px] px-4 flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
              <Music size={16} className={clsx("text-white", !isExpanded && "animate-pulse")} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider">Focus Radio</p>
              {!isExpanded && <p className="text-[9px] text-violet-400 font-bold uppercase">Tap to expand player</p>}
            </div>
          </div>
          <button className="text-white/40 hover:text-white transition-colors">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Expanded Player Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/5 shadow-inner">
              <iframe
                width="100%"
                height="100%"
                src={focusRadioUrl}
                title="Focus Radio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <form onSubmit={handleUpdate} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste new YouTube link..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 text-[10px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-white/20"
              />
              <button 
                type="submit" 
                className="bg-violet-500 hover:bg-violet-600 text-white px-4 rounded-xl text-[10px] font-black uppercase transition-colors"
              >
                Set
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
              <span>24/7 Lo-Fi</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span>Crystal Clear Audio</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

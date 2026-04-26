import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, Save, X, StickyNote } from 'lucide-react';
import { clsx } from 'clsx';

const NOTE_COLORS = [
  'from-amber-50 to-yellow-50 border-amber-200',
  'from-emerald-50 to-teal-50 border-emerald-200',
  'from-sky-50 to-blue-50 border-sky-200',
  'from-violet-50 to-purple-50 border-violet-200',
  'from-rose-50 to-pink-50 border-rose-200',
  'from-orange-50 to-amber-50 border-orange-200',
];

export function Notes() {
  const { notes, setNotes } = useGame();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleAddNote = () => {
    const newNote = {
      id: crypto.randomUUID(),
      title: 'New Note',
      body: '',
      colorIndex: Math.floor(Math.random() * NOTE_COLORS.length),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    setEditingId(newNote.id);
    setEditTitle(newNote.title);
    setEditBody(newNote.body);
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
  };

  const saveNote = () => {
    setNotes(prev => prev.map(n =>
      n.id === editingId
        ? { ...n, title: editTitle, body: editBody, updatedAt: new Date().toISOString() }
        : n
    ));
    setEditingId(null);
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const editingNote = notes.find(n => n.id === editingId);

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="pb-2 flex items-end justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">Capture your ideas</p>
          <h1 className="text-white text-2xl font-black tracking-tight">Notes</h1>
        </div>
        <button
          onClick={handleAddNote}
          className="flex items-center gap-2 bg-white text-amber-600 font-black text-sm px-4 py-2.5 rounded-2xl shadow-md transition-transform active:scale-95"
        >
          <Plus size={16} strokeWidth={3} />
          New Note
        </button>
      </div>

      {/* Editor — shown when editing */}
      {editingId && editingNote && (
        <div className={clsx(
          "bg-gradient-to-br border rounded-3xl shadow-md overflow-hidden slide-up",
          NOTE_COLORS[editingNote.colorIndex ?? 0]
        )}>
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-current/10">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 bg-transparent text-lg font-black text-gray-800 focus:outline-none placeholder:text-gray-400"
              placeholder="Note title..."
            />
            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
            <button onClick={saveNote} className="bg-amber-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1">
              <Save size={14} />
              Save
            </button>
          </div>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="w-full bg-transparent px-5 py-4 text-sm text-gray-700 focus:outline-none resize-none min-h-[160px]"
            placeholder="Write your note here..."
          />
        </div>
      )}

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-10 flex flex-col items-center text-center">
          <StickyNote size={48} className="text-amber-200 mb-3" />
          <p className="text-gray-400 font-semibold">No notes yet.</p>
          <p className="text-gray-300 text-sm">Tap 'New Note' to start capturing ideas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => startEditing(note)}
              className={clsx(
                "bg-gradient-to-br border rounded-3xl p-4 cursor-pointer transition-all hover:shadow-md active:scale-98 relative group slide-up",
                NOTE_COLORS[note.colorIndex ?? 0],
                editingId === note.id && "ring-2 ring-amber-400"
              )}
            >
              <h3 className="font-black text-gray-800 text-sm truncate mb-1">{note.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                {note.body || 'Empty note...'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

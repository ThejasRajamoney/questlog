import { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export function Calendar() {
  const { tasks, setTasks } = useGame();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const selectedDayTasks = tasks.filter(t => isSameDay(new Date(t.createdAt), selectedDate));

  return (
    <div className="space-y-4 pb-4">
      {/* Page header */}
      <div className="pb-2">
        <p className="text-white/70 text-sm font-medium">Track your schedule</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Calendar</h1>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-black text-gray-800 text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {daysInMonth.map(day => {
            const hasTasks = tasks.some(t => isSameDay(new Date(t.createdAt), day));
            const isSelected = isSameDay(day, selectedDate);
            const _isToday = isToday(day);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all relative",
                  isSelected && "bg-sky-500 text-white shadow-md scale-105",
                  !isSelected && _isToday && "bg-sky-100 text-sky-600",
                  !isSelected && !_isToday && "text-gray-600 hover:bg-gray-100"
                )}
              >
                {format(day, 'd')}
                {hasTasks && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day tasks */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-sky-500" />
            <h3 className="font-black text-gray-800 text-base">
              {format(selectedDate, 'EEEE, MMM d')}
            </h3>
          </div>
        </div>

        {/* Quick Add Form */}
        <div className="px-4 pt-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const text = e.target.elements.taskText.value;
              if (!text) return;
              setTasks(prev => [{
                id: crypto.randomUUID(),
                text,
                type: 'todo',
                completed: false,
                createdAt: selectedDate.toISOString()
              }, ...prev]);
              e.target.reset();
            }}
            className="flex gap-2"
          >
            <input 
              name="taskText"
              type="text" 
              placeholder="Add task to this day..." 
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-400 transition-all"
            />
            <button type="submit" className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm hover:bg-sky-600 active:scale-95 transition-all">
              <Plus size={20} strokeWidth={3} />
            </button>
          </form>
        </div>

        <div className="px-4 py-4 space-y-2">
          {selectedDayTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No tasks for this day</p>
          ) : (
            selectedDayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <div className={clsx(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  task.completed ? "bg-emerald-500" : "bg-gray-300"
                )} />
                <span className={clsx(
                  "flex-1 text-sm font-semibold",
                  task.completed ? "text-gray-400 line-through" : "text-gray-700"
                )}>
                  {task.text}
                </span>
                <span className="text-[11px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded-full">
                  {task.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

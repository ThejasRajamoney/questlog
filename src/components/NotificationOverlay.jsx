import { useGame } from '../context/GameContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export function NotificationOverlay() {
  const { notification } = useGame();

  if (!notification) return null;

  const icons = {
    info: <Info size={18} className="text-blue-500" />,
    success: <CheckCircle size={18} className="text-emerald-500" />,
    warning: <AlertCircle size={18} className="text-amber-500" />,
    error: <X size={18} className="text-rose-500" />,
  };

  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-rose-50 border-rose-200',
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[380px] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={clsx(
        "p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md bg-opacity-95",
        bgColors[notification.type] || bgColors.info
      )}>
        <div className="shrink-0">
          {icons[notification.type] || icons.info}
        </div>
        <p className="flex-1 text-sm font-black text-gray-800 leading-snug">
          {notification.message}
        </p>
      </div>
    </div>
  );
}

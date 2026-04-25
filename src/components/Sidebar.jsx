import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, LayoutDashboard, FileText, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { path: '/', label: 'Home', icon: Home, color: 'text-emerald-500' },
  { path: '/calendar', label: 'Calendar', icon: Calendar, color: 'text-sky-500' },
  { path: '/project', label: 'Project', icon: LayoutDashboard, color: 'text-violet-500' },
  { path: '/notes', label: 'Notes', icon: FileText, color: 'text-amber-500' },
  { path: '/leaderboard', label: 'Ranks', icon: Trophy, color: 'text-orange-500' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px]',
                  isActive ? 'bg-gray-50' : ''
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200',
                    isActive ? 'scale-110' : 'scale-100'
                  )}>
                    <Icon
                      size={22}
                      className={clsx(isActive ? item.color : 'text-gray-400')}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>
                  <span className={clsx(
                    'text-[10px] font-semibold transition-colors',
                    isActive ? item.color : 'text-gray-400'
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
      {/* iOS-style home indicator */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-gray-200 rounded-full" />
      </div>
    </nav>
  );
}

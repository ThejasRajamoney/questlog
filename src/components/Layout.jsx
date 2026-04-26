import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './Sidebar';
import { Topbar } from './Topbar';
import { PersistentRadio } from './PersistentRadio';
import { NotificationOverlay } from './NotificationOverlay';

// Gradient backgrounds per route — matching Habitica's vivid page backgrounds
const PAGE_GRADIENTS = {
  '/': 'from-emerald-400 via-teal-400 to-cyan-400',
  '/calendar': 'from-sky-400 via-blue-400 to-indigo-400',
  '/project': 'from-violet-500 via-purple-400 to-fuchsia-400',
  '/notes': 'from-amber-400 via-orange-400 to-yellow-300',
  '/leaderboard': 'from-orange-500 via-amber-400 to-yellow-400',
  '/shop': 'from-yellow-400 via-amber-500 to-orange-500',
};

export function Layout() {
  const { pathname } = useLocation();
  const gradient = PAGE_GRADIENTS[pathname] || PAGE_GRADIENTS['/'];

  return (
    /* Outer centering shell — keeps it phone-width in browser */
    <div className="min-h-screen flex justify-center bg-gray-200">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-white shadow-2xl overflow-hidden">

        {/* Colorful gradient background behind topbar */}
        <div className={`absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-br ${gradient} transition-all duration-500`} />

        {/* Content stack */}
        <div className="relative flex flex-col flex-1 min-h-0">
          <Topbar />

          {/* Decorative shapes on gradient */}
          <div className="absolute top-16 left-4 w-8 h-8 border-4 border-white/20 rounded-lg rotate-12 pointer-events-none" />
          <div className="absolute top-24 right-8 w-5 h-5 border-4 border-white/20 rounded-full pointer-events-none" />
          <div className="absolute top-12 right-16 w-4 h-4 bg-white/10 rounded pointer-events-none rotate-45" />

          <main className="flex-1 overflow-y-auto pb-40 page-enter" key={pathname}>
            <div className="px-4 pt-4">
              <Outlet />
            </div>
          </main>
        </div>

        <PersistentRadio />
        <NotificationOverlay />
        <BottomNav />
      </div>
    </div>
  );
}

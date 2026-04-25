import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Project } from './pages/Project';
import { Notes } from './pages/Notes';
import { Leaderboard } from './pages/Leaderboard';
import { Shop } from './pages/Shop';

import { Auth } from './pages/Auth';
import { useGame } from './context/GameContext';

function App() {
  const { session } = useGame();

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="project" element={<Project />} />
            <Route path="notes" element={<Notes />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="shop" element={<Shop />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

function Main() {
  return (
    <GameProvider>
      <App />
    </GameProvider>
  );
}

export default Main;

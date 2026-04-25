import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Project } from './pages/Project';
import { Notes } from './pages/Notes';
import { Leaderboard } from './pages/Leaderboard';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="project" element={<Project />} />
            <Route path="notes" element={<Notes />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;

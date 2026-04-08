import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlayerJoin from './pages/player/PlayerJoin';
import PlayerGame from './pages/player/PlayerGame';
import HostDashboard from './pages/host/HostDashboard';
import HostGame from './pages/host/HostGame';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden">
        <Routes>
          <Route path="/" element={<PlayerJoin />} />
          <Route path="/play/:gamePin" element={<PlayerGame />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/game/:gamePin" element={<HostGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

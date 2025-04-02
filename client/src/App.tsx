import { Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import Dashboard from './pages/dashboard';
import JournalLanding from './pages/journal/journalLanding';
import Planner from './pages/planner';
import Settings from './pages/settings';
import Study from './pages/study';
import VisionBoard from './pages/visionBoard';
import Pomodoro from './components/pomodoro';
import Header from './components/header';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journalLanding" element={<JournalLanding />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/study" element={<Study />} />
        <Route path="/visionBoard" element={<VisionBoard />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
      </Routes>
    </>
  );
}

export default App;

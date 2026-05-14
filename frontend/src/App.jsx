import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DevTokens from './DevTokens';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Achievements from './pages/Achievements';
import MeAttendance from './pages/MeAttendance';
import BulkUpload from './pages/BulkUpload';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
      <h1 className="text-display-hero text-center text-fg-primary">ForgeTrack</h1>
      <p className="text-body-lg text-fg-secondary">Attendance & Material Tracker</p>
      
      <div className="flex gap-4 mt-8">
        <Link to="/dev-tokens" className="btn-primary">View Design Tokens</Link>
        <Link to="/login" className="btn-secondary">Login</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-main">
        <div className="max-w-7xl mx-auto pt-8 px-6 md:px-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dev-tokens" element={<DevTokens />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/marks" element={<Marks />} />
            <Route path="/me/attendance" element={<MeAttendance />} />
            <Route path="/me/achievements" element={<Achievements />} />
            <Route path="/upload" element={<BulkUpload />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

import React from 'react';
import { LayoutDashboard, Users, BookOpen, Calendar, CheckSquare, Clock, ArrowUpRight, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  // Will be populated from Supabase auth session
  const mentorName = "Mentor";
  const lastLogin = "—";
  
  // Will be fetched from Supabase
  const totalSessions = 0;
  const overallAttendance = '—';
  const activeStudents = 0;
  const lastSessionDate = '—';

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-display-hero text-fg-primary tracking-tight">Welcome Back, {mentorName}</h1>
        <p className="text-body-sm text-fg-secondary">Last login: {lastLogin}</p>
        <Link to="/upload" className="btn-secondary inline-flex items-center gap-2 mt-4">
          <Upload className="w-4 h-4" />
          Bulk Upload Attendance
        </Link>
      </div>

      {/* Ticker Strip */}
      <div className="flex items-center gap-6 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex items-center gap-3 shrink-0">
          <BookOpen className="w-5 h-5 text-fg-secondary" />
          <div className="space-y-1">
            <p className="text-caption text-fg-tertiary uppercase tracking-wider">Total Sessions</p>
            <p className="text-body-lg font-semibold text-fg-primary tabular-nums">{totalSessions}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10 shrink-0"></div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Users className="w-5 h-5 text-fg-secondary" />
          <div className="space-y-1">
            <p className="text-caption text-fg-tertiary uppercase tracking-wider">Overall Attendance</p>
            <p className="text-body-lg font-semibold text-fg-primary tabular-nums">{overallAttendance}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10 shrink-0"></div>
        
        <div className="flex items-center gap-3 shrink-0">
          <CheckSquare className="w-5 h-5 text-fg-secondary" />
          <div className="space-y-1">
            <p className="text-caption text-fg-tertiary uppercase tracking-wider">Active Students</p>
            <p className="text-body-lg font-semibold text-fg-primary tabular-nums">{activeStudents}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10 shrink-0"></div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Calendar className="w-5 h-5 text-fg-secondary" />
          <div className="space-y-1">
            <p className="text-caption text-fg-tertiary uppercase tracking-wider">Last Session</p>
            <p className="text-body-lg font-semibold text-fg-primary tabular-nums">{lastSessionDate}</p>
          </div>
        </div>
      </div>

      {/* Cards Row 1 (Hero Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Session */}
        <div className="card rounded-[24px] p-10 relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">TODAY'S SESSION</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <h2 className="text-body-lg text-fg-secondary mb-2">No session scheduled</h2>
            <p className="text-body-sm text-fg-tertiary">Sessions will appear here once created.</p>
          </div>
          
          <Link to="/attendance" className="btn-primary inline-flex items-center gap-2 w-full justify-center">
            <CheckSquare className="w-4 h-4" />
            Mark Attendance
          </Link>
        </div>

        {/* Recent Assessment / Marks */}
        <div className="card rounded-[24px] p-10 relative overflow-hidden group flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">RECENT ASSESSMENT</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 text-center flex-1">
            <CheckSquare className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <h2 className="text-body-lg text-fg-secondary mb-2">No assessments yet</h2>
            <p className="text-body-sm text-fg-tertiary">Graded assessments will be summarized here.</p>
          </div>
          
          <Link to="/marks" className="btn-secondary inline-flex items-center gap-2 w-full justify-center mt-auto">
            <CheckSquare className="w-4 h-4" />
            Edit Marks
          </Link>
        </div>
      </div>

      {/* Cards Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Overview */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">PROGRAM OVERVIEW</span>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center py-3 border-b border-border-subtle">
              <span className="text-body text-fg-secondary">Total Sessions Completed</span>
              <span className="text-body-lg font-semibold text-fg-primary tabular-nums">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border-subtle">
              <span className="text-body text-fg-secondary">Average Attendance</span>
              <span className="text-body-lg font-semibold text-fg-primary tabular-nums">{overallAttendance}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border-subtle">
              <span className="text-body text-fg-secondary">Highest Attendance</span>
              <span className="text-body-lg font-semibold text-fg-tertiary">—</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-body text-fg-secondary">Lowest Attendance</span>
              <span className="text-body-lg font-semibold text-fg-tertiary">—</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">RECENT ACTIVITY</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <p className="text-body-lg text-fg-secondary mb-2">No activity yet</p>
            <p className="text-body-sm text-fg-tertiary">Your recent actions will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

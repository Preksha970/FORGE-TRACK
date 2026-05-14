import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Award, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MeAttendance() {
  // Will be populated from Supabase auth session
  const student = {
    name: '—',
    usn: '—',
    branch: '—',
    batch: '—',
    attendancePercent: 0,
    attended: 0,
    total: 0,
  };

  // Will be fetched from Supabase
  const sessions = [];
  const achievements = [];

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-lg text-fg-primary tracking-tight mb-2">{student.name}</h1>
          <div className="flex items-center gap-3 text-body-sm text-fg-tertiary uppercase tracking-wider">
            <span>{student.usn}</span>
            <span className="w-1 h-1 rounded-full bg-border-strong"></span>
            <span>{student.branch}</span>
            <span className="w-1 h-1 rounded-full bg-border-strong"></span>
            <span>Batch {student.batch}</span>
          </div>
        </div>
        
        <Link to="/me/achievements" className="btn-primary flex items-center gap-2">
          <Award className="w-4 h-4" />
          Upload Certificate
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Giant Attendance Card */}
        <div className="lg:col-span-2 card p-10 relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex flex-col items-center justify-center h-full py-6">
            <h2 className="text-label text-fg-tertiary uppercase tracking-widest mb-6">OVERALL ATTENDANCE</h2>
            <div className="text-[120px] leading-none font-display font-bold text-fg-tertiary tracking-tighter mb-4">
              {student.attendancePercent}%
            </div>
            <p className="text-body-lg text-fg-secondary">
              <span className="font-semibold text-fg-primary">{student.attended}</span> of <span className="font-semibold text-fg-primary">{student.total}</span> sessions attended
            </p>
          </div>
        </div>

        {/* Achievements Summary */}
        <div className="card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">MY ACHIEVEMENTS</span>
            <Award className="w-5 h-5 text-accent-glow" />
          </div>
          
          <div className="flex-1">
            {achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((a, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-inset border border-border-subtle flex items-center justify-between">
                    <div>
                      <p className="text-body font-semibold text-fg-primary">{a.title}</p>
                      <p className={`text-caption mt-1 ${a.verified ? 'text-success' : 'text-warning'}`}>{a.verified ? 'Verified' : 'Pending Verification'}</p>
                    </div>
                    {a.verified ? <CheckCircle2 className="w-5 h-5 text-success" /> : <div className="w-2 h-2 rounded-full bg-warning"></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="w-8 h-8 text-fg-tertiary mb-3 opacity-40" />
                <p className="text-body-sm text-fg-tertiary">No achievements yet</p>
              </div>
            )}
          </div>
          
          <Link to="/me/achievements" className="mt-6 flex items-center justify-between text-body-sm text-fg-secondary hover:text-accent-glow transition-colors group/link">
            <span>View all achievements</span>
            <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Session Table */}
      <div className="card">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-h3 text-fg-primary">Session History</h2>
        </div>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-6 border-b border-border-subtle text-caption text-fg-tertiary uppercase tracking-wider font-medium">Date</th>
                  <th className="p-6 border-b border-border-subtle text-caption text-fg-tertiary uppercase tracking-wider font-medium">Topic</th>
                  <th className="p-6 border-b border-border-subtle text-caption text-fg-tertiary uppercase tracking-wider font-medium">Duration</th>
                  <th className="p-6 border-b border-border-subtle text-caption text-fg-tertiary uppercase tracking-wider font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-surface-raised transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-fg-tertiary" />
                        <span className="text-body text-fg-secondary font-mono">{session.date}</span>
                      </div>
                    </td>
                    <td className="p-6 text-body font-medium text-fg-primary">{session.topic}</td>
                    <td className="p-6 text-body text-fg-secondary">{session.duration}</td>
                    <td className="p-6 text-right">
                      {session.status === 'PRESENT' ? (
                        <span className="pill pill-success text-micro inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PRESENT
                        </span>
                      ) : (
                        <span className="pill pill-danger text-micro inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> ABSENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <p className="text-body-lg text-fg-secondary mb-2">No sessions recorded yet</p>
            <p className="text-body-sm text-fg-tertiary">Your attendance history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('mentor'); // 'mentor' or 'student'
  const [identifier, setIdentifier] = useState(''); // email or usn
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Temporary routing logic until Supabase auth is fully wired
    if (role === 'mentor') {
      navigate('/dashboard');
    } else {
      navigate('/me/attendance');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full relative">
      {/* Login Card */}
      <div className="w-full max-w-[440px] card rounded-2xl p-12 relative z-10">
        
        {/* Subtle inner hover glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Header: Logo & App Name */}
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center mb-4 shadow-card">
            <Hexagon className="w-6 h-6 text-accent-glow" />
          </div>
          <h1 className="text-h2 text-fg-primary tracking-tight">ForgeTrack</h1>
        </div>

        {/* Role Tabs */}
        <div className="flex p-1 bg-surface-inset border border-border-subtle rounded-lg mb-8 relative z-10">
          <button 
            type="button"
            onClick={() => { setRole('mentor'); setIdentifier(''); setError(''); }}
            className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all duration-200 ${
              role === 'mentor' 
                ? 'bg-surface-raised text-fg-primary shadow-[0_1px_2px_rgba(0,0,0,0.3)] border border-border-default' 
                : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised/50 border border-transparent'
            }`}
          >
            Mentor Login
          </button>
          <button 
            type="button"
            onClick={() => { setRole('student'); setIdentifier(''); setError(''); }}
            className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all duration-200 ${
              role === 'student' 
                ? 'bg-surface-raised text-fg-primary shadow-[0_1px_2px_rgba(0,0,0,0.3)] border border-border-default' 
                : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised/50 border border-transparent'
            }`}
          >
            Student Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2 group/input">
            <label className="text-label text-fg-secondary block uppercase tracking-wider transition-colors group-focus-within/input:text-accent-glow">
              {role === 'mentor' ? 'Email Address' : 'USN (University Registration Number)'}
            </label>
            <input 
              type={role === 'mentor' ? 'email' : 'text'} 
              className="input w-full font-mono text-body-sm" 
              placeholder={role === 'mentor' ? 'nischay@theboringpeople.in' : '4SH24CS001'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="space-y-2 group/input">
            <div className="flex items-center justify-between">
              <label className="text-label text-fg-secondary block uppercase tracking-wider transition-colors group-focus-within/input:text-accent-glow">
                Password
              </label>
              {role === 'mentor' && (
                <a href="#" className="text-caption text-accent-glow hover:text-indigo-400 transition-colors">Forgot?</a>
              )}
            </div>
            <input 
              type="password" 
              className="input w-full" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-caption text-danger text-center pt-2">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full mt-4 h-[44px] flex justify-center items-center gap-2 group/btn">
            <span>Sign In</span>
            <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

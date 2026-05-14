import React from 'react';

export default function DevTokens() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-display-lg">Design System Tokens</h1>
      
      <div className="card max-w-md space-y-4">
        <h2 className="text-h2">Component Tests</h2>
        
        <div className="space-y-2">
          <label className="text-label text-fg-secondary block">Input Field</label>
          <input type="text" className="input w-full" placeholder="Enter value..." />
        </div>
        
        <div className="flex gap-4">
          <button className="btn-primary">Primary Action</button>
          <button className="btn-secondary">Secondary Action</button>
        </div>
        
        <div className="flex gap-4 pt-4 border-t border-border-default">
          <span className="pill pill-success">Active / Present</span>
          <span className="pill pill-danger">Error / Absent</span>
        </div>
      </div>
    </div>
  );
}

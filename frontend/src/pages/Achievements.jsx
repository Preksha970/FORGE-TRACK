import React, { useState } from 'react';
import { Upload, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function Achievements() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [achievements] = useState([]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !selectedFile) return;
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setTitle('');
      setSelectedFile(null);
      setCategory('Hackathon');
    }, 2500);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-display-lg text-fg-primary tracking-tight">My Achievements</h1>
        <p className="text-body-lg text-fg-secondary">Upload and track your hackathon certificates and academic accolades.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
              <Award className="w-5 h-5 text-accent-glow" />
              <h2 className="text-h3 text-fg-primary">Log New Achievement</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-label text-fg-secondary uppercase tracking-wider block">Achievement Title</label>
                <input type="text" className="input w-full" placeholder="e.g., SIH 2026 Winner" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-label text-fg-secondary uppercase tracking-wider block">Category</label>
                <select className="input w-full appearance-none bg-surface-inset" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Certification">Certification</option>
                  <option value="Publication">Publication</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-label text-fg-secondary uppercase tracking-wider block">Upload Certificate</label>
                <div 
                  className={`w-full min-h-[160px] border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer ${
                    isDragging ? 'border-accent-glow bg-accent-glow/10 scale-[1.02]' : 'border-border-strong bg-surface-inset hover:border-accent-glow hover:bg-surface-raised/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input type="file" id="file-upload" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-body font-medium text-fg-primary truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-caption text-fg-tertiary">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5 text-fg-secondary" />
                      </div>
                      <p className="text-body text-fg-primary">Drag & drop your file here</p>
                      <p className="text-caption text-fg-tertiary">PDF, PNG, JPG (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className={`btn-primary w-full ${(!title || !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!title || !selectedFile}>
                Submit for Verification
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-label text-fg-tertiary uppercase tracking-widest">SUBMISSION HISTORY</span>
          </div>

          {achievements.length > 0 ? (
            <div className="space-y-4">
              {achievements.map((item) => (
                <div key={item.id} className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-surface-raised transition-colors cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-inset border border-border-subtle flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-fg-secondary" />
                    </div>
                    <div>
                      <h3 className="text-body-lg font-semibold text-fg-primary mb-1">{item.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-caption text-fg-secondary font-mono">{item.date}</span>
                        <span className="w-1 h-1 rounded-full bg-border-strong"></span>
                        <span className="text-caption text-fg-tertiary uppercase">{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <span className={`pill ${item.status === 'Verified' ? 'pill-success' : 'pill-warning'} text-micro`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Award className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
              <p className="text-body-lg text-fg-secondary mb-2">No achievements submitted yet</p>
              <p className="text-body-sm text-fg-tertiary">Use the form to log your first achievement.</p>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-surface-raised border border-border-default shadow-raised rounded-lg p-4 w-[360px] flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="text-body font-semibold text-fg-primary mb-1">Upload Successful</h4>
              <p className="text-body-sm text-fg-secondary">Your certificate for "{title}" has been submitted for mentor verification.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

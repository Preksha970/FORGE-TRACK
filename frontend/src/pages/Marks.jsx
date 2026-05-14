import React, { useState } from 'react';
import { Calendar, Save, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Marks() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [students] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const maxMarks = 50;

  const handleMarkChange = (id, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      let num = value === '' ? '' : parseInt(value, 10);
      if (num !== '' && num > maxMarks) num = maxMarks;
      setMarksMap(prev => ({ ...prev, [id]: num }));
    }
  };

  const gradedCount = Object.values(marksMap).filter(val => val !== '').length;

  return (
    <div className="space-y-8 pb-32">
      <h1 className="text-h1 text-fg-primary">Enter Marks</h1>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="space-y-2 w-full md:w-64">
          <label className="text-label text-fg-tertiary uppercase">Assessment Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-secondary" />
            <input type="date" className="input w-full pl-10" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="hidden md:block w-px h-12 bg-border-subtle"></div>
        <div className="flex-1">
          <p className="text-label text-fg-tertiary uppercase mb-1">Assessment Name</p>
          <p className="text-body text-fg-tertiary">Select an assessment to load details</p>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-h3 text-fg-primary mb-1">Grading List</h2>
          <p className="text-body-sm text-fg-secondary">{students.length > 0 ? `${gradedCount} of ${students.length} graded` : 'No students enrolled yet'}</p>
        </div>
        {students.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3 hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center border border-border-default">
                    <FileText className="w-4 h-4 text-fg-tertiary" />
                  </div>
                  <div>
                    <span className="text-body-lg text-fg-primary block leading-tight">{s.name}</span>
                    <span className="text-caption font-mono text-fg-tertiary">{s.usn}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-caption text-fg-tertiary uppercase tracking-wider hidden sm:block">{s.branch}</span>
                  <div className="flex items-center gap-2">
                    <input type="text" className="input w-20 text-center font-mono" placeholder="—" value={marksMap[s.id] !== undefined ? marksMap[s.id] : ''} onChange={(e) => handleMarkChange(s.id, e.target.value)} />
                    <span className="text-body text-fg-tertiary">/ {maxMarks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <p className="text-body-lg text-fg-secondary mb-2">No students to display</p>
            <p className="text-body-sm text-fg-tertiary">Add students to start entering marks.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border-subtle p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12">
          <div className="text-body text-fg-secondary">
            Graded <span className="text-fg-primary font-semibold tabular-nums">{gradedCount}</span> out of <span className="text-fg-primary font-semibold tabular-nums">{students.length}</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-8 flex items-center gap-2" disabled={students.length === 0}>
            <Save className="w-4 h-4" />
            Save Marks
          </button>
        </div>
      </div>
    </div>
  );
}

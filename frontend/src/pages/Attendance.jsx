import React, { useState } from 'react';
import { Calendar, CheckSquare, XCircle, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');

  // Students will be fetched from Supabase based on the selected session
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleToggle = (id) => {
    setAttendanceMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = (status) => {
    setAttendanceMap(students.reduce((acc, student) => ({ ...acc, [student.id]: status }), {}));
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-fg-primary">Mark Attendance</h1>
      </div>

      {/* Date & Session Info */}
      <div className="card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="space-y-2 w-full md:w-64">
          <label className="text-label text-fg-tertiary uppercase">Session Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-secondary" />
            <input 
              type="date" 
              className="input w-full pl-10" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="hidden md:block w-px h-12 bg-border-subtle"></div>

        <div className="flex-1">
          <p className="text-label text-fg-tertiary uppercase mb-1">Session Topic</p>
          {sessionTopic ? (
            <>
              <h3 className="text-h3 text-fg-primary">{sessionTopic}</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-body-sm text-fg-secondary">Select a session to load details</span>
              </div>
            </>
          ) : (
            <p className="text-body text-fg-tertiary">Select a date to load session details</p>
          )}
        </div>
      </div>

      {/* Student List Card */}
      <div className="card">
        <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-h3 text-fg-primary mb-1">Students List</h2>
            <p className="text-body-sm text-fg-secondary">
              {students.length > 0 
                ? `Total ${students.length} students enrolled` 
                : 'No students enrolled yet'}
            </p>
          </div>
          {students.length > 0 && (
            <div className="flex gap-3">
              <button onClick={() => handleSelectAll(true)} className="btn-secondary text-sm h-8 px-3">
                Select All Present
              </button>
              <button onClick={() => handleSelectAll(false)} className="btn-secondary text-sm h-8 px-3">
                Select All Absent
              </button>
            </div>
          )}
        </div>

        {students.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between px-6 h-[56px] hover:bg-surface-raised transition-colors cursor-pointer"
                onClick={() => handleToggle(student.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Custom Checkbox */}
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    attendanceMap[student.id] 
                      ? 'bg-success border-success text-[#0B0B11]' 
                      : 'border-border-strong bg-transparent'
                  }`}>
                    {attendanceMap[student.id] && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  
                  <div>
                    <span className="text-body-lg text-fg-primary block leading-tight">{student.name}</span>
                    <span className="text-caption font-mono text-fg-tertiary">{student.usn}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-caption text-fg-tertiary uppercase tracking-wider">{student.branch}</span>
                  <span className={`w-20 text-right text-caption font-medium ${attendanceMap[student.id] ? 'text-success' : 'text-danger'}`}>
                    {attendanceMap[student.id] ? 'PRESENT' : 'ABSENT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-fg-tertiary mb-4 opacity-40" />
            <p className="text-body-lg text-fg-secondary mb-2">No students to display</p>
            <p className="text-body-sm text-fg-tertiary">Add students to start marking attendance.</p>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border-subtle p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-4">
            <div className="text-body text-fg-secondary">
              Marked <span className="text-fg-primary font-semibold tabular-nums">{presentCount}</span> present,{' '}
              <span className="text-fg-primary font-semibold tabular-nums">{absentCount}</span> absent
            </div>
          </div>
          <button onClick={handleSaveClick} className="btn-primary px-8" disabled={students.length === 0}>
            Save Attendance
          </button>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal">
            <h2 className="text-h2 text-fg-primary mb-2">Update Attendance?</h2>
            <p className="text-body-lg text-fg-secondary mb-8">
              You are updating existing attendance records for this session. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmSave} className="btn-primary bg-danger text-white border-none hover:bg-danger/80">
                Yes, Update Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

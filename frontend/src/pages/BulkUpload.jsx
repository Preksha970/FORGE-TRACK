import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Loader2, Calendar, Brain, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseSpreadsheet, getSheetSummary, extractAttendanceData, parseDate } from '../lib/spreadsheetParser';
import { analyzeSheet, suggestMissingDates, detectDuplicates, validateStudentData } from '../lib/attendanceAI';

const STEPS = ['Upload File', 'Select Sheets', 'AI Analysis', 'Resolve Issues', 'Preview & Import'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-2 shrink-0 ${i <= current ? 'text-fg-primary' : 'text-fg-tertiary'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-micro font-bold border transition-all ${
              i < current ? 'bg-success border-success text-[#0B0B11]' :
              i === current ? 'border-accent-glow bg-accent-glow/20 text-accent-glow' :
              'border-border-strong bg-transparent'
            }`}>{i < current ? '✓' : i + 1}</div>
            <span className="text-caption font-medium hidden sm:inline">{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-8 h-px shrink-0 ${i < current ? 'bg-success' : 'bg-border-subtle'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BulkUpload() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiLog, setAiLog] = useState([]);
  const [classDays, setClassDays] = useState([]);
  const [dateSuggestions, setDateSuggestions] = useState({});
  const [duplicateConflicts, setDuplicateConflicts] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [validationIssues, setValidationIssues] = useState([]);
  const [importDone, setImportDone] = useState(false);

  const addLog = (msg, type = 'info') => setAiLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

  // STEP 0: File Upload
  const handleFile = useCallback(async (f) => {
    setFile(f);
    setError('');
    setLoading(true);
    try {
      const result = await parseSpreadsheet(f);
      setParsed(result);
      if (result.sheetNames.length === 1) {
        setSelectedSheets([result.sheetNames[0]]);
        setStep(2); // skip sheet selection
      } else {
        setSelectedSheets([]);
        setStep(1);
      }
    } catch (e) {
      setError('Failed to parse file: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = (e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };

  // STEP 1: Sheet Selection
  const toggleSheet = (name) => {
    setSelectedSheets(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  // STEP 2: AI Analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    setAiLog([]);
    const results = {};
    try {
      addLog(`Starting parallel analysis for ${selectedSheets.length} sheets...`, 'info');
      
      // Run all sheet analyses in parallel
      const analysisPromises = selectedSheets.map(async (sheetName) => {
        try {
          const summary = getSheetSummary(parsed.sheets[sheetName]);
          const mapping = await analyzeSheet(summary, sheetName);
          return { sheetName, mapping, error: null };
        } catch (innerErr) {
          console.error(`Analysis failed for sheet ${sheetName}:`, innerErr);
          return { sheetName, mapping: null, error: innerErr };
        }
      });

      const completedAnalyses = await Promise.all(analysisPromises);
      let hasFailures = false;

      for (const { sheetName, mapping, error } of completedAnalyses) {
        if (error) {
          addLog(`Failed to analyze "${sheetName}": ${error.message}`, 'error');
          hasFailures = true;
        } else {
          results[sheetName] = mapping;
          addLog(`Found ${mapping.attendanceCols?.length || 0} attendance columns in "${sheetName}", confidence: ${mapping.confidence}%`, 'success');
          if (mapping.missingDates) addLog(`⚠ Some sessions have missing dates in "${sheetName}"`, 'warning');
          if (mapping.notes) addLog(`AI Note (${sheetName}): ${mapping.notes}`, 'info');
        }
      }

      if (hasFailures && Object.keys(results).length === 0) {
        throw new Error('All sheets failed analysis.');
      }

      setAnalyses(results);

      // Check if any sheet has missing dates
      const hasMissing = Object.values(results).some(m => m.missingDates);
      if (hasMissing) {
        addLog('Some dates are missing. Please provide your class schedule so the AI can suggest dates.', 'warning');
      }
      setStep(3);
    } catch (e) {
      setError('AI analysis failed: ' + e.message);
      addLog('Analysis failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Resolve Issues (missing dates, duplicates)
  const handleSuggestDates = async () => {
    setLoading(true);
    try {
      for (const [sheetName, mapping] of Object.entries(analyses)) {
        if (!mapping.missingDates) continue;
        const missing = mapping.attendanceCols.filter(c => !c.hasDate);
        if (missing.length === 0) continue;
        addLog(`Suggesting dates for ${missing.length} sessions in "${sheetName}"...`);
        const suggestions = await suggestMissingDates(missing, classDays, null, mapping.attendanceCols.length);
        setDateSuggestions(prev => ({ ...prev, [sheetName]: suggestions }));
        addLog(`Got ${suggestions.length} date suggestions`, 'success');
      }
    } catch (e) {
      addLog('Date suggestion failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyDateSuggestions = () => {
    const updated = { ...analyses };
    for (const [sheetName, suggestions] of Object.entries(dateSuggestions)) {
      if (!updated[sheetName]) continue;
      for (const sug of suggestions) {
        const col = updated[sheetName].attendanceCols.find(c => c.label === sug.label);
        if (col && sug.suggestedDate) {
          col.date = sug.suggestedDate;
          col.hasDate = true;
        }
      }
      updated[sheetName].missingDates = updated[sheetName].attendanceCols.some(c => !c.hasDate);
    }
    setAnalyses(updated);
  };

  const checkForDuplicates = () => {
    const dateMap = {};
    for (const [sheetName, mapping] of Object.entries(analyses)) {
      if (!mapping.attendanceCols) continue;
      for (const col of mapping.attendanceCols) {
        if (col.hasDate && col.date) {
          if (!dateMap[col.date]) dateMap[col.date] = [];
          if (!dateMap[col.date].includes(sheetName)) {
            dateMap[col.date].push(sheetName);
          }
        }
      }
    }
    
    const conflicts = [];
    for (const [date, sheets] of Object.entries(dateMap)) {
      if (sheets.length > 1) {
        conflicts.push({ date, sheets, resolvedSheet: null });
      }
    }

    if (conflicts.length > 0) {
      setDuplicateConflicts(conflicts);
      addLog(`Found ${conflicts.length} duplicate dates across sheets`, 'warning');
    } else {
      buildPreview();
    }
  };

  const resolveConflict = (date, selectedSheet) => {
    setDuplicateConflicts(prev => prev.map(c => c.date === date ? { ...c, resolvedSheet: selectedSheet } : c));
  };

  const applyDuplicateResolutions = () => {
    if (duplicateConflicts.some(c => !c.resolvedSheet)) {
      setError('Please resolve all duplicate conflicts before proceeding.');
      return;
    }
    
    const updated = { ...analyses };
    for (const conflict of duplicateConflicts) {
      const rejectedSheets = conflict.sheets.filter(s => s !== conflict.resolvedSheet);
      for (const sheet of rejectedSheets) {
        if (updated[sheet]) {
          updated[sheet].attendanceCols = updated[sheet].attendanceCols.filter(c => !(c.hasDate && c.date === conflict.date));
        }
      }
    }
    setAnalyses(updated);
    setDuplicateConflicts([]);
    buildPreview();
  };

  // STEP 4: Preview & Extract
  const buildPreview = () => {
    const allStudents = [];
    for (const [sheetName, mapping] of Object.entries(analyses)) {
      const raw = parsed.sheets[sheetName].rawData;
      const students = extractAttendanceData(raw, mapping);
      allStudents.push(...students);
    }
    const issues = validateStudentData(allStudents);
    setExtractedData(allStudents);
    setValidationIssues(issues);
    setStep(4);
  };

  const handleImport = async () => {
    setLoading(true);
    addLog('Starting import to database...');
    // TODO: Wire to Supabase upsert
    await new Promise(r => setTimeout(r, 1500));
    addLog(`Imported ${extractedData.length} students across ${Object.keys(analyses).reduce((sum, s) => sum + (analyses[s].attendanceCols?.filter(c => c.hasDate).length || 0), 0)} sessions`, 'success');
    setImportDone(true);
    setLoading(false);
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hasMissingDates = Object.values(analyses).some(m => m.missingDates);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="w-9 h-9 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center hover:bg-surface-inset transition-colors">
          <ArrowLeft className="w-4 h-4 text-fg-secondary" />
        </Link>
        <div>
          <h1 className="text-h1 text-fg-primary">Bulk Attendance Upload</h1>
          <p className="text-body-sm text-fg-secondary mt-1">AI-powered spreadsheet import</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-body-sm text-danger">{error}</p>
        </div>
      )}

      {/* STEP 0: Upload */}
      {step === 0 && (
        <div className="card rounded-[24px] p-10">
          <div
            className={`w-full min-h-[280px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer ${
              loading ? 'border-accent-glow bg-accent-glow/5' : 'border-border-strong hover:border-accent-glow hover:bg-surface-raised/30'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !loading && document.getElementById('bulk-file').click()}
          >
            <input type="file" id="bulk-file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {loading ? (
              <Loader2 className="w-12 h-12 text-accent-glow animate-spin mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-fg-tertiary mb-4 opacity-60" />
            )}
            <p className="text-body-lg text-fg-primary mb-2">{loading ? 'Parsing file...' : 'Drop your spreadsheet here'}</p>
            <p className="text-body-sm text-fg-tertiary">CSV, XLSX, or XLS — supports multiple sheets</p>
          </div>
        </div>
      )}

      {/* STEP 1: Select Sheets */}
      {step === 1 && parsed && (
        <div className="card rounded-[24px] p-10 space-y-6">
          <div>
            <h2 className="text-h2 text-fg-primary mb-2">Multiple Sheets Detected</h2>
            <p className="text-body text-fg-secondary">Select which sheets contain attendance data:</p>
          </div>
          <div className="space-y-3">
            {parsed.sheetNames.map(name => {
              const sheet = parsed.sheets[name];
              const rows = sheet.rawData.length;
              const selected = selectedSheets.includes(name);
              return (
                <div key={name} onClick={() => toggleSheet(name)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    selected ? 'border-accent-glow bg-accent-glow/10' : 'border-border-default hover:border-border-strong bg-surface-inset'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-accent-glow border-accent-glow' : 'border-border-strong'}`}>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <FileSpreadsheet className="w-5 h-5 text-fg-secondary" />
                      <span className="text-body-lg text-fg-primary font-medium">{name}</span>
                    </div>
                    <span className="text-caption text-fg-tertiary font-mono">{rows} rows</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setStep(2)} disabled={selectedSheets.length === 0}
            className={`btn-primary w-full flex items-center justify-center gap-2 ${selectedSheets.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: AI Analysis */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card rounded-[24px] p-10 text-center space-y-6">
            <Brain className="w-16 h-16 text-accent-glow mx-auto opacity-80" />
            <div>
              <h2 className="text-h2 text-fg-primary mb-2">AI Analysis</h2>
              <p className="text-body text-fg-secondary">The AI agent will analyze {selectedSheets.length} sheet(s) to map columns and detect attendance data.</p>
            </div>
            {!loading && Object.keys(analyses).length === 0 && (
              <button onClick={runAnalysis} className="btn-primary px-10 mx-auto flex items-center gap-2">
                <Brain className="w-4 h-4" /> Start Analysis
              </button>
            )}
            {loading && <Loader2 className="w-8 h-8 text-accent-glow animate-spin mx-auto" />}
          </div>
          {aiLog.length > 0 && <AILogPanel logs={aiLog} />}
        </div>
      )}

      {/* STEP 3: Resolve Issues */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Analysis Results */}
          {Object.entries(analyses).map(([sheetName, mapping]) => (
            <div key={sheetName} className="card rounded-[24px] p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 text-fg-primary flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-fg-secondary" /> {sheetName}
                </h3>
                <span className={`pill ${mapping.confidence >= 80 ? 'pill-success' : 'pill-danger'} text-micro`}>
                  {mapping.confidence}% confident
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[['Name', mapping.nameCol], ['USN', mapping.usnCol], ['Email', mapping.emailCol], ['Branch', mapping.branchCol]].map(([label, col]) => (
                  <div key={label} className="p-3 rounded-lg bg-surface-inset border border-border-subtle">
                    <p className="text-caption text-fg-tertiary uppercase">{label} Column</p>
                    <p className="text-body font-mono text-fg-primary">{col !== null && col !== undefined ? `Col ${col}` : '—'}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-label text-fg-tertiary uppercase mb-2">Attendance Columns ({mapping.attendanceCols?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {mapping.attendanceCols?.map((c, i) => (
                    <span key={i} className={`pill text-micro ${c.hasDate ? 'pill-success' : 'pill-danger'}`}>
                      {c.hasDate ? c.date : c.label || `Col ${c.colIndex}`}
                    </span>
                  ))}
                </div>
              </div>
              {mapping.notes && <p className="text-body-sm text-fg-secondary italic">{mapping.notes}</p>}
            </div>
          ))}

          {/* Missing Dates Resolution */}
          {hasMissingDates && (
            <div className="card rounded-[24px] p-8 space-y-6 border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 text-fg-primary mb-1">Missing Session Dates</h3>
                  <p className="text-body text-fg-secondary">Some sessions don't have dates. Select the days your class usually meets:</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {allDays.map(day => (
                  <button key={day} onClick={() => setClassDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    className={`px-4 py-2 rounded-lg border text-body-sm font-medium transition-all ${
                      classDays.includes(day) ? 'bg-accent-glow/20 border-accent-glow text-accent-glow' : 'border-border-default text-fg-secondary hover:border-border-strong'
                    }`}>{day}</button>
                ))}
              </div>
              {classDays.length > 0 && (
                <button onClick={handleSuggestDates} disabled={loading} className="btn-secondary flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  Suggest Dates
                </button>
              )}
              {Object.entries(dateSuggestions).map(([sheet, suggestions]) => (
                <div key={sheet} className="space-y-2">
                  <p className="text-label text-fg-tertiary uppercase">{sheet} — Suggestions</p>
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-inset border border-border-subtle">
                      <span className="text-body font-medium text-fg-primary w-20">{s.label}</span>
                      <span className="text-body font-mono text-success">{s.suggestedDate}</span>
                      <span className="text-caption text-fg-tertiary flex-1">{s.reasoning}</span>
                    </div>
                  ))}
                  <button onClick={applyDateSuggestions} className="btn-secondary text-sm">Apply Suggestions</button>
                </div>
              ))}
            </div>
          )}

          {/* Duplicate Resolutions */}
          {duplicateConflicts.length > 0 && (
            <div className="card rounded-[24px] p-8 space-y-6 border-danger/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-danger shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 text-fg-primary mb-1">Duplicate Sessions Detected</h3>
                  <p className="text-body text-fg-secondary">The following dates appear in multiple sheets. Please select which sheet's data should be imported for each date:</p>
                </div>
              </div>
              <div className="space-y-4">
                {duplicateConflicts.map((conflict, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface-inset border border-border-default">
                    <p className="text-body-lg font-medium text-fg-primary mb-3">Session Date: <span className="font-mono text-accent-glow">{conflict.date}</span></p>
                    <div className="flex flex-col gap-2">
                      {conflict.sheets.map(sheet => (
                        <label key={sheet} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          conflict.resolvedSheet === sheet ? 'bg-accent-glow/10 border-accent-glow' : 'bg-surface hover:border-border-strong border-border-subtle'
                        }`}>
                          <input type="radio" name={`conflict-${conflict.date}`} 
                            checked={conflict.resolvedSheet === sheet}
                            onChange={() => resolveConflict(conflict.date, sheet)}
                            className="w-4 h-4 text-accent-glow bg-surface border-border-strong focus:ring-accent-glow focus:ring-offset-surface"
                          />
                          <span className="text-body text-fg-primary">Use data from <strong>{sheet}</strong></span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={applyDuplicateResolutions} className="btn-primary w-full flex justify-center">
                Apply Resolutions
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Re-analyze
            </button>
            <button onClick={checkForDuplicates} disabled={duplicateConflicts.length > 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
              Continue to Preview <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {aiLog.length > 0 && <AILogPanel logs={aiLog} />}
        </div>
      )}

      {/* STEP 4: Preview & Import */}
      {step === 4 && (
        <div className="space-y-6">
          {validationIssues.length > 0 && (
            <div className="card p-6 border-warning/30 space-y-3">
              <h3 className="text-h3 text-fg-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> Validation Issues ({validationIssues.length})
              </h3>
              {validationIssues.slice(0, 5).map((iss, i) => (
                <p key={i} className="text-body-sm text-fg-secondary">Row {iss.row}: {iss.message}</p>
              ))}
            </div>
          )}

          <div className="card rounded-[24px] overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h2 className="text-h3 text-fg-primary mb-1">Import Preview</h2>
                <p className="text-body-sm text-fg-secondary">{extractedData.length} students, {Object.keys(analyses).reduce((s, k) => s + (analyses[k].attendanceCols?.filter(c => c.hasDate).length || 0), 0)} sessions</p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium">#</th>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium">Name</th>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium">USN</th>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium">Branch</th>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium">Sessions</th>
                    <th className="p-4 text-caption text-fg-tertiary uppercase border-b border-border-subtle font-medium text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {extractedData.slice(0, 50).map((s, i) => {
                    const total = Object.keys(s.attendance).length;
                    const present = Object.values(s.attendance).filter(Boolean).length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-surface-raised transition-colors">
                        <td className="p-4 text-body-sm text-fg-tertiary font-mono">{i + 1}</td>
                        <td className="p-4 text-body text-fg-primary font-medium">{s.name}</td>
                        <td className="p-4 text-body-sm text-fg-secondary font-mono">{s.usn || '—'}</td>
                        <td className="p-4 text-caption text-fg-tertiary uppercase">{s.branch || '—'}</td>
                        <td className="p-4 text-body-sm text-fg-secondary">{present}/{total}</td>
                        <td className={`p-4 text-body-sm font-semibold text-right ${pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger'}`}>{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {extractedData.length > 50 && (
              <div className="p-4 text-center text-caption text-fg-tertiary border-t border-border-subtle">
                Showing 50 of {extractedData.length} students
              </div>
            )}
          </div>

          {!importDone ? (
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleImport} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import {extractedData.length} Students
              </button>
            </div>
          ) : (
            <div className="card p-8 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
              <h2 className="text-h2 text-fg-primary">Import Complete!</h2>
              <p className="text-body text-fg-secondary">All attendance data has been saved.</p>
              <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">Back to Dashboard</Link>
            </div>
          )}

          {aiLog.length > 0 && <AILogPanel logs={aiLog} />}
        </div>
      )}
    </div>
  );
}

function AILogPanel({ logs }) {
  return (
    <div className="card rounded-xl p-5 space-y-2">
      <p className="text-label text-fg-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4" /> AI Agent Log
      </p>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto font-mono text-caption">
        {logs.map((l, i) => (
          <div key={i} className={`flex gap-3 ${
            l.type === 'error' ? 'text-danger' : l.type === 'warning' ? 'text-warning' : l.type === 'success' ? 'text-success' : 'text-fg-secondary'
          }`}>
            <span className="text-fg-tertiary shrink-0">{l.time}</span>
            <span>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

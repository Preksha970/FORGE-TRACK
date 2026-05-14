import { parseDate } from './spreadsheetParser.js';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Retry a function with exponential backoff for rate-limit/quota errors.
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('rate') ||
        err.status === 429;

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Groq API rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Call Groq API (OpenAI-compatible) and return the text response.
 */
async function callGroq(systemPrompt, userPrompt) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Build the system prompt for the attendance AI agent.
 */
function buildSystemPrompt() {
  return `You are an expert data analyst AI agent for ForgeTrack, an attendance tracking system.

Your job is to analyze spreadsheet data and map columns to our database schema:
- students table: name, usn, email, branch_code, admission_number
- sessions table: date (YYYY-MM-DD), topic
- attendance table: student_id, session_id, present (boolean)

RULES:
1. Identify which columns contain: student name, USN, email, branch/department code, admission number
2. Identify which columns contain attendance data (usually boolean true/false, P/A, 1/0)
3. For each attendance column, determine the session date if available in headers
4. Some dates may be Excel serial numbers (5-digit integers like 46238) - flag these
5. Some sheets use "Day 1", "Day 2" labels instead of dates - flag these as missing dates
6. Headers may span multiple rows with merged cells (e.g., "Day 1" merged over Attendance, Knowledge, Skill columns)
7. Only map columns that contain ATTENDANCE data (true/false/P/A), NOT score columns (Knowledge, Skill)

RESPOND ONLY with valid JSON matching this schema:
{
  "headerRowIndex": <number>,
  "nameCol": <number>,
  "usnCol": <number|null>,
  "emailCol": <number|null>,
  "branchCol": <number|null>,
  "admissionCol": <number|null>,
  "attendanceCols": [
    { "colIndex": <number>, "dateRaw": "<raw header value>", "date": "<YYYY-MM-DD or null>", "hasDate": <boolean>, "label": "<Day N or column name>" }
  ],
  "missingDates": <boolean>,
  "confidence": <number 0-100>,
  "notes": "<any observations about data quality>"
}`;
}

/**
 * Analyze a sheet's structure with AI and return column mappings.
 */
export async function analyzeSheet(sheetSummary, sheetName) {
  const userPrompt = `Analyze this spreadsheet sheet named "${sheetName}".
  
  Sheet has ${sheetSummary.totalRows} rows and ${sheetSummary.totalCols} columns.
  Header appears to start at row index ${sheetSummary.headerRowIdx}.
  
  ${sheetSummary.mergeDescriptions.length > 0
      ? 'Merged cell regions:\n' + sheetSummary.mergeDescriptions.join('\n')
      : 'No merged cells detected.'}
  
  Sample data (first ${sheetSummary.sampleRows.length} rows as JSON arrays):
  ${sheetSummary.sampleRows.map((row, i) => `Row ${i}: ${JSON.stringify(row)}`).join('\n')}
  
  Identify the column mappings for student identity fields and attendance columns. Remember:
  - Only pick columns that contain boolean attendance data (true/false, P/A, 1/0), NOT numeric score columns (Knowledge, Skill)
  - If dates appear as 5-digit numbers, they are Excel serial dates
  - If dates are missing (e.g., "Day 1" without actual dates), set hasDate=false`;

  const text = await retryWithBackoff(() => callGroq(buildSystemPrompt(), userPrompt));

  let mapping;
  try {
    mapping = JSON.parse(text);
  } catch {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      mapping = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('AI returned invalid JSON: ' + text.slice(0, 200));
    }
  }

  // Post-process: try to resolve dates the AI might have missed
  if (mapping.attendanceCols) {
    for (const col of mapping.attendanceCols) {
      if (!col.date && col.dateRaw) {
        const parsed = parseDate(col.dateRaw);
        if (parsed) {
          col.date = parsed;
          col.hasDate = true;
        }
      }
    }
  }

  return mapping;
}

/**
 * Ask AI to suggest dates for sessions that are missing dates.
 * Uses the user's class schedule (which days of the week) and a reference date.
 */
export async function suggestMissingDates(missingCols, classDays, referenceDate, totalSessionCount) {
  const systemPrompt = 'You are a scheduling assistant. Respond ONLY with valid JSON.';
  
  const userPrompt = `I have ${missingCols.length} sessions labeled: ${missingCols.map(c => c.label).join(', ')}
  
  The class usually happens on these days of the week: ${classDays.join(', ')}
  ${referenceDate ? `A known reference date for one session is: ${referenceDate}` : 'No reference date is available.'}
  Total sessions in the program: ${totalSessionCount}
  
  Based on this information, suggest the most likely actual dates for each session.
  Sessions are typically sequential - Day 1 is the earliest, Day N is the latest.
  
  Respond with JSON array:
  [
    { "label": "Day 1", "suggestedDate": "YYYY-MM-DD", "reasoning": "..." },
    ...
  ]`;

  const text = await retryWithBackoff(() => callGroq(systemPrompt, userPrompt));

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  }
}

/**
 * Check for duplicate sessions between the spreadsheet data and existing DB sessions.
 */
export async function detectDuplicates(sessionDates, existingSessions) {
  const existingDateSet = new Set(existingSessions.map(s => s.date));
  const duplicates = [];
  const newDates = [];

  for (const date of sessionDates) {
    if (existingDateSet.has(date)) {
      const existing = existingSessions.find(s => s.date === date);
      duplicates.push({ date, existingSession: existing });
    } else {
      newDates.push(date);
    }
  }

  return { duplicates, newDates };
}

/**
 * Validate extracted student data against basic rules.
 */
export function validateStudentData(students) {
  const issues = [];
  const usnSet = new Set();

  students.forEach((s, i) => {
    if (!s.name) {
      issues.push({ row: i, field: 'name', message: 'Missing student name' });
    }
    if (s.usn) {
      if (usnSet.has(s.usn)) {
        issues.push({ row: i, field: 'usn', message: `Duplicate USN: ${s.usn}` });
      }
      usnSet.add(s.usn);
    }
  });

  return issues;
}

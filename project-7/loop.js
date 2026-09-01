const fs = require('fs');
const path = require('path');

// Import config
const config = require('./config/settings.js');

// Paths
const PROJ_DIR = __dirname;
const PROGRESS_FILE = path.join(PROJ_DIR, 'progress.md');
const LOG_FILE = path.join(PROJ_DIR, 'logs', 'run_log.jsonl');
const LOCK_FILE = path.join(PROJ_DIR, '.loop.lock');

// Sabotage: point to a non-existent file to scan
const SABOTAGE_FILE = path.join(PROJ_DIR, 'nonexistent-file.js');

// Token estimation constants
const CHARS_PER_TOKEN = 4;
const COST_PER_TOKEN = 0.000015; // $0.015 per 1K tokens (approximate)

// Log an entry to the run log
function logRun(entry) {
  const logLine = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
}

// Estimate tokens from text length
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// Read recorded TODOs from progress.md between markers
function readRecordedTODOs() {
  let recorded = [];
  if (!fs.existsSync(PROGRESS_FILE)) return recorded;
  const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
  const m = content.match(/RECORDED_TODOS_START\s*((?:TODO: .+\n*)*)RECORDED_TODOS_END/i);
  if (m && m[1]) {
    const todoLines = m[1].split('\n');
    for (const line of todoLines) {
      const trimmed = line.trim();
      const txt = normalizeTodo(trimmed);
      if (txt) recorded.push(txt);
    }
  }
  return recorded;
}

// Normalize TODO text
function normalizeTodo(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/^TODO:\s*/i, '').trim();
}

// SABOTAGE: Find TODOs but from a non-existent file path
// This will cause the loop to fail with "NEEDS HUMAN ATTENTION"
function findTodos() {
  const todos = [];
  
  // SABOTAGE: Try to read from a file that doesn't exist
  // This is the deliberate failure point
  if (!fs.existsSync(SABOTAGE_FILE)) {
    const error = `SABOTAGE: Target file does not exist: ${SABOTAGE_FILE}`;
    throw new Error(error);
  }
  
  // Original logic (never reached due to sabotage)
  const files = fs.readdirSync(PROJ_DIR).filter(f => f.endsWith('.js') && f !== 'loop.js');
  for (const f of files) {
    const src = fs.readFileSync(path.join(PROJ_DIR, f), 'utf-8');
    const matches = src.match(/(\/\/\s*TODO\s*:\s*(.+)$)/gm);
    if (matches) {
      for (const m of matches) {
        const txt = m.replace(/^\/\/\s*TODO\s*:*/i, '').trim();
        if (txt) todos.push(txt);
      }
    }
  }
  return todos;
}

// Write progress.md with new TODOs and run history
function writeProgress({ recordedTODOs, newTODOs, dateStr, summary, needsHuman }) {
  const allTODOs = [...new Set(recordedTODOs)];
  if (newTODOs.length > 0) {
    allTODOs.push(...newTODOs);
  }
  const deduped = [...new Set(allTODOs)];
  
  const recordedSection = deduped.length > 0
    ? deduped.map(t => `TODO: ${t}`).join('\n')
    : '';
  
  const newTodoDisplay = newTODOs.length > 0
    ? newTODOs.map(t => `- ${t}`).join('\n')
    : 'None';
  
  let runEntry = `### ${dateStr}\n\nNew TODOs found:\n${newTodoDisplay}\n\n`;
  
  // Add NEEDS HUMAN ATTENTION flag if failed
  if (needsHuman) {
    runEntry += `⚠️ NEEDS HUMAN ATTENTION: ${needsHuman}\n\n`;
  }
  
  let md = '# Morning Brief Progress\n\n';
  md += '## Recorded TODOs\n';
  md += 'RECORDED_TODOS_START\n';
  md += recordedSection;
  md += '\nRECORDED_TODOS_END\n\n';
  md += '## Run History\n';
  md += runEntry;
  
  fs.writeFileSync(PROGRESS_FILE, md, 'utf-8');
}

// Retry logic with attempt limit
async function runWithRetry(maxAttempts = config.retryLimit) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const runStart = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Read progress (estimate input tokens from file content)
      let progressContent = '';
      if (fs.existsSync(PROGRESS_FILE)) {
        progressContent = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      }
      const tokensInProgress = estimateTokens(progressContent);
      
      // Read example.js for token estimation (simulating file scan)
      let exampleContent = '';
      if (fs.existsSync(path.join(PROJ_DIR, 'example.js'))) {
        exampleContent = fs.readFileSync(path.join(PROJ_DIR, 'example.js'), 'utf-8');
      }
      const tokensInExample = estimateTokens(exampleContent);
      
      const tokensIn = tokensInProgress + tokensInExample;
      
      // Try to find TODOs (will fail due to sabotage)
      const allTODOs = findTodos();
      
      // If we reach here, no error - record new TODOs
      const recordedTODOs = readRecordedTODOs();
      const newTODOs = allTODOs.filter(t => !recordedTODOs.includes(t));
      
      const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      let summary;
      if (newTODOs.length === 0) {
        summary = 'No new TODO items.';
      } else {
        summary = newTODOs.join(', ');
      }
      
      // Estimate output tokens from what we'll write
      const newTodoDisplay = newTODOs.length > 0
        ? newTODOs.map(t => `- ${t}`).join('\n')
        : 'None';
      const estimatedWriteContent = `# Morning Brief Progress\n\n## Recorded TODOs\nRECORDED_TODOS_START\n${recordedTODOs.map(t => `TODO: ${t}`).join('\n')}\nRECORDED_TODOS_END\n\n## Run History\n### ${dateStr}\n\nNew TODOs found:\n${newTodoDisplay}\n\n`;
      const tokensOut = estimateTokens(estimatedWriteContent);
      
      // Write progress (success case)
      writeProgress({
        recordedTODOs,
        newTODOs,
        dateStr,
        summary,
        needsHuman: null
      });
      
      // Log success
      const logEntry = {
        timestamp,
        status: 'success',
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        error: null,
        needs_human: false,
        attempt
      };
      logRun(logEntry);
      
      console.log('Loop completed successfully.');
      console.log(`Tokens in: ${tokensIn}, Tokens out: ${tokensOut}`);
      return;
      
    } catch (err) {
      lastError = err;
      
      // Estimate tokens even on failure
      let tokensIn = 0;
      let tokensOut = 0;
      
      if (fs.existsSync(PROGRESS_FILE)) {
        tokensIn += estimateTokens(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      }
      if (fs.existsSync(path.join(PROJ_DIR, 'example.js'))) {
        tokensIn += estimateTokens(fs.readFileSync(path.join(PROJ_DIR, 'example.js'), 'utf-8'));
      }
      
      // Error message written to progress.md
      const errorContent = `⚠️ NEEDS HUMAN ATTENTION: ${err.message}`;
      tokensOut = estimateTokens(errorContent);
      
      // Log failure
      const logEntry = {
        timestamp,
        status: 'failure',
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        error: err.message,
        needs_human: true,
        attempt
      };
      logRun(logEntry);
      
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      
      // If this is the last attempt, write NEEDS HUMAN ATTENTION to progress.md
      if (attempt === maxAttempts) {
        const recordedTODOs = readRecordedTODOs();
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        writeProgress({
          recordedTODOs,
          newTODOs: [],
          dateStr,
          summary: 'Loop failed after max retries',
          needsHuman: err.message
        });
        console.log('Max retries reached. NEEDS HUMAN ATTENTION written to progress.md');
      }
      
      // Small delay between retries
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  // All retries exhausted
  throw lastError;
}

// Main
async function main() {
  console.log('=== Project 7 Loop Started ===');
  console.log(`Retry limit: ${config.retryLimit}`);
  console.log(`Cadence: ${config.cadence}`);
  console.log(`Cost per token: $${COST_PER_TOKEN}`);
  
  // Lock guard (1 minute)
  if (fs.existsSync(LOCK_FILE)) {
    const data = fs.readFileSync(LOCK_FILE, 'utf-8').trim();
    const last = parseInt(data, 10);
    if (last && (Date.now() - last < 60000)) {
      console.log('Safety guard: a run occurred less than 1 minute ago. Exiting.');
      process.exit(0);
    }
  }
  fs.writeFileSync(LOCK_FILE, Date.now().toString(), 'utf-8');
  
  try {
    await runWithRetry(config.retryLimit);
  } catch (err) {
    console.error('Loop failed permanently:', err.message);
    process.exit(1);
  }
  
  console.log('=== Project 7 Loop Ended ===');
}

main();
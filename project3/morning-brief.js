const fs = require('fs');
const path = require('path');

const PROJ_DIR = __dirname;
const PROGRESS_FILE = path.join(PROJ_DIR, 'progress.md');
const LOCK_FILE = path.join(PROJ_DIR, '.morning-brief.lock');

// ------- normalize TODO text: strip "TODO:" prefix, keep just the text -------

function normalizeTodo(t) {
  if (typeof t !== 'string') return '';
  // remove "TODO:" prefix (case-insensitive, with optional colon)
  return t.replace(/^TODO:\s*/i, '').trim();
}

// ------- read previously recorded TODOs from progress.md between markers -------

function readRecordedTODOs() {
  let recorded = [];
  if (!fs.existsSync(PROGRESS_FILE)) { return recorded; }
  const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');

  // extract content between RECORDED_TODOS_START and RECORDED_TODOS_END
  const m = content.match(/RECORDED_TODOS_START\s*((?:TODO: .+\n*)*)RECORDED_TODOS_END/i);
  if (m && m[1]) {
    const todoLines = m[1].split('\n');
    for (const line of todoLines) {
      const trimmed = line.trim();
      // line may be "TODO: text" or just "text"
      // normalize by stripping TODO: prefix
      const txt = normalizeTodo(trimmed);
      if (txt) recorded.push(txt);
    }
  }
  return recorded;
}

// ------- find TODO comments in .js files (normalize to just the text) -------

function findTodos() {
  const todos = [];
  const files = fs.readdirSync(PROJ_DIR).filter(f => f.endsWith('.js') && f !== 'morning-brief.js');
  for (const f of files) {
    const src = fs.readFileSync(path.join(PROJ_DIR, f), 'utf-8');
    // match // TODO: something  — capture just the text after "// TODO:"
    const matches = src.match(/(\/\/\s*TODO\s*:\s*(.+)$)/gm);
    if (matches) {
      for (const m of matches) {
        // m is "// TODO: something" — extract "something"
        // regex /^\/\/\s*TODO\s*:*/i removes the // TODO: prefix
        const txt = m.replace(/^\/\/\s*TODO\s*:*/i, '').trim();
        if (txt) todos.push(txt);
      }
    }
  }
  return todos;
}

// ------- write/update progress.md -------

function writeProgress({ recordedTODOs, newTODOs, dateStr, summary }) {
  // dedupe all recorded TODOs (already normalized)
  const allTODOs = [...new Set(recordedTODOs)];

  // add new TODOs if any (also normalized)
  if (newTODOs.length > 0) {
    allTODOs.push(...newTODOs);
  }
  // dedupe again
  const deduped = [...new Set(allTODOs)];

  // build the recorded TODOs section with TODO: prefix
  const recordedSection = deduped.length > 0
    ? deduped.map(t => `TODO: ${t}`).join('\n')
    : '';

  // build the run history entry
  const newTodoDisplay = newTODOs.length > 0
    ? newTODOs.map(t => `- ${t}`).join('\n')
    : 'None';

  const runEntry =
`### ${dateStr}

New TODOs found:
${newTodoDisplay}

`;

  // assemble full progress.md
  let md = '# Morning Brief Progress\n\n';
  md += '## Recorded TODOs\n';
  md += 'RECORDED_TODOS_START\n';
  md += recordedSection;
  md += '\nRECORDED_TODOS_END\n\n';
  md += '## Run History\n';
  md += runEntry;

  fs.writeFileSync(PROGRESS_FILE, md, 'utf-8');
}

// ------- main -------

// check lock guard (prevent runs faster than 1 minute apart)
if (fs.existsSync(LOCK_FILE)) {
  const data = fs.readFileSync(LOCK_FILE, 'utf-8').trim();
  const last = parseInt(data, 10);
  if (last && (Date.now() - last < 60000)) {
    console.log('Safety guard: a run occurred less than 1 minute ago. Exiting.');
    process.exit(0);
  }
}
fs.writeFileSync(LOCK_FILE, Date.now().toString(), 'utf-8');

// read previously recorded TODOs (normalized)
const recordedTODOs = readRecordedTODOs();

// find current TODOs in project files (normalized to just text)
const allTODOs = findTodos();

// determine new TODOs (not already in recorded list, using normalized comparison)
const newTODOs = allTODOs.filter(t => !recordedTODOs.includes(t));

// build summary
let summary;
if (newTODOs.length === 0) {
  summary = 'No new TODO items.';
} else {
  summary = newTODOs.join(', ');
}

// current date/time
const now = new Date();
const dateStr = now.toISOString().replace('T', ' ').slice(0, 16); // "YYYY-MM-DD HH:MM"

// update progress.md
writeProgress({
  recordedTODOs: recordedTODOs,  // already normalized
  newTODOs: newTODOs,           // already normalized
  dateStr,
  summary
});

console.log('Morning brief completed.');
console.log('New TODOs recorded:', JSON.stringify(newTODOs));
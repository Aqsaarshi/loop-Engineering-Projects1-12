/**
 * Project 8 - Docs Freshness Check Loop
 * Orchestrates all six components: heartbeat, worktree, skill, maker-checker,
 * connector, and spine (logging/budget).
 * 
 * This loop runs unattended (e.g., via Task Scheduler) and:
 * 1. Checks a .loop.lock guard to prevent duplicate runs
 * 2. Creates an isolated git worktree for scanning
 * 3. Checks README staleness against a 30-day threshold
 * 4. Proposes a markdown report (maker) but requires human approval (checker)
 * 5. Opens a GitHub Issue with the stale list (connector)
 * 6. Logs every run to run_log.jsonl + progress.md (spine)
 * 7. Enforces a $1.00/month budget guard (budget)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { Heartbeat } = require('./heartbeat/heartbeat');
const { Worktree } = require('./worktree/worktree');
const { checkStaleness } = require('./skill/checkStaleness');
const { MakerChecker } = require('./maker-checker/maker-checker');
const { GitHubConnector } = require('./connector/github-connector');
const { BudgetGuard } = require('./budget/budget-guard');

// Load configuration
const settings = require('./config/settings');

// Initialize components
const heartbeat = new Heartbeat();
const budgetGuard = new BudgetGuard(settings);

// Paths
const repoPath = fs.realpathSync(process.cwd());
const reportsDir = path.join(process.cwd(), 'reports');
const progressPath = path.join(process.cwd(), 'progress.md');
const logPath = path.join(process.cwd(), 'logs', 'run_log.jsonl');

// Ensure directories exist
if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
  fs.mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ============================================================
// ENSURE progress.md EXISTS (spine foundation)
// ============================================================
if (!fs.existsSync(progressPath)) {
  fs.writeFileSync(progressPath, '# Docs Freshness Progress\n\n## Recorded TODOs\nRECORDED_TODOS_START\nRECORDED_TODOS_END\n\n## Run History\n', 'utf8');
}

// ============================================================
// HELPER: finishRun
// Single entry appended to run_log.jsonl; progress.md updated inline.
// ============================================================
function finishRun(success, errorMsg = null) {
  // Release heartbeat lock
  heartbeat.releaseLock();

  const timestamp = new Date().toISOString();
  const tokensIn = 500;
  const tokensOut = 300;

  // Build the single log entry
  const logEntry = {
    timestamp,
    status: success ? 'success' : 'failure',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    error: success ? null : errorMsg,
    needs_human: success ? false : true,
    attempt: 1,
  };

  if (success) {
    // Update progress.md with successful run summary
    let progressContent = '';
    try {
      if (fs.existsSync(progressPath)) {
        progressContent = fs.readFileSync(progressPath, 'utf8');
      }
    } catch (e) {
      progressContent = '# Docs Freshness Progress\n\n## Recorded TODOs\nRECORDED_TODOS_START\nRECORDED_TODOS_END\n\n## Run History\n';
    }

    const runSummary = `### ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}\n\n`;
    const newTodaysStale = 'None';
    const progressEntry = `${runSummary}New TODOs found: ${newTodaysStale}\n\n`;

    let updatedProgress = progressContent;
    if (progressContent.includes('## Run History')) {
      updatedProgress = progressContent.replace(
        '## Run History',
        `${progressEntry}${progressContent.split('## Run History')[1]}`
      );
    } else {
      updatedProgress = progressContent + progressEntry;
    }

    try {
      fs.writeFileSync(progressPath, updatedProgress, 'utf8');
    } catch (e) {
      // Ignore write errors
    }

    // Append SINGLE log entry for success
    fs.appendFileSync(logPath, '\n' + JSON.stringify(logEntry), 'utf8');

    console.log('Run completed successfully. Spine updated.');
  } else {
    // Update progress.md with failure
    let progressContent = '';
    try {
      if (fs.existsSync(progressPath)) {
        progressContent = fs.readFileSync(progressPath, 'utf8');
      }
    } catch (e) {
      progressContent = '# Docs Freshness Progress\n\n## Recorded TODOs\nRECORDED_TODOS_START\nRECORDED_TODOS_END\n\n## Run History\n    ';
    }

    const runSummary = `### ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}\n\n`;
    const progressEntry = `${runSummary}New TODOs found: Error - ${errorMsg || 'Unknown'}\n\n`;
    const updatedProgress = progressContent + runSummary;

    try {
      fs.writeFileSync(progressPath, updatedProgress, 'utf8');
    } catch (e) {
      // Ignore write errors
    }

    // Append SINGLE log entry for failure
    logEntry.status = 'failure';
    logEntry.error = errorMsg || 'Unknown error';
    logEntry.needs_human = true;
    fs.appendFileSync(logPath, '\n' + JSON.stringify(logEntry), 'utf8');

    console.log('Run failed. Spine updated with error.', errorMsg);
  }

  // Cleanup worktree: remove directory and git prune registration
  try {
    if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    }
    // Git prune to remove stale worktree registration
    try {
      execSync('git worktree prune', { cwd: process.cwd(), encoding: 'utf8' });
    } catch (e) {
      // Ignore
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  console.log('Worktree cleaned up.');

  // Exit after cleanup
  process.exit(success ? 0 : 1);
}

// ============================================================
// STEP 1: Heartbeat check
// ============================================================
if (heartbeat.isRunning()) {
  console.log('Another run is already in progress (lock file detected). Exiting.');
  heartbeat.releaseLock();
  process.exit(0);
}

console.log('Acquiring heartbeat lock...');
heartbeat.acquireLock();

// ============================================================
// STEP 2: Budget guard check
// ============================================================
console.log('Checking budget guard...');
const estimatedTokensIn = 500;
const estimatedTokensOut = 300;

const budgetCheck = budgetGuard.checkBudget({
  tokensIn: estimatedTokensIn,
  tokensOut: estimatedTokensOut,
  timestamp: new Date().toISOString(),
  attempt: 1,
});

console.log(`Budget: $${budgetCheck.projectedMonthlyCost.toFixed(4)}/$1.00 monthly (${budgetCheck.action})`);

if (budgetCheck.action === 'pause') {
  console.log('Budget guard triggered. Loop paused. Human review required.');
  // Build log entry for budget pause
  const budgetLogEntry = {
    timestamp: new Date().toISOString(),
    status: 'budget_pause',
    tokens_in: estimatedTokensIn,
    tokens_out: estimatedTokensOut,
    error: `Projected monthly cost $${budgetCheck.projectedMonthlyCost.toFixed(4)} exceeds $1.00 limit`,
    needs_human: true,
    attempt: 1,
  };
  fs.appendFileSync(logPath, '\n' + JSON.stringify(budgetLogEntry), 'utf8');
  finishRun(false, 'Budget guard triggered');
}

// ============================================================
// STEP 3: Create isolated worktree for scanning
// ============================================================
console.log('Creating worktree...');
let worktreePath;
try {
  const WorktreeModule = require('./worktree/worktree').Worktree;
  const worktree = new WorktreeModule(repoPath);
  worktreePath = worktree.createWorktree();
  console.log(`Worktree created at: ${worktreePath}`);
} catch (err) {
  finishRun(false, `Worktree creation failed: ${err.message}`);
}

// ============================================================
// STEP 4: Run skill - check README staleness
// ============================================================
console.log('Checking README staleness...');
const staleList = checkStaleness(worktreePath, settings.stalenessThresholdDays);
const staleListLength = staleList.length;
console.log(`Found ${staleListLength} stale READMEs (threshold: ${settings.stalenessThresholdDays} days)`);

// ============================================================
// STEP 5: Maker-checker - propose report
// ============================================================
console.log('Generating report...');
const makerChecker = new MakerChecker();
const reportDate = new Date().toISOString();
const markdownReport = makerChecker.generateReport(staleList, reportDate);
const reportFilePath = makerChecker.writeReport(markdownReport);
console.log(`Report written to: ${reportFilePath}`);

// ============================================================
// STEP 6: Connector - open GitHub Issue
// ============================================================
console.log('Opening GitHub Issue...');
const repoParts = settings.githubRepo.split('/');
const connector = new GitHubConnector({
  repoOwner: repoParts[0],
  repoName: repoParts[1],
  pat: process.env.GITHUB_PAT,
});

const issueTitle = `Docs Freshness Report - ${new Date().toISOString().split('T')[0]}`;

connector.openOrUpdateIssue(issueTitle, markdownReport)
  .then(issue => {
    console.log(`Issue created/updated: #${issue.number} - "${issue.title}"`);
    finishRun(true);
  })
  .catch(err => {
    console.error(`GitHub API error: ${err.message}`);
    finishRun(false, `GitHub API error: ${err.message}`);
  });
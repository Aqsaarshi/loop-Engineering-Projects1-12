const fs = require('fs');
const path = require('path');

const BUDGET_LIMIT_MONTHLY = 1.00; // $1.00 monthly hard limit
const COST_PER_TOKEN = 0.000015; // $0.015 per 1K tokens = $0.000015 per token

/**
 * Budget Guard module.
 * Tracks tokens/cost per run and enforces a hard monthly budget limit.
 * If projected monthly cost exceeds the limit, the loop must pause and flag for human review.
 */
class BudgetGuard {
  constructor(config = {}) {
    this.costPerToken = config.costPerToken || COST_PER_TOKEN;
    this.thresholdDays = config.stalenessThresholdDays || 30;
    this.cadence = config.cadence || 'daily';
    this.monthlyRunLimit = config.maxMonthlyRuns || 72;
    this.runLogPath = path.join(process.cwd(), 'logs', 'run_log.jsonl');
    this.progressPath = path.join(process.cwd(), 'progress.md');
  }

  /**
   * Estimate tokens from file content size (same approach as project-7).
   * @param {string} content - File content text
   * @returns {number} Estimated token count (characters / 4)
   */
  estimateTokens(content) {
    return Math.max(1, Math.floor(content.length / 4));
  }

  /**
   * Calculate the projected monthly cost based on current run estimates and cadence.
   * @param {number} tokensIn - Estimated input tokens for this run
   * @param {number} tokensOut - Estimated output tokens for this run
   * @returns {Object} Cost breakdown including projected monthly total
   */
  calculateMonthlyCost(tokensIn, tokensOut) {
    const tokensPerRun = tokensIn + tokensOut;
    const costPerRun = tokensPerRun * this.costPerToken;

    // Calculate runs per month based on cadence
    let runsPerMonth;
    if (this.cadence === 'hourly') {
      runsPerMonth = 24 * 30; // 720 runs/month
    } else if (this.cadence === 'daily') {
      runsPerMonth = 30; // 30 runs/month
    } else if (this.cadence === 'weekly') {
      runsPerMonth = 4; // ~4 runs/month
    } else {
      runsPerMonth = 30; // default to daily
    }

    const projectedMonthlyCost = costPerRun * runsPerMonth;

    return {
      tokensPerRun,
      costPerRun,
      runsPerMonth,
      projectedMonthlyCost,
      withinBudget: projectedMonthlyCost <= BUDGET_LIMIT_MONTHLY,
    };
  }

  /**
   * Check the budget status for the current run.
   * If projected monthly cost exceeds $1.00, mark for human review.
   * @param {Object} runData - Object with { tokensIn, tokensOut, runId, timestamp }
   * @returns {Object} Budget status with action recommendation
   */
  checkBudget(runData) {
    const costInfo = this.calculateMonthlyCost(runData.tokensIn, runData.tokensOut);

    const result = {
      withinBudget: costInfo.withinBudget,
      projectedMonthlyCost: costInfo.projectedMonthlyCost,
      costPerRun: costInfo.costPerRun,
      runsPerMonth: costInfo.runsPerMonth,
      action: 'proceed',
      needsHumanReview: false,
    };

    if (!costInfo.withinBudget) {
      result.action = 'pause';
      result.needsHumanReview = true;
      result.reason = `Projected monthly cost $${costInfo.projectedMonthlyCost.toFixed(
        4
      )} exceeds $${BUDGET_LIMIT_MONTHLY.toFixed(2)} budget limit at ${this.cadence} cadence.`;

      // Write budget flag to progress.md
      this._writeBudgetFlag(runData);
    }

    return result;
  }

  /**
   * Write a budget warning to progress.md and append a budget entry to run_log.jsonl.
   * @param {Object} runData - Run metadata including tokens, timing, etc.
   * @returns {void}
   */
  _writeBudgetFlag(runData) {
    // Append budget warning to progress.md
    const flagLine = `\n⚠️ BUDGET GUARD: ${new Date().toISOString()} - Projected monthly cost ${
      (runData.tokensIn + runData.tokensOut) * this.costPerToken * 30
    }.00 exceeds $1.00/month limit. Loop paused. Review required.`;

    let progressContent = '';
    try {
      if (fs.existsSync(this.progressPath)) {
        progressContent = fs.readFileSync(this.progressPath, 'utf8');
      }
    } catch (e) {
      progressContent = '';
    }

    // Add budget flag if not already present
    if (!progressContent.includes('BUDGET GUARD')) {
      const update = progressContent.replace(
        'RECORDED_TODOS_END',
        `RECORDED_TODOS_END${flagLine}`
      );
      try {
        fs.writeFileSync(this.progressPath, update, 'utf8');
      } catch (e) {
        // Ignore write errors
      }
    }

    // Append entry to run_log.jsonl
    const logEntry = {
      timestamp: runData.timestamp,
      status: 'budget_pause',
      tokens_in: runData.tokensIn,
      tokens_out: runData.tokensOut,
      error: `Projected monthly cost exceeds $${BUDGET_LIMIT_MONTHLY.toFixed(
        2
      )} budget limit`,
      needs_human: true,
      attempt: runData.attempt || 1,
    };

    try {
      const logLine = JSON.stringify(logEntry);
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(path.join(logDir, 'run_log.jsonl'), '\n' + logLine, 'utf8');
    } catch (e) {
      // Ignore log write errors
    }
  }
}

module.exports = { BudgetGuard };
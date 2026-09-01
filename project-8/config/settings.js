// Project 8 Configuration - Docs Freshness Check

module.exports = {
  // How often the loop runs (for cost calculation)
  // Options: 'hourly', 'daily', 'weekly'
  cadence: 'daily',

  // Staleness threshold in days - READMEs older than this are flagged
  stalenessThresholdDays: 30,

  // Budget configuration
  // $1.00 monthly hard limit using $0.000015 per token
  costPerToken: 0.000015,

  // Estimated tokens per run (will be measured at runtime)
  // These are fallback estimates
  estimatedTokensIn: 500,
  estimatedTokensOut: 300,

  // Maximum monthly runs before budget guard triggers
  maxMonthlyRuns: 72, // ~daily runs

  // Worktree configuration
  worktreeBaseDir: './worktree',

  // GitHub configuration
  githubRepo: 'Aqsaarshi/loop-Engineering-Projects1-12',
};
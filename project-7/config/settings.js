// Project 7 Configuration

module.exports = {
  // How often the loop runs (for cost calculation)
  // Options: 'hourly', 'daily', 'weekly'
  cadence: 'daily',
  
  // Retry/attempt limit to prevent infinite loops
  retryLimit: 3,
  
  // Token pricing (approximate, per token)
  // Using $0.015 per 1K tokens = $0.000015 per token
  costPerToken: 0.000015,
  
  // Estimated tokens per run (will be measured at runtime)
  // These are fallback estimates
  estimatedTokensIn: 200,
  estimatedTokensOut: 150,
  
  // Sabotage configuration
  sabotage: {
    enabled: true,
    method: 'missing_file', // 'missing_file' or 'impossible_condition'
    targetFile: 'nonexistent-file.js'
  }
};
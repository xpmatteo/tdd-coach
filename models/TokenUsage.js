/**
 * TokenUsage class for tracking LLM token usage and calculating estimated costs.
 */
class TokenUsage {
  /**
   * Create a new TokenUsage tracker.
   */
  constructor() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.callCount = 0;
    
    // Cost per million tokens (in USD)
    this.INPUT_COST_PER_MTOK = 3.00;
    this.OUTPUT_COST_PER_MTOK = 15.00;
  }

  /**
   * Add token usage from an LLM interaction.
   * @param {number} inputTokens - Number of input tokens used
   * @param {number} outputTokens - Number of output tokens used
   */
  addUsage(inputTokens, outputTokens) {
    if (typeof inputTokens !== 'number' || typeof outputTokens !== 'number') {
      throw new Error('Input and output tokens must be numbers');
    }
    
    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error('Token counts cannot be negative');
    }
    
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
    this.callCount += 1;
    
    return this;
  }

  /**
   * Calculate the estimated cost of token usage so far.
   * @returns {number} Estimated cost in USD
   */
  getEstimatedCost() {
    const inputCost = (this.inputTokens / 1_000_000) * this.INPUT_COST_PER_MTOK;
    const outputCost = (this.outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MTOK;
    
    return inputCost + outputCost;
  }

  /**
   * Get formatted cost string.
   * @returns {string} Cost formatted as currency
   */
  getFormattedCost() {
    return `$${this.getEstimatedCost().toFixed(6)}`;
  }

  /**
   * Get detailed usage statistics.
   * @returns {Object} Object containing usage statistics
   */
  getStats() {
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      callCount: this.callCount,
      estimatedCost: this.getEstimatedCost(),
      formattedCost: this.getFormattedCost(),
      inputCost: (this.inputTokens / 1_000_000) * this.INPUT_COST_PER_MTOK,
      outputCost: (this.outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MTOK
    };
  }

  /**
   * Reset usage statistics.
   */
  reset() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.callCount = 0;
    return this;
  }
}

module.exports = TokenUsage;

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
    this.actualCost = 0;
    this.provider = 'openrouter'; // Provider is always openrouter now
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet'; // Store the model being used
  }
  
  /**
   * Set the model being used (provider is always openrouter)
   * @param {string} _provider - Ignored, always 'openrouter'
   * @param {string} model - The model name when using OpenRouter
   */
  setProvider(_provider = 'openrouter', model = '') {
    this.provider = 'openrouter'; // Always openrouter
    this.model = model;
    // No pricing logic needed here anymore
  }

  /**
   * Add token usage from an LLM interaction.
   * @param {number} inputTokens - Number of input tokens used
   * @param {number} outputTokens - Number of output tokens used
   * @param {number} [cost] - Actual cost reported by the API (primarily for OpenRouter)
   * @returns {TokenUsage} - Returns this for method chaining
   */
  addUsage(inputTokens, outputTokens, cost) {
    if (typeof inputTokens !== 'number' || typeof outputTokens !== 'number') {
      throw new Error('Input and output tokens must be numbers');
    }
    
    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error('Token counts cannot be negative');
    }
    
    // Validate cost if provided
    if (cost !== undefined && cost !== null) {
      if (typeof cost !== 'number') {
        throw new Error('Cost must be a number if provided');
      }
      if (cost < 0) {
        throw new Error('Cost cannot be negative');
      }
      this.actualCost += cost;
    }
    
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
    this.callCount += 1;
    
    return this;
  }

  /**
   * Get the total actual cost reported by the API so far.
   * @returns {number} Actual cost in USD
   */
  getTotalCost() {
    // We rely solely on the actual cost provided by the OpenRouter API
    return this.actualCost;
  }

  /**
   * Get formatted cost string.
   * @returns {string} Cost formatted as currency
   */
  getFormattedCost() {
    // Format with fewer decimal places for UI display, and use dollar sign
    return `$${this.getTotalCost().toFixed(4)}`;
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
      totalCost: this.getTotalCost(),
      formattedCost: this.getFormattedCost(),
    };
  }

  /**
   * Reset usage statistics.
   * @returns {TokenUsage} - Returns this for method chaining
   */
  reset() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.callCount = 0;
    this.actualCost = 0;
    return this;
  }
}

module.exports = TokenUsage;
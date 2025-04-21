/**
 * RunningCost class for tracking cumulative LLM API cost.
 */
class RunningCost {
  /**
   * Create a new RunningCost tracker.
   */
  constructor() {
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
    this.provider = 'openrouter'; // Keep track of provider (always openrouter)
    this.model = model;
    // No pricing logic needed here anymore
  }

  /**
   * Add cost from an LLM interaction.
   * @param {number} [cost] - Actual cost reported by the API (primarily for OpenRouter)
   * @returns {RunningCost} - Returns this for method chaining
   */
  addCost(cost) {
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
      callCount: this.callCount,
      totalCost: this.getTotalCost(),
      formattedCost: this.getFormattedCost(),
    };
  }

  /**
   * Reset usage statistics.
   * @returns {RunningCost} - Returns this for method chaining
   */
  reset() {
    this.callCount = 0;
    this.actualCost = 0;
    return this;
  }
}

module.exports = RunningCost;
/**
 * TokenUsage class for tracking LLM token usage and calculating estimated costs.
 */
class TokenUsage {
  // Static constants for provider pricing (per million tokens in USD)
  static OPENROUTER_ANTHROPIC_PRICING = {
    INPUT_COST_PER_MTOK: 3.00, // Same as direct pricing for Claude
    OUTPUT_COST_PER_MTOK: 15.00 // Same as direct pricing for Claude
  };
  
  static OPENROUTER_GPT4_PRICING = {
    INPUT_COST_PER_MTOK: 10.00,
    OUTPUT_COST_PER_MTOK: 30.00
  };
  
  /**
   * Create a new TokenUsage tracker.
   */
  constructor() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.callCount = 0;
    this.actualCost = 0;
    
    this.setProvider('openrouter', process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet'); // Default to OpenRouter
  }
  
  /**
   * Set the provider for cost calculations
   * @param {string} provider - The provider name (anthropic or openrouter)
   * @param {string} model - The model name when using OpenRouter
   */
  setProvider(provider = 'anthropic', model = '') {
    // Ensure provider is always OpenRouter
    provider = 'openrouter';

    this.provider = provider;
    this.model = model;

    // Update pricing based on the OpenRouter model
    if (model.includes('anthropic') || model.includes('claude')) {
      this.INPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_ANTHROPIC_PRICING.INPUT_COST_PER_MTOK;
      this.OUTPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK;
    } else if (model.includes('gpt-4')) {
      this.INPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_GPT4_PRICING.INPUT_COST_PER_MTOK;
      this.OUTPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_GPT4_PRICING.OUTPUT_COST_PER_MTOK;
    } else {
      // Fallback or default pricing if model is unknown or different
      // For now, let's default to Claude pricing if model not recognized
      console.warn(`Unknown OpenRouter model: ${model}. Using Claude pricing as default.`);
      this.INPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_ANTHROPIC_PRICING.INPUT_COST_PER_MTOK;
      this.OUTPUT_COST_PER_MTOK = TokenUsage.OPENROUTER_ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK;
    }
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
   * Calculate the estimated cost of token usage so far.
   * @returns {number} Estimated cost in USD
   */
  getEstimatedCost() {
    // If we have actual cost data from the API, use that instead of calculating
    if (this.actualCost > 0) {
      return this.actualCost;
    }
    
    // Otherwise calculate based on token counts and rates
    const inputCost = (this.inputTokens / 1_000_000) * this.INPUT_COST_PER_MTOK;
    const outputCost = (this.outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MTOK;
    
    return inputCost + outputCost;
  }

  /**
   * Get formatted cost string.
   * @returns {string} Cost formatted as currency
   */
  getFormattedCost() {
    // Format with fewer decimal places for UI display, and use dollar sign
    return `$${this.getEstimatedCost().toFixed(4)}`;
  }

  /**
   * Get detailed usage statistics.
   * @returns {Object} Object containing usage statistics
   */
  getStats() {
    const inputCost = (this.inputTokens / 1_000_000) * this.INPUT_COST_PER_MTOK;
    const outputCost = (this.outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MTOK;
    const usingActualCost = this.actualCost > 0;
    
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      callCount: this.callCount,
      estimatedCost: this.getEstimatedCost(),
      formattedCost: this.getFormattedCost(),
      inputCost: inputCost,
      outputCost: outputCost,
      usingActualCost: usingActualCost
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
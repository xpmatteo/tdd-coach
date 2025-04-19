const Anthropic = require('@anthropic-ai/sdk');

/**
 * AnthropicAdapter - Adapter for Anthropic API
 * This class provides an interface to interact with the Anthropic API
 */
class AnthropicAdapter {
  /**
   * Create a new AnthropicAdapter
   * @param {string} apiKey - The Anthropic API key
   */
  constructor(apiKey, modelName) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // The best model to use (default to claude-3-7-sonnet if not provided)
    this.modelName = modelName || 'claude-3-7-sonnet-latest';

    // Initialize the Anthropic client
    this.client = new Anthropic({
      apiKey: apiKey
    });
  }

  /**
   * Creates a message with the Anthropic API
   * @param {Object} options - Options for the message
   * @param {string} options.system - System prompt
   * @param {Array} options.messages - Array of message objects
   * @param {number} options.max_tokens - Maximum tokens to generate
   * @returns {Promise<Object>} - Response from Anthropic API
   */
  async createMessage(options) {
    // Validate inputs
    if (!options.system || !options.messages || !options.messages.length) {
      throw new Error('Missing required parameters');
    }
    
    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: options.max_tokens,
        system: options.system,
        messages: options.messages
      });

      return response;
    } catch (error) {
      console.error('Error in Anthropic API call:', error);
      throw new Error(`Failed to get response from Anthropic: ${error.message}`);
    }
  }
}

module.exports = AnthropicAdapter;

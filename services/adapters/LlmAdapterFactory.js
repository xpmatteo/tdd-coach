const OpenRouterAdapter = require('./OpenRouterAdapter');
const MockAdapter = require('./MockAdapter');

/**
 * Factory for creating LLM adapter instances based on environment configuration
 */
class LlmAdapterFactory {
  /**
   * Create an adapter for the configured LLM provider
   * @param {boolean} forTesting - Whether the adapter is being created for testing
   * @returns {Object} - An adapter instance for the configured provider
   */
  static createAdapter(forTesting = false) {
    // Use MockAdapter for testing
    if (forTesting || process.env.NODE_ENV === 'test') {
      console.log('Using Mock Adapter for LLM services');
      return new MockAdapter();
    }

    // Always use OpenRouter for non-testing environments
    console.log('Using OpenRouter API for LLM services');
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    if (!process.env.OPENROUTER_MODEL) {
      throw new Error('OPENROUTER_MODEL environment variable is required');
    }
    return new OpenRouterAdapter(
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_MODEL
    );
  }
}

module.exports = LlmAdapterFactory;

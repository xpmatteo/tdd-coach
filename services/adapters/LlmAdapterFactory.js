const AnthropicAdapter = require('./AnthropicAdapter');
const OpenRouterAdapter = require('./OpenRouterAdapter');

/**
 * Factory for creating LLM adapter instances based on environment configuration
 */
class LlmAdapterFactory {
  /**
   * Create an adapter for the configured LLM provider
   * @returns {Object} - An adapter instance for the configured provider
   */
  static createAdapter() {
    const provider = process.env.LLM_PROVIDER || 'anthropic';
    
    switch (provider.toLowerCase()) {
      case 'anthropic':
        console.log('Using Anthropic API for LLM services');
        return new AnthropicAdapter(
          process.env.ANTHROPIC_API_KEY,
          process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-latest'
        );
        
      case 'openrouter':
        console.log('Using OpenRouter API for LLM services');
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY environment variable is required when using OpenRouter');
        }
        if (!process.env.OPENROUTER_MODEL) {
          throw new Error('OPENROUTER_MODEL environment variable is required when using OpenRouter');
        }
        return new OpenRouterAdapter(
          process.env.OPENROUTER_API_KEY,
          process.env.OPENROUTER_MODEL
        );
        
      default:
        console.warn(`Unknown LLM provider: ${provider}. Falling back to Anthropic.`);
        return new AnthropicAdapter(
          process.env.ANTHROPIC_API_KEY,
          process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-latest'
        );
    }
  }
}

module.exports = LlmAdapterFactory;

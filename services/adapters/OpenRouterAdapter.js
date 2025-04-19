const OpenAI = require('openai');

/**
 * OpenRouterAdapter - Adapter for OpenRouter API
 * This class provides a compatible interface to interact with OpenRouter's API
 * while maintaining compatibility with the existing LLM service.
 */
class OpenRouterAdapter {
  /**
   * Create a new OpenRouterAdapter
   * @param {string} apiKey - The OpenRouter API key
   * @param {string} modelName - The model name to use with OpenRouter
   */
  constructor(apiKey, modelName) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    if (!modelName) {
      throw new Error('OpenRouter model name is required');
    }

    this.modelName = modelName;
    
    // Initialize OpenAI client with OpenRouter base URL
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });
  }

  /**
   * Creates a message with the OpenRouter API
   * @param {Object} options - Options for the message
   * @param {string} options.system - System prompt
   * @param {Array} options.messages - Array of message objects
   * @param {number} options.max_tokens - Maximum tokens to generate
   * @returns {Promise<Object>} - Response from OpenRouter API
   */
  async createMessage(options) {
    try {
      // OpenRouter uses the OpenAI API format
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        max_tokens: options.max_tokens,
        // Add system message as the first message with role=system
        messages: [
          { role: 'system', content: options.system },
          ...options.messages
        ],
      });

      // Transform the response to match Anthropic's format
      return this.transformResponse(response);
    } catch (error) {
      console.error('Error in OpenRouterAdapter:', error);
      throw new Error(`Failed to get response from OpenRouter: ${error.message}`);
    }
  }

  /**
   * Transform OpenRouter's response to match Anthropic's format
   * @param {Object} response - Response from OpenRouter
   * @returns {Object} - Transformed response matching Anthropic's format
   */
  transformResponse(response) {
    // Extract the message content
    const messageContent = response.choices[0].message.content;
    
    // Extract usage data
    const usage = response.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    // Return a response format compatible with Anthropic's API
    return {
      id: response.id,
      content: [{ text: messageContent, type: 'text' }],
      usage: {
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      }
    };
  }
}

module.exports = OpenRouterAdapter;

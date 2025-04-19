/**
 * MockAdapter - A mock adapter for testing
 * This adapter simulates responses from an LLM provider without making actual API calls
 */
class MockAdapter {
  /**
   * Create a new MockAdapter
   */
  constructor() {
    this.modelName = 'mock-model';
  }

  /**
   * Creates a mock message
   * @param {Object} options - Options for the message
   * @returns {Promise<Object>} - Mocked response
   */
  async createMessage(options) {
    // Validate inputs like the real adapters would
    if (!options.system || !options.messages || !options.messages.length) {
      throw new Error('Missing required parameters');
    }
    
    // Return a mocked response that mimics the structure expected by llmService
    return {
      id: 'mock-response-id',
      content: [{ 
        text: JSON.stringify({
          comments: 'Test comment',
          hint: 'Test hint',
          proceed: 'yes'
        }), 
        type: 'text' 
      }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
      }
    };
  }
}

module.exports = MockAdapter;

const { getLlmFeedback } = require('../../services/llmService');
const TokenUsage = require('../../models/TokenUsage');
const LlmAdapterFactory = require('../../services/adapters/LlmAdapterFactory');

// Mock the adapter factory
jest.mock('../../services/adapters/LlmAdapterFactory', () => {
  return {
    createAdapter: jest.fn()
  };
});

describe('LLM Service Error Handling', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockAdapter;
  
  beforeEach(() => {
    // Spy on console methods to prevent test output pollution
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a mock adapter that we can control for testing
    mockAdapter = {
      createMessage: jest.fn()
    };
    
    // Configure the factory to return our mock adapter
    LlmAdapterFactory.createAdapter.mockReturnValue(mockAdapter);
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('should handle network errors and return error object', async () => {
    // Set up the mock adapter to throw a network error
    const networkError = new Error('Network connection failed');
    networkError.name = 'NetworkError';
    mockAdapter.createMessage.mockRejectedValue(networkError);
    
    // Call the service
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    
    const result = await getLlmFeedback(prompts);
    
    // Verify the error is handled correctly
    expect(result).toHaveProperty('error');
    expect(result.error.type).toBe('network');
    expect(result.error.message).toContain('Network connection failed');
    expect(result.error.originalError).toBe(networkError);
  });

  test('should handle API errors and return error object', async () => {
    // Set up the mock adapter to throw an API error
    const apiError = new Error('API responded with 429 Too Many Requests');
    apiError.status = 429;
    apiError.name = 'ApiError';
    mockAdapter.createMessage.mockRejectedValue(apiError);
    
    // Call the service
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    
    const result = await getLlmFeedback(prompts);
    
    // Verify the error is handled correctly
    expect(result).toHaveProperty('error');
    expect(result.error.type).toBe('api');
    expect(result.error.message).toContain('429 Too Many Requests');
    expect(result.error.status).toBe(429);
    expect(result.error.originalError).toBe(apiError);
  });

  test('should handle JSON parsing errors and return error object', async () => {
    // Set up the mock adapter to return invalid JSON
    mockAdapter.createMessage.mockResolvedValue({
      content: [{ text: 'This is not valid JSON' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    });
    
    // Call the service
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    
    const result = await getLlmFeedback(prompts);
    
    // Verify the error is handled correctly
    expect(result).toHaveProperty('error');
    expect(result.error.type).toBe('parse');
    expect(result.error.message).toContain('Failed to parse LLM response');
    expect(result.error.rawResponse).toBe('This is not valid JSON');
  });

  test('should still update token usage even when parsing fails', async () => {
    // Set up the mock adapter to return invalid JSON
    mockAdapter.createMessage.mockResolvedValue({
      content: [{ text: 'This is not valid JSON' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    });
    
    // Call the service with token usage
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    const tokenUsage = new TokenUsage();
    
    await getLlmFeedback(prompts, tokenUsage);
    
    // Verify token usage was still updated
    expect(tokenUsage.inputTokens).toBe(100);
    expect(tokenUsage.outputTokens).toBe(50);
  });
});

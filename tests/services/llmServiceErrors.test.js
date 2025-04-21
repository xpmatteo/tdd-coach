const { getLlmFeedback } = require('../../services/llmService');
const RunningCost = require('../../models/RunningCost');

// Mock the llmService itself for these error tests
jest.mock('../../services/llmService');

// Mock console logging to prevent cluttering test output
// Spies will be set up in beforeEach now

describe('LLM Service Error Handling', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let prompts;
  let runningCost;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Reset mocks before each test
    getLlmFeedback.mockClear(); // Reset the mock service function

    // Set up default prompts and token usage
    prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    runningCost = new RunningCost();
  });
  
  afterEach(() => {
    // Restore console spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('should handle network errors and return error object', async () => {
    // Configure mock for this specific test
    const networkError = new Error('Network connection failed');
    networkError.name = 'NetworkError';
    networkError.type = 'network';
    getLlmFeedback.mockImplementation(async () => { throw networkError; });

    // Call the service
    await expect(getLlmFeedback(prompts, runningCost))
      .rejects.toThrow('Network connection failed');
    
    // Verify the thrown error has the correct type
    try {
      await getLlmFeedback(prompts, runningCost);
    } catch (error) {
      expect(error.type).toBe('network');
    }
  });

  test('should handle API errors and return error object', async () => {
    // Configure mock for this specific test
    const apiError = new Error('429 Too Many Requests'); // Corrected message for consistency
    apiError.status = 429;
    apiError.name = 'ApiError';
    apiError.type = 'api';
    getLlmFeedback.mockImplementation(async () => { throw apiError; });

    // Call the service
    await expect(getLlmFeedback(prompts, runningCost))
      .rejects.toThrow('429 Too Many Requests');
    
    // Verify the thrown error has the correct properties
    try {
      await getLlmFeedback(prompts, runningCost);
    } catch (error) {
      expect(error.type).toBe('api');
      expect(error.status).toBe(429);
    }
  });

  test('should handle JSON parsing errors and return error object', async () => {
    // Configure mock for this specific test
    const parseError = new Error('Failed to parse LLM response as JSON: Unexpected token');
    parseError.type = 'parse';
    parseError.rawResponse = 'This is not valid JSON';
    parseError.originalError = new SyntaxError('Unexpected token');
    getLlmFeedback.mockImplementation(async (prompts, costTracker) => {
      // Simulate token usage update *before* throwing parse error
      if (costTracker) { costTracker.addCost(0.123); }
      throw parseError;
    });

    // Call the service
    await expect(getLlmFeedback(prompts, runningCost))
      .rejects.toThrow(/Failed to parse LLM response as JSON:/);
    
    // Verify the thrown error has the correct properties
    try {
      await getLlmFeedback(prompts, runningCost);
    } catch (error) {
      expect(error.type).toBe('parse');
      expect(error.rawResponse).toBe('This is not valid JSON');
      expect(error.originalError).toBeInstanceOf(SyntaxError);
    }
  });

  test('should still update token usage even when parsing fails', async () => {
    // Configure mock for this specific test
    const parseErrorForTokenTest = new Error('Failed to parse LLM response as JSON: Something went wrong');
    parseErrorForTokenTest.type = 'parse';
    parseErrorForTokenTest.rawResponse = 'Invalid JSON data';
    parseErrorForTokenTest.originalError = new SyntaxError('Something went wrong');
    getLlmFeedback.mockImplementation(async (prompts, costTracker) => {
      // Simulate token usage update *before* throwing parse error
      if (costTracker) {
        costTracker.addCost(0.456);
      }
      throw parseErrorForTokenTest;
    });

    // Call the service
    await expect(getLlmFeedback(prompts, runningCost))
      .rejects.toThrow(/Failed to parse LLM response as JSON: Something went wrong/);
    
    // Verify cost was still updated
    expect(runningCost.actualCost).toBe(0.456);
    expect(runningCost.callCount).toBe(1);
  });
});

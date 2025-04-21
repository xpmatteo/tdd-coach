const { getLlmFeedback } = require('../../services/llmService');
const TokenUsage = require('../../models/TokenUsage');

// Mock the Anthropic client
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockImplementation((options) => {
          // Validate that system and messages are provided
          if (!options.system || !options.messages || !options.messages.length) {
            throw new Error('Missing required parameters');
          }
          
          return Promise.resolve({
            content: [{ text: JSON.stringify({
              comments: "Test comment",
              hint: "Test hint",
              proceed: "yes"
            })}],
            usage: {
              input_tokens: 100,
              output_tokens: 50
            }
          });
        })
      }
    };
  });
});

describe('llmService', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    // Spy on console.log and console.error to prevent test output pollution
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('getLlmFeedback processes system and user prompts correctly', async () => {
    // Setup
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    const tokenUsage = new TokenUsage();
    
    // Execute
    const result = await getLlmFeedback(prompts, tokenUsage);
    
    // Verify
    expect(result).toHaveProperty('comments', 'Test comment');
    expect(result).toHaveProperty('hint', 'Test hint');
    expect(result).toHaveProperty('proceed', 'yes');
  });
  
  test('getLlmFeedback updates token usage when provided', async () => {
    // Setup
    const prompts = {
      system: "You are a TDD coach",
      user: "Here is the code to review"
    };
    const tokenUsage = new TokenUsage();
    
    // Execute
    await getLlmFeedback(prompts, tokenUsage);
    
    // Verify
    expect(tokenUsage.inputTokens).toBe(100);
    expect(tokenUsage.outputTokens).toBe(50);
  });
  
  test('getLlmFeedback throws error when prompts are missing', async () => {
    // Test for null prompts
    await expect(getLlmFeedback(null))
      .rejects.toThrow('Both system and user prompts are required');
    
    // Test for missing system prompt
    await expect(getLlmFeedback({ user: 'usr' }))
      .rejects.toThrow('Both system and user prompts are required');
    
    // Test for missing user prompt
    await expect(getLlmFeedback({ system: 'sys' }))
      .rejects.toThrow('Both system and user prompts are required');
    
    // Test for empty object
    await expect(getLlmFeedback({}))
      .rejects.toThrow('Both system and user prompts are required');
  });
});

const { getLlmFeedback } = require('../../services/llmService');
const TokenUsage = require('../../models/TokenUsage');

// Mock the Anthropic client
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: JSON.stringify({
            comments: "Test comment",
            hint: "Test hint",
            proceed: "yes"
          })}],
          usage: {
            input_tokens: 100,
            output_tokens: 50
          }
        })
      }
    };
  });
});

describe('llmService', () => {
  let consoleLogSpy;
  
  beforeEach(() => {
    // Spy on console.log to prevent test output pollution
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
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
    // Verify
    await expect(getLlmFeedback(null)).rejects.toThrow('Both system and user prompts are required');
    await expect(getLlmFeedback({})).rejects.toThrow('Both system and user prompts are required');
    await expect(getLlmFeedback({ system: "System only" })).rejects.toThrow('Both system and user prompts are required');
    await expect(getLlmFeedback({ user: "User only" })).rejects.toThrow('Both system and user prompts are required');
  });
});

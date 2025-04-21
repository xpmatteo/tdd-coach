const { getLlmFeedback } = require('../../services/llmService');
const TokenUsage = require('../../models/TokenUsage');

// Note: No need to mock specific SDKs anymore.
// The LlmAdapterFactory automatically returns MockAdapter in test environment.

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
    const setProviderSpy = jest.spyOn(tokenUsage, 'setProvider');
    
    // Execute
    await getLlmFeedback(prompts, tokenUsage);
    
    // Verify
    // Check that setProvider was called correctly (assuming OpenRouter)
    expect(setProviderSpy).toHaveBeenCalledWith('openrouter', process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet');
    expect(tokenUsage.inputTokens).toBe(100);
    expect(tokenUsage.outputTokens).toBe(50);
    setProviderSpy.mockRestore(); // Clean up spy
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

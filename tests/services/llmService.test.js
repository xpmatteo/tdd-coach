const RunningCost = require('../../models/RunningCost');

// Mock the factory *before* requiring the service
jest.mock('../../services/adapters/LlmAdapterFactory');

const LlmAdapterFactory = require('../../services/adapters/LlmAdapterFactory');
const { getLlmFeedback } = require('../../services/llmService'); // Require service after mocking factory

// Mock function for the adapter's method
const mockCreateMessage = jest.fn();

// Original llmService tests (should ideally use the default mock adapter)
// describe('llmService', () => {
//   let consoleLogSpy;
//   let consoleErrorSpy;
  
//   beforeEach(() => {
//     // Reset the specific mock for the factory before these tests
//     LlmAdapterFactory.createAdapter.mockImplementation(() => 
//       LlmAdapterFactory.createAdapter(true) // Get the default MockAdapter
//     );
//     consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
//     consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
//   });
  
//   afterEach(() => {
//     consoleLogSpy.mockRestore();
//     consoleErrorSpy.mockRestore();
//   });

//   test('getLlmFeedback processes system and user prompts correctly', async () => {
//     // Setup
//     const prompts = {
//       system: "You are a TDD coach",
//       user: "Here is the code to review"
//     };
//     const runningCost = new RunningCost();
    
//     // Execute
//     const result = await getLlmFeedback(prompts, runningCost);
    
//     // Verify
//     expect(result).toHaveProperty('comments', 'Test comment');
//     expect(result).toHaveProperty('hint', 'Test hint');
//     expect(result).toHaveProperty('proceed', 'yes');
//   });
  
//   test('getLlmFeedback updates token usage when provided', async () => {
//     // Setup
//     const prompts = {
//       system: "You are a TDD coach",
//       user: "Here is the code to review"
//     };
//     const runningCost = new RunningCost();
//     const setProviderSpy = jest.spyOn(runningCost, 'setProvider');
//     const addCostSpy = jest.spyOn(runningCost, 'addCost');
    
//     // Execute
//     await getLlmFeedback(prompts, runningCost);
    
//     // Verify
//     expect(setProviderSpy).toHaveBeenCalledWith('openrouter', process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet');
//     expect(addCostSpy).toHaveBeenCalledWith(undefined); // MockAdapter doesn't provide cost
//     expect(runningCost.actualCost).toBe(0); 
//     expect(runningCost.callCount).toBe(1); 
//     setProviderSpy.mockRestore();
//     addCostSpy.mockRestore(); 
//   });
  
//   test('getLlmFeedback throws error when prompts are missing', async () => {
//     await expect(getLlmFeedback(null))
//       .rejects.toThrow('Both system and user prompts are required');
//     await expect(getLlmFeedback({ user: 'usr' }))
//       .rejects.toThrow('Both system and user prompts are required');
//     await expect(getLlmFeedback({ system: 'sys' }))
//       .rejects.toThrow('Both system and user prompts are required');
//     await expect(getLlmFeedback({}))
//       .rejects.toThrow('Both system and user prompts are required');
//   });
// });

// --- Tests for JSON Parsing logic ---

// Remove the previous mock configuration from here
// LlmAdapterFactory.createAdapter.mockReturnValue({
//   createMessage: mockCreateMessage
// });

describe('llmService - JSON Parsing and Markdown Stripping', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  const prompts = { system: 'sys', user: 'usr' };

  beforeEach(() => {
    // Configure the factory mock to return our specific mock function
    // This ensures llmService gets our mock when createAdapter is called
    LlmAdapterFactory.createAdapter.mockReturnValue({
        createMessage: mockCreateMessage
    });
    // Reset the mock function's call history etc.
    mockCreateMessage.mockClear();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const validFeedback = { comments: 'ok', hint: 'go', proceed: 'yes' };
  const validFeedbackJson = JSON.stringify(validFeedback);

  test('should parse valid JSON without markdown fences', async () => {
    // Configure the mock response *for this specific test*
    mockCreateMessage.mockResolvedValue({
      content: [{ text: validFeedbackJson, type: 'text' }],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
    });

    const result = await getLlmFeedback(prompts);
    expect(result).toEqual(validFeedback);
    expect(mockCreateMessage).toHaveBeenCalledTimes(1);
  });

  test('should parse valid JSON wrapped in ```json fences', async () => {
    const rawResponse = "```json\n" + validFeedbackJson + "\n```";
    // Configure the mock response *for this specific test*
    mockCreateMessage.mockResolvedValue({
      content: [{ text: rawResponse, type: 'text' }],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
    });

    const result = await getLlmFeedback(prompts);
    expect(result).toEqual(validFeedback);
    expect(mockCreateMessage).toHaveBeenCalledTimes(1);
  });

  test('should parse valid JSON wrapped in ``` fences (no language)', async () => {
    const rawResponse = "```\n" + validFeedbackJson + "\n```";
    // Configure the mock response *for this specific test*
    mockCreateMessage.mockResolvedValue({
      content: [{ text: rawResponse, type: 'text' }],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
    });

    const result = await getLlmFeedback(prompts);
    expect(result).toEqual(validFeedback);
    expect(mockCreateMessage).toHaveBeenCalledTimes(1);
  });

  test('should handle extra whitespace around fences and JSON', async () => {
      const rawResponse = "  ```json  \n  " + validFeedbackJson + "  \n  ```  ";
      // Configure the mock response *for this specific test*
      mockCreateMessage.mockResolvedValue({
        content: [{ text: rawResponse, type: 'text' }],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
      });

      const result = await getLlmFeedback(prompts);
      expect(result).toEqual(validFeedback);
      expect(mockCreateMessage).toHaveBeenCalledTimes(1);
  });

  test('should throw parse error for invalid JSON within ```json fences', async () => {
    const invalidJson = '{ "comments": "bad", "hint": "stop", "proceed": "no" '; // Missing closing brace
    const rawResponse = "```json\n" + invalidJson + "\n```";
    const cleanedResponse = invalidJson.trim();
    mockCreateMessage.mockResolvedValue({
      content: [{ text: rawResponse, type: 'text' }],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
    });

    await expect(getLlmFeedback(prompts)).rejects.toThrow(/^Failed to parse LLM response as JSON:/);
    try {
      await getLlmFeedback(prompts);
    } catch (error) {
      expect(error.type).toBe('parse');
      expect(error.rawResponse).toBe(rawResponse);
      expect(error.cleanedResponse).toBe(cleanedResponse);
      expect(error.originalError).toBeInstanceOf(SyntaxError); // Check original JSON error
    }
    expect(mockCreateMessage).toHaveBeenCalledTimes(2); // Called twice due to expect().rejects and try/catch
  });

  test('should throw parse error for invalid JSON without fences', async () => {
      const invalidJson = '{"invalid": true,'; // Incomplete JSON
      const rawResponse = invalidJson;
      const cleanedResponse = invalidJson;
      // Configure the mock response *for this specific test*
      mockCreateMessage.mockResolvedValue({
        content: [{ text: rawResponse, type: 'text' }],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
      });

      await expect(getLlmFeedback(prompts)).rejects.toThrow(/^Failed to parse LLM response as JSON:/);
       try {
        await getLlmFeedback(prompts);
      } catch (error) {
        expect(error.type).toBe('parse');
        expect(error.rawResponse).toBe(rawResponse);
        expect(error.cleanedResponse).toBe(cleanedResponse); // Cleaned is same as raw here
        expect(error.originalError).toBeInstanceOf(SyntaxError);
      }
      expect(mockCreateMessage).toHaveBeenCalledTimes(2);
  });

   test('should throw parse error for plain text response', async () => {
      const plainText = 'This is not JSON.';
      const rawResponse = plainText;
      const cleanedResponse = plainText;
      // Configure the mock response *for this specific test*
      mockCreateMessage.mockResolvedValue({
        content: [{ text: rawResponse, type: 'text' }],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
      });

      await expect(getLlmFeedback(prompts)).rejects.toThrow(/^Failed to parse LLM response as JSON:/);
       try {
        await getLlmFeedback(prompts);
      } catch (error) {
        expect(error.type).toBe('parse');
        expect(error.rawResponse).toBe(rawResponse);
        expect(error.cleanedResponse).toBe(cleanedResponse);
        expect(error.originalError).toBeInstanceOf(SyntaxError);
      }
      expect(mockCreateMessage).toHaveBeenCalledTimes(2);
  });
});

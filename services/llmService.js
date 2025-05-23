const RunningCost = require('../models/RunningCost');

// Module-level variable to hold the injected adapter
let configuredAdapter = null;

/**
 * Initializes the llmService with a specific LLM adapter.
 * This must be called before getLlmFeedback is used.
 * @param {object} adapter - An LLM adapter instance (e.g., OpenRouterAdapter)
 */
exports.init = (adapter) => {
  if (!adapter || typeof adapter.createMessage !== 'function') {
    throw new Error('Invalid LLM adapter provided to llmService.init');
  }
  configuredAdapter = adapter;
};

/**
 * Gets feedback from the LLM using the provided system and user prompts
 * @param {Object} prompts - Object with system and user prompts
 * @param {string} prompts.system - System prompt with instructions for the LLM
 * @param {string} prompts.user - User prompt with content to evaluate
 * @param {RunningCost} [runningCost] - Optional RunningCost tracker to update with usage data
 * @returns {Object} - Parsed JSON response with comments, hint, and proceed field
 * @throws {Error} Throws various errors if LLM communication or parsing fails
 */
exports.getLlmFeedback = async (prompts, runningCost) => {
  // Ensure the service has been initialized
  if (!configuredAdapter) {
    throw new Error('llmService has not been initialized. Call llmService.init(adapter) first.');
  }

  // Get the adapter inside the function call to ensure mocks are applied
  // const llmAdapter = LlmAdapterFactory.createAdapter(process.env.NODE_ENV === 'test'); // Remove this line
  const llmAdapter = configuredAdapter; // Use the configured adapter

  let response; // Define response here to access it in outer scope if needed

  try {
    if (!prompts || !prompts.system || !prompts.user) {
      // Keep this validation error as it's internal logic
      throw new Error('Both system and user prompts are required');
    }

    console.log('--------');
    console.log('System prompt:', prompts.system);
    console.log('User prompt:', prompts.user);
    console.log('--------');

    // Update the token usage with the current provider and model if provided
    if (runningCost) {
      // Now that we only support OpenRouter, directly use its details
      const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet'; // Default model if not set
      runningCost.setProvider('openrouter', model);
    }

    // Create message using the appropriate adapter
    // Errors from the adapter (network, API) will now propagate up
    response = await llmAdapter.createMessage({
      max_tokens: 1000,
      system: prompts.system,
      messages: [
        { role: 'user', content: prompts.user }
      ]
    });

    console.log('--------');
    console.log(response.content[0].text);
    console.log('--------');

    // Track token usage if a tracker was provided. Do this BEFORE parsing.
    if (runningCost && response.usage) {
      const actualCost = response.usage && response.usage.cost;
      runningCost.addCost(actualCost);
      // Log token usage for debugging purposes, even if not tracked for cost
      console.log(`Token usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`);
      if (actualCost) {
        console.log(`Actual cost from API: $${actualCost.toFixed(5)}`);
      }
      console.log(`Total cost so far: ${runningCost.getFormattedCost()}`);
    }

    // Parse the JSON response in a separate try/catch
    let cleanedText; // Declare outside the try block
    try {
      let rawText = response.content[0].text;
      cleanedText = rawText.trim(); // Assign value here

      // Check for markdown code fences and remove them
      if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
      } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
        // Handle case without the 'json' language identifier
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
      }

      const feedback = JSON.parse(cleanedText);
      // Ensure required fields exist
      return {
        comments: feedback.comments || 'No comments provided',
        hint: feedback.hint || 'No hint available',
        proceed: feedback.proceed || 'no'
      };
    } catch (parseError) {
      // Throw a specific error for parsing issues
      const error = new Error(`Failed to parse LLM response as JSON: ${parseError.message}`);
      error.type = 'parse'; // Add type for easier identification
      // Include both raw and cleaned text for debugging
      error.rawResponse = response.content[0].text;
      error.cleanedResponse = cleanedText; // Now accessible
      error.originalError = parseError;
      throw error;
    }

  } catch (error) {
    // Add type information if it's an adapter/network error but not already typed
    if (!(error instanceof Error && error.type)) {
      // Check if this is an API-specific error (usually has status code)
      if (error.status || error.statusCode || error.name === 'ApiError') {
        error.type = 'api';
      } else {
        // Assume network error otherwise
        error.type = 'network';
      }
    }
    // Re-throw the error (could be from validation, adapter, or parsing)
    console.error(`LLM Service Error (${error.type || 'unknown'}):`, error.message);
    throw error;
  }
};

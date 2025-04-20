const LlmAdapterFactory = require('./adapters/LlmAdapterFactory');

// Create the appropriate adapter based on environment configuration
const llmAdapter = LlmAdapterFactory.createAdapter(process.env.NODE_ENV === 'test');

/**
 * Gets feedback from the LLM using the provided system and user prompts
 * @param {Object} prompts - Object with system and user prompts
 * @param {string} prompts.system - System prompt with instructions for the LLM
 * @param {string} prompts.user - User prompt with content to evaluate
 * @param {TokenUsage} [tokenUsage] - Optional TokenUsage tracker to update with usage data
 * @returns {Object} - Parsed JSON response with comments, hint, and proceed field or error object
 */
exports.getLlmFeedback = async (prompts, tokenUsage) => {
  try {
    if (!prompts || !prompts.system || !prompts.user) {
      throw new Error('Both system and user prompts are required');
    }

    console.log('--------');
    console.log('System prompt:', prompts.system);
    console.log('User prompt:', prompts.user);
    console.log('--------');

    // Update the token usage with the current provider and model if provided
    if (tokenUsage) {
      const provider = process.env.LLM_PROVIDER || 'anthropic';
      const model = provider === 'openrouter'
        ? (process.env.OPENROUTER_MODEL || 'anthropic/claude-3-7-sonnet')
        : '';

      tokenUsage.setProvider(provider, model);
    }

    // Create message using the appropriate adapter
    const response = await llmAdapter.createMessage({
      max_tokens: 1000,
      system: prompts.system,
      messages: [
        { role: 'user', content: prompts.user }
      ]
    });

    console.log('--------');
    console.log(response.content[0].text);
    console.log('--------');

    // Track token usage if a tracker was provided
    if (tokenUsage && response.usage) {
      // For OpenRouter, also pass the actual cost if available
      const actualCost = response.usage && response.usage.cost;

      tokenUsage.addUsage(
        response.usage.input_tokens,
        response.usage.output_tokens,
        actualCost
      );

      console.log(`Token usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`);

      // Log the actual cost if it came from the API
      if (actualCost) {
        console.log(`Actual cost from API: $${actualCost.toFixed(5)}`);
      }

      console.log(`Estimated cost so far: ${tokenUsage.getFormattedCost()}`);
    }

    // Parse the JSON response
    try {
      const feedback = JSON.parse(response.content[0].text);

      // Ensure required fields exist
      return {
        comments: feedback.comments || 'No comments provided',
        hint: feedback.hint || 'No hint available',
        proceed: feedback.proceed || 'no'
      };
    } catch (parseError) {
      // Return a structured error object with the raw response
      return {
        error: {
          type: 'parse',
          message: `Failed to parse LLM response as JSON: ${parseError.message}`,
          rawResponse: response.content[0].text,
          originalError: parseError
        }
      };
    }
  } catch (error) {
    // Determine error type based on error properties
    let errorType = 'network';
    let errorDetails = {};

    // Check if this is an API-specific error (usually has status code)
    if (error.status || error.statusCode || error.name === 'ApiError') {
      errorType = 'api';
      errorDetails.status = error.status || error.statusCode;
    }

    // Return a structured error object
    return {
      error: {
        type: errorType,
        message: `LLM service error: ${error.message}`,
        ...errorDetails,
        originalError: error
      }
    };
  }
};

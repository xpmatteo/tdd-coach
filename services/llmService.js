const LlmAdapterFactory = require('./adapters/LlmAdapterFactory');

// Create the appropriate adapter based on environment configuration
const llmAdapter = LlmAdapterFactory.createAdapter();

/**
 * Gets feedback from the LLM using the provided system and user prompts
 * @param {Object} prompts - Object with system and user prompts
 * @param {string} prompts.system - System prompt with instructions for the LLM
 * @param {string} prompts.user - User prompt with content to evaluate
 * @param {TokenUsage} [tokenUsage] - Optional TokenUsage tracker to update with usage data
 * @returns {Object} - Parsed JSON response with comments, hint, and proceed field
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
    if (tokenUsage) {
      tokenUsage.addUsage(
        response.usage.input_tokens,
        response.usage.output_tokens
      );
      console.log(`Token usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`);
      console.log(`Estimated cost so far: ${tokenUsage.getFormattedCost()}`);
    }

    // Parse the JSON response
    const feedback = JSON.parse(response.content[0].text);

    // Ensure required fields exist
    return {
      comments: feedback.comments || 'No comments provided',
      hint: feedback.hint || 'No hint available',
      proceed: feedback.proceed || 'no'
    };
  } catch (error) {
    console.error('Error in LLM service:', error);
    throw new Error(`Failed to get LLM feedback: ${error.message}`);
  }
};

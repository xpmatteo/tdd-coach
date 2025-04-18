const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHEAP_MODEL = 'claude-3-5-haiku-20241022';
const BEST_MODEL = 'claude-3-7-sonnet-latest';

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
    
    const response = await client.messages.create({
      model: BEST_MODEL,
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

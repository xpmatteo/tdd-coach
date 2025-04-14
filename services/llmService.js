const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Gets feedback from the LLM using the provided prompt
 * @param {string} prompt - The fully formatted prompt to send
 * @param {TokenUsage} [tokenUsage] - Optional TokenUsage tracker to update with usage data
 * @returns {Object} - Parsed JSON response with comments, hint, and proceed field
 */
exports.getLlmFeedback = async (prompt, tokenUsage) => {
  try {
    console.log('--------');
    console.log('Prompt:', prompt);
    console.log('--------');
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
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
    throw new Error('Failed to get LLM feedback');
  }
};

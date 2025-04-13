const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Gets feedback from the LLM using the provided prompt
 * @param {string} prompt - The fully formatted prompt to send
 * @returns {Object} - Parsed JSON response with comments, hint, and proceed field
 */
exports.getLlmFeedback = async (prompt) => {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
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
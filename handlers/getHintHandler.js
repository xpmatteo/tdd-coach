/**
 * Creates a getHint handler with injected dependencies
 * @param {Object} sessionManager - The session manager dependency
 * @param {Object} promptService - The prompt service dependency
 * @param {Object} llmService - The LLM service dependency
 * @returns {Function} The getHint handler function
 */
function createGetHintHandler(sessionManager, promptService, llmService) {
  return async function getHint(req, res) {
    const { sessionId, mockMode } = req.body;
    const session = sessionManager.findSession(sessionId);

    if (!session) {
      return res.status(404).send('Session not found');
    }

    // Get appropriate prompts for hint
    const prompts = promptService.getPrompts(session, true); // Pass true for hint=true

    // Check if mock mode is enabled
    if (mockMode === 'on') {
      const mockHint = "Mock hint: Provide a suggestion to improve the code.";
      return res.json({ hint: mockHint });
    }

    try {
      // Get LLM feedback, but we only care about the hint
      const feedback = await llmService.getLlmFeedback(prompts, session.runningCost);
      
      // Return only the hint
      return res.json({ hint: feedback.hint });

    } catch (error) {
      // Handle errors from getLlmFeedback
      console.error(`Error getting hint for session ${sessionId}:`, error);
      
      // Determine error type and details (similar to submitCode)
      const errorType = error.type || 'system';
      const errorMessage = error.message || 'An unexpected error occurred while getting the hint.';
      const errorDetails = error.originalError ? `${error.originalError.constructor.name}: ${error.originalError.message}` : (error.stack || 'No details available');

      const errorResponse = {
        error: {
          type: errorType,
          message: errorMessage,
          details: errorDetails
        }
      };
      
      if (errorType === 'parse' && error.rawResponse) {
        errorResponse.error.rawResponse = error.rawResponse;
      }
      if (errorType === 'api' && (error.status || error.statusCode)) {
        errorResponse.error.status = error.status || error.statusCode;
      }
      
      return res.status(500).json({
        error: {
          type: 'system', // Keep outer type as system
          message: 'Failed to get hint',
          details: errorResponse.error // Embed details
        }
      });
    }
  };
}

module.exports = createGetHintHandler;
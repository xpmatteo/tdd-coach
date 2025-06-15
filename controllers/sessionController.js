const { getPrompts } = require('../services/promptService');
const { getLlmFeedback } = require('../services/llmService');
const { executeCode } = require('../services/codeExecutionService');
const Session = require('../models/Session');
const SessionPersistenceService = require('../services/sessionPersistenceService');
const katas = require('../models/katas');

// Store active sessions in memory (with persistence backing)
const sessions = new Map();
const persistenceService = new SessionPersistenceService();

// Export sessions map for testing
exports.sessions = sessions;


// Helper function to prepare session view data
const getSessionViewData = (sessionId, session, feedback = null, proceed = null) => {
  // Check if there's a previous LLM interaction
  const lastInteraction = session.getLastLlmInteraction();

  // Use last interaction feedback if available and no new feedback provided
  if (!feedback && lastInteraction && lastInteraction.llmResponse) {
    feedback = lastInteraction.llmResponse.comments;
    proceed = lastInteraction.llmResponse.proceed;
  }

  // Get code execution results if available
  const executionResults = session.getCodeExecutionResults();

  return {
    sessionId,
    state: session.state,
    stateDescription: session.getStateDescription(),
    testCases: session.testCases,
    productionCode: session.productionCode,
    testCode: session.testCode,
    feedback: feedback || session.feedback || "Welcome to the FizzBuzz kata! Let's get started with TDD.",
    selectedTestIndex: session.selectedTestIndex,
    proceed: proceed,
    runningCost: session.runningCost.getStats(),
    isProductionCodeEditorEnabled: session.state == 'GREEN' || session.state == 'REFACTOR',
    isTestCodeEditorEnabled: session.state == 'RED' || session.state == 'REFACTOR',
    mockModeEnabled: lastInteraction && lastInteraction.mockModeEnabled,
    // Include code execution results if available
    codeExecutionResults: executionResults,
    hasCodeExecutionResults: !!executionResults
  };
};



exports.getHint = async (req, res) => {
  const { sessionId, mockMode } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).send('Session not found');
  }

  // Get appropriate prompts for hint
  const prompts = getPrompts(session, true); // Pass true for hint=true

  // Check if mock mode is enabled
  if (mockMode === 'on') {
    const mockHint = "Mock hint: Provide a suggestion to improve the code.";
    return res.json({ hint: mockHint });
  }

  try {
    // Get LLM feedback, but we only care about the hint
    const feedback = await getLlmFeedback(prompts, session.runningCost);
    
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

exports.restartSession = async (req, res) => {
  const { sessionId } = req.body;

  // Get the FizzBuzz kata object
  const fizzbuzzKata = katas['fizzbuzz'];
  if (!fizzbuzzKata) {
    return res.status(500).send('FizzBuzz kata not found');
  }

  // Create a fresh session
  const oldSession = sessions.get(sessionId);
  const newSession = new Session(fizzbuzzKata);
  if (oldSession) {
    newSession.runningCost = oldSession.runningCost; // Keep the same running cost tracker
  }
  sessions.set(sessionId, newSession);

  // Save restarted session
  try {
    await persistenceService.saveSession(sessionId, newSession.toJSON());
  } catch (error) {
    console.error(`Error saving restarted session ${sessionId}:`, error);
    // Continue without persistence - don't fail session restart
  }

  const viewData = getSessionViewData(sessionId, newSession, "Session restarted. Let's begin again!", null);
  res.render('session', viewData);
};

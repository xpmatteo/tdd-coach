const { getPrompts } = require('../services/promptService');
const { getLlmFeedback } = require('../services/llmService');
const { executeCode } = require('../services/codeExecutionService');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');
const katas = require('../models/katas');

// Store active sessions in memory (replace with proper storage in production)
const sessions = new Map();

// Export sessions map for testing
exports.sessions = sessions;

exports.newSession = (req, res) => {
  // Get the FizzBuzz kata object
  const fizzbuzzKata = katas['fizzbuzz'];
  if (!fizzbuzzKata) {
    return res.status(404).send('FizzBuzz kata not found');
  }

  // Create a new session with the FizzBuzz kata object
  const sessionId = uuidv4();
  const session = new Session(fizzbuzzKata);
  sessions.set(sessionId, session);

  // Redirect to the session URL with ID
  res.redirect(`/session/${sessionId}`);
};

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

exports.getSession = (req, res) => {
  const sessionId = req.params.id;
  const session = sessions.get(sessionId);

  if (!session) {
    // Session not found, redirect to create a new one
    return res.redirect('/session/new');
  }

  const viewData = getSessionViewData(sessionId, session);
  res.render('session', viewData);
};

exports.submitCode = async (req, res) => {
  const { sessionId, productionCode, testCode, selectedTestIndex, mockMode } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).send('Session not found');
  }

  // Update session with latest code
  session.productionCode = productionCode;
  session.testCode = testCode;

  // Store the selected test index if in PICK state
  if (session.state === 'PICK' && selectedTestIndex !== undefined) {
    session.selectedTestIndex = selectedTestIndex;
  }

  // Execute the code and store results (except in PICK state where there's no code to execute)
  if (session.state !== 'PICK') {
    try {
      const executionResults = executeCode(productionCode, testCode);
      session.setCodeExecutionResults(executionResults);
    } catch (error) {
      session.setCodeExecutionResults({
        success: false,
        error: `Error executing code: ${error.message}`,
        testResults: [],
        console: ''
      });
    }
  }

  // Get appropriate prompts for current state
  const prompts = getPrompts(session);

  // Check if mock mode is enabled
  if (mockMode === 'on') {
    // Mock Mode: Simulate success without calling LLM
    const feedback = {
      comments: `Mock mode is enabled. Automatically approving your ${session.state} state submission.`,
      hint: "This is a mock hint. Mock mode is enabled, so no real feedback is provided.",
      proceed: 'yes'
    };

    // Capture interaction (mock)
    session.captureLastLlmInteraction({
      state: session.state,
      productionCode: session.productionCode,
      testCode: session.testCode,
      testCases: session.testCases,
      selectedTestIndex: session.selectedTestIndex,
      currentTestIndex: session.currentTestIndex,
      codeExecutionResults: session.getCodeExecutionResults(),
      llmResponse: feedback,
      mockModeEnabled: true
    });

    // Process and advance state
    if (session.processSubmission(feedback) && feedback.proceed === 'yes') {
      session.advanceState();
    }

    // Render updated view
    const viewData = getSessionViewData(sessionId, session, feedback.comments, feedback.proceed);
    return res.render('session', viewData); // Return here to avoid executing the try/catch below
  }

  // Normal Mode: Call LLM and handle potential errors
  try {
    // Get LLM feedback with token tracking
    const feedback = await getLlmFeedback(prompts, session.runningCost);
    
    // Always capture the last LLM interaction, regardless of capture mode
    const interactionData = {
      state: session.state,
      productionCode: session.productionCode,
      testCode: session.testCode,
      testCases: session.testCases,
      selectedTestIndex: session.selectedTestIndex,
      currentTestIndex: session.currentTestIndex,
      codeExecutionResults: session.getCodeExecutionResults(),
      llmResponse: feedback,
      mockModeEnabled: false // Since we are not in mock mode here
    };

    session.captureLastLlmInteraction(interactionData);


    // Process feedback and update session state if needed
    if (session.processSubmission(feedback) && feedback.proceed === 'yes') {
      session.advanceState();
    }

    // Render updated view
    const viewData = getSessionViewData(sessionId, session, feedback.comments, feedback.proceed);
    res.render('session', viewData);
  } catch (error) {
    // Handle errors from getLlmFeedback (network, API, parse, validation)
    console.error(`Error processing submission for session ${sessionId}:`, error);

    // Determine error type and details
    const errorType = error.type || 'system'; // Default to system if type is missing
    const errorMessage = error.message || 'An unexpected error occurred.';
    const errorDetails = error.originalError ? `${error.originalError.constructor.name}: ${error.originalError.message}` : (error.stack || 'No details available');

    // Prepare a client-friendly error response
    const errorResponse = {
      error: {
        type: errorType,
        message: errorMessage,
        details: errorDetails
      }
    };

    // Add specific details based on type
    if (errorType === 'parse' && error.rawResponse) {
      errorResponse.error.rawResponse = error.rawResponse;
    }
    if (errorType === 'api' && (error.status || error.statusCode)) {
      errorResponse.error.status = error.status || error.statusCode;
    }

    return res.status(500).json({
      error: {
        type: 'system', // Keep outer type as system for client handling
        message: 'Error processing your submission', // Generic message for client
        details: errorResponse.error // Embed the detailed error info
      }
    });
  }
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

exports.restartSession = (req, res) => {
  const { sessionId } = req.body;

  // Get the FizzBuzz kata object
  const fizzbuzzKata = katas['fizzbuzz'];
  if (!fizzbuzzKata) {
    return res.status(500).send('FizzBuzz kata not found');
  }

  // Create a fresh session
  const oldSession = sessions.get(sessionId);
  const newSession = new Session(fizzbuzzKata);
  newSession.tokenUsage = oldSession.tokenUsage; // Keep the same token usage tracker
  sessions.set(sessionId, newSession);

  const viewData = getSessionViewData(sessionId, newSession, "Session restarted. Let's begin again!", null);
  res.render('session', viewData);
};

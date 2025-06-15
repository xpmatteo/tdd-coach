/**
 * Creates a submitCode handler with injected dependencies
 * @param {Object} sessionManager - The session manager dependency
 * @param {Object} codeExecutor - The code execution service dependency
 * @param {Object} promptService - The prompt service dependency
 * @param {Object} llmService - The LLM service dependency
 * @param {Object} viewDataBuilder - The view data builder dependency
 * @returns {Function} The submitCode handler function
 */
function createSubmitCodeHandler(sessionManager, codeExecutor, promptService, llmService, viewDataBuilder) {
  return async function submitCode(req, res) {
    const { sessionId, productionCode, testCode, selectedTestIndex, mockMode } = req.body;
    const session = sessionManager.findSession(sessionId);

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
        const executionResults = codeExecutor.executeCode(productionCode, testCode);
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
    const prompts = promptService.getPrompts(session);

    // Check if mock mode is enabled
    if (mockMode === 'on') {
      // Mock Mode: Simulate success without calling LLM
      const feedback = {
        comments: `Mock mode is enabled. Automatically approving your ${session.state} state submission.`,
        hint: "This is a mock hint. Mock mode is enabled, so no real feedback is provided.",
        proceed: 'yes'
      };
      
      // Add kata-complete field for PICK state in mock mode
      if (session.state === 'PICK') {
        feedback['kata-complete'] = 'no'; // Default to no completion in mock mode
      }

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
        
        // Auto-save after state change
        try {
          await sessionManager.saveSession(sessionId, session);
        } catch (error) {
          console.error(`Error saving session ${sessionId} after state change:`, error);
          // Continue without failing the request
        }
      }

      // Render updated view
      const viewData = viewDataBuilder.getSessionViewData(sessionId, session, feedback.comments, feedback.proceed);
      return res.render('session', viewData);
    }

    // Normal Mode: Call LLM and handle potential errors
    try {
      // Get LLM feedback with token tracking
      const feedback = await llmService.getLlmFeedback(prompts, session.runningCost);
      
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
        
        // Auto-save after state change
        try {
          await sessionManager.saveSession(sessionId, session);
        } catch (error) {
          console.error(`Error saving session ${sessionId} after state change:`, error);
          // Continue without failing the request
        }
      }

      // Render updated view
      const viewData = viewDataBuilder.getSessionViewData(sessionId, session, feedback.comments, feedback.proceed);
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
}

module.exports = createSubmitCodeHandler;
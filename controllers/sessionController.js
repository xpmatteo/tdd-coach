const { getPrompt } = require('../services/promptService');
const { getLlmFeedback } = require('../services/llmService');
const Session = require('../models/Session');
const testCaptureManager = require('../models/testCapture/TestCaptureManager');
const { v4: uuidv4 } = require('uuid');

// Store active sessions in memory (replace with proper storage in production)
const sessions = new Map();

// Export sessions map for test capture controller
exports.sessions = sessions;

exports.newSession = (req, res) => {
  // Create a new session for FizzBuzz kata
  const sessionId = uuidv4();
  const session = new Session('fizzbuzz');
  sessions.set(sessionId, session);
  
  // Redirect to the session URL with ID
  res.redirect(`/session/${sessionId}`);
};

exports.getSession = (req, res) => {
  const sessionId = req.params.id;
  const session = sessions.get(sessionId);
  
  if (!session) {
    // Session not found, redirect to create a new one
    return res.redirect('/session/new');
  }
  
  res.render('session', {
    sessionId,
    state: session.state,
    stateDescription: session.getStateDescription(),
    testCases: session.testCases,
    productionCode: session.productionCode,
    testCode: session.testCode,
    feedback: session.feedback || "Welcome to the FizzBuzz kata! Let's get started with TDD.",
    selectedTestIndex: null,
    proceed: null, // No proceed value for initial welcome message
    tokenUsage: session.tokenUsage.getStats(),
    isPromptCaptureModeEnabled: testCaptureManager.isPromptCaptureModeEnabled()
  });
};

exports.submitCode = async (req, res) => {
  const { sessionId, productionCode, testCode, selectedTestIndex } = req.body;
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
  
  // Get appropriate prompt for current state
  const prompt = getPrompt(session);
  
  try {
    // Get LLM feedback with token tracking
    const feedback = await getLlmFeedback(prompt, session.tokenUsage);
    
    // Capture interaction if test capture mode is enabled
    if (testCaptureManager.isPromptCaptureModeEnabled()) {
      session.captureInteraction({
        state: session.state,
        productionCode: session.productionCode,
        testCode: session.testCode,
        testCases: session.testCases,
        selectedTestIndex: session.selectedTestIndex,
        currentTestIndex: session.currentTestIndex,
        llmResponse: feedback
      });
    }
    
    // Process feedback and update session state if needed
    if (session.processSubmission(feedback) && feedback.proceed === 'yes') {
      session.advanceState();
    }
    
    // Render updated view
    res.render('session', {
      sessionId,
      state: session.state,
      stateDescription: session.getStateDescription(),
      testCases: session.testCases,
      productionCode: session.productionCode,
      testCode: session.testCode,
      feedback: feedback.comments,
      selectedTestIndex: session.selectedTestIndex,
      proceed: feedback.proceed, // Pass proceed value to the view
      tokenUsage: session.tokenUsage.getStats(),
      isPromptCaptureModeEnabled: testCaptureManager.isPromptCaptureModeEnabled()
    });
  } catch (error) {
    console.error('Error getting LLM feedback:', error);
    res.status(500).send('Error processing your submission');
  }
};

exports.getHint = async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).send('Session not found');
  }
  
  // Get appropriate prompt for current state
  const prompt = getPrompt(session);
  
  try {
    // Get LLM hint with token tracking
    const feedback = await getLlmFeedback(prompt, session.tokenUsage);
    
    // Return the hint and the proceed value for styling
    res.json({ 
      hint: feedback.hint,
      proceed: feedback.proceed 
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).send('Error getting hint');
  }
};

exports.restartSession = (req, res) => {
  const { sessionId } = req.body;
  
  // Create a fresh session
  const oldSession = sessions.get(sessionId);
  const newSession = new Session('fizzbuzz');
  newSession.tokenUsage = oldSession.tokenUsage; // Keep the same token usage tracker
  sessions.set(sessionId, newSession);
  
  res.render('session', {
    sessionId,
    state: newSession.state,
    stateDescription: newSession.getStateDescription(),
    testCases: newSession.testCases,
    productionCode: newSession.productionCode,
    testCode: newSession.testCode,
    feedback: "Session restarted. Let's begin again!",
    selectedTestIndex: null,
    proceed: null, // No proceed value for restart message
    tokenUsage: newSession.tokenUsage.getStats(),
    isPromptCaptureModeEnabled: testCaptureManager.isPromptCaptureModeEnabled()
  });
};
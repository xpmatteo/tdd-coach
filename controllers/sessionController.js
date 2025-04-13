const { getPrompt } = require('../services/promptService');
const { getLlmFeedback } = require('../services/llmService');
const Session = require('../models/Session');

// Store active sessions in memory (replace with proper storage in production)
const sessions = new Map();

exports.newSession = (req, res) => {
  // Create a new session for FizzBuzz kata
  const sessionId = Date.now().toString();
  const session = new Session('fizzbuzz');
  sessions.set(sessionId, session);
  
  res.render('session', {
    sessionId,
    state: session.state,
    testCases: session.testCases,
    productionCode: session.productionCode,
    testCode: session.testCode,
    feedback: "Welcome to the FizzBuzz kata! Let's get started with TDD."
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
  
  // If in PICK state and a test case was selected, mark it as in progress
  if (session.state === 'PICK' && selectedTestIndex !== undefined) {
    try {
      session.selectTestCase(parseInt(selectedTestIndex, 10));
    } catch (error) {
      return res.status(400).send(error.message);
    }
  }
  
  // Get appropriate prompt for current state
  const prompt = getPrompt(session);
  
  try {
    // Get LLM feedback
    const feedback = await getLlmFeedback(prompt);
    
    // Process feedback and update session state if needed
    if (feedback.proceed === 'yes') {
      session.advanceState();
    }
    
    // Render updated view
    res.render('session', {
      sessionId,
      state: session.state,
      testCases: session.testCases,
      productionCode: session.productionCode,
      testCode: session.testCode,
      feedback: feedback.comments
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
    // Get LLM hint
    const feedback = await getLlmFeedback(prompt);
    
    // Return just the hint
    res.json({ hint: feedback.hint });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).send('Error getting hint');
  }
};

exports.restartSession = (req, res) => {
  const { sessionId } = req.body;
  
  // Create a fresh session
  const session = new Session('fizzbuzz');
  sessions.set(sessionId, session);
  
  res.render('session', {
    sessionId,
    state: session.state,
    testCases: session.testCases,
    productionCode: session.productionCode,
    testCode: session.testCode,
    feedback: "Session restarted. Let's begin again!"
  });
};
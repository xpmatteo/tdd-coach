const testCaptureManager = require('../models/testCapture/TestCaptureManager');

// Access sessions map from the sessionController
const sessions = require('../controllers/sessionController').sessions || new Map();

/**
 * Display the list of captured test cases
 */
exports.listTestCases = async (req, res) => {
  try {
    const testCases = await testCaptureManager.getTestCases();
    
    res.render('testCases/list', {
      title: 'Prompt Tests - List',
      testCases,
      isTestingModeEnabled: testCaptureManager.isTestingModeEnabled()
    });
  } catch (error) {
    console.error('Error listing test cases:', error);
    res.status(500).send('Error loading prompt tests');
  }
};

/**
 * Display details of a specific test case
 */
exports.viewTestCase = async (req, res) => {
  try {
    const { filename } = req.params;
    const testCase = await testCaptureManager.getTestCase(filename);
    
    res.render('testCases/view', {
      title: 'Prompt Test Details',
      testCase,
      filename,
      isTestingModeEnabled: testCaptureManager.isTestingModeEnabled()
    });
  } catch (error) {
    console.error('Error viewing test case:', error);
    res.status(404).send('Prompt test not found or could not be loaded');
  }
};

/**
 * Show the form to save a captured interaction as a test case
 */
exports.showSaveForm = (req, res) => {
  try {
    const { sessionId } = req.query;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).send('Session not found');
    }
    
    const currentCapture = session.getCurrentCapture();
    
    if (!currentCapture) {
      return res.redirect('/prompt-tests');
    }
    
    res.render('testCases/save', {
      title: 'Save as Prompt Test',
      capture: currentCapture,
      sessionId,
      isTestingModeEnabled: testCaptureManager.isTestingModeEnabled()
    });
  } catch (error) {
    console.error('Error showing save form:', error);
    res.status(500).send('Error preparing save form');
  }
};

/**
 * Save the captured interaction as a test case
 */
exports.saveTestCase = async (req, res) => {
  try {
    const { name, sessionId } = req.body;
    
    if (!name) {
      return res.status(400).send('Test case name is required');
    }
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).send('Session not found');
    }
    
    const filename = await testCaptureManager.saveTestCase(session, name);
    
    res.redirect(`/prompt-tests/${filename}`);
  } catch (error) {
    console.error('Error saving test case:', error);
    res.status(500).send('Error saving prompt test');
  }
};

/**
 * Delete a test case
 */
exports.deleteTestCase = async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await testCaptureManager.deleteTestCase(filename);
    
    if (result) {
      res.redirect('/prompt-tests');
    } else {
      res.status(500).send('Failed to delete prompt test');
    }
  } catch (error) {
    console.error('Error deleting test case:', error);
    res.status(500).send('Error deleting prompt test');
  }
};

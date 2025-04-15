const testCaptureManager = require('../models/testCapture/TestCaptureManager');

/**
 * Display the list of captured test cases
 */
exports.listTestCases = async (req, res) => {
  try {
    const testCases = await testCaptureManager.getTestCases();
    
    res.render('testCases/list', {
      title: 'Prompt Tests - List',
      testCases,
      isTestingModeEnabled: testCaptureManager.isTestingModeEnabled(),
      currentCapture: testCaptureManager.getCurrentCapture()
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
  const currentCapture = testCaptureManager.getCurrentCapture();
  
  if (!currentCapture) {
    return res.redirect('/prompt-tests');
  }
  
  res.render('testCases/save', {
    title: 'Save as Prompt Test',
    capture: currentCapture,
    isTestingModeEnabled: testCaptureManager.isTestingModeEnabled()
  });
};

/**
 * Save the captured interaction as a test case
 */
exports.saveTestCase = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).send('Test case name is required');
    }
    
    const filename = await testCaptureManager.saveTestCase(name);
    
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

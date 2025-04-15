const katas = require('./katas');
const PickState = require('./states/PickState');
const TokenUsage = require('./TokenUsage');

class Session {
  /**
   * Create a new TDD session
   * @param {string} kataName - The name of the kata to use
   */
  constructor(kataName) {
    const kata = katas[kataName];
    if (!kata) {
      throw new Error(`Kata ${kataName} not found`);
    }

    this.kataName = kataName;
    this.testCases = structuredClone(kata.testCases); // Deep copy test cases
    this.productionCode = kata.initialProductionCode || '';
    this.testCode = kata.initialTestCode || '';
    this.currentTestIndex = null;
    this.selectedTestIndex = null;
    this.capturedInteraction = null;

    // Initialize with PICK state
    this.setCurrentState(new PickState(this));
    
    // Initialize token usage tracking
    this.tokenUsage = new TokenUsage();
  }

  /**
   * Capture an interaction for potential test case creation
   * @param {Object} interactionData - Data to capture
   */
  captureInteraction(interactionData) {
    if (process.env.PROMPT_CAPTURE_MODE !== 'true') return;
    
    this.capturedInteraction = {
      ...interactionData,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
  }
  
  /**
   * Get the currently captured interaction
   * @returns {Object|null} - The captured interaction or null
   */
  getCurrentCapture() {
    return this.capturedInteraction;
  }
  
  /**
   * Clear the captured interaction
   */
  clearCapturedInteraction() {
    this.capturedInteraction = null;
  }

  /**
   * Set the current state of the session
   * @param {State} state - The new state object
   * @returns {string} The name of the new state
   */
  setCurrentState(state) {
    if (this.currentState) {
      this.currentState.onExit();
    }

    this.currentState = state;
    this.state = state.getName(); // Keep for backward compatibility

    this.currentState.onEnter();
    return this.state;
  }

  /**
   * Advance to the next state in the TDD cycle
   * @returns {string} The name of the new state
   */
  advanceState() {
    const nextState = this.currentState.getNextState();
    return this.setCurrentState(nextState);
  }

  /**
   * Check if test case selection is allowed in the current state
   * @returns {boolean} True if test case selection is allowed
   */
  canSelectTestCase() {
    return this.currentState.canSelectTestCase();
  }

  /**
   * Select a test case to work on
   * @param {number} index - Index of the test case to select
   */
  selectTestCase(index) {
    if (!this.canSelectTestCase()) {
      throw new Error(`Cannot select test case in ${this.state} state`);
    }

    if (index < 0 || index >= this.testCases.length) {
      throw new Error('Invalid test case index');
    }

    if (this.testCases[index].status !== 'TODO') {
      throw new Error(`Test case not in TODO state: ${this.testCases[index].status}`);
    }

    this.currentTestIndex = index;
    this.testCases[index].status = 'IN_PROGRESS';
  }

  /**
   * Process LLM feedback for the current state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    return this.currentState.processSubmission(feedback);
  }
  
  /**
   * Get the description of the current state's task
   * @returns {string} The description of the current state
   */
  getStateDescription() {
    return this.currentState.getDescription();
  }
}

module.exports = Session;

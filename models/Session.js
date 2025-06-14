const katas = require('./katas');
const PickState = require('./states/PickState');
const RunningCost = require('./RunningCost');

/**
 * Represents a TDD session with improved encapsulation
 */
class Session {
  // Private fields
  #kataName;
  #testCases;
  #productionCode;
  #testCode;
  #currentTestIndex;
  #selectedTestIndex;
  #lastLlmInteraction;
  #currentState;
  #runningCost;
  #codeExecutionResults;

  /**
   * Create a new TDD session
   * @param {Object} kata - The kata object to use
   */
  constructor(kata) {
    if (!kata) {
      throw new Error('Kata object is required');
    }

    // Initialize private fields
    this.#kataName = kata.name;
    this.#testCases = structuredClone(kata.testCases); // Deep copy test cases
    this.#productionCode = kata.initialProductionCode || '';
    this.#testCode = kata.initialTestCode || '';
    this.#currentTestIndex = null;
    this.#selectedTestIndex = null;
    this.#lastLlmInteraction = null;
    this.#codeExecutionResults = null;

    // Initialize cost tracking
    this.#runningCost = new RunningCost();

    // Initialize with PICK state
    this.#currentState = new PickState(this);
    this.#currentState.onEnter();
  }

  /**
   * Get the name of the kata
   * @returns {string} Kata name
   */
  getKataName() {
    return this.#kataName;
  }

  /**
   * Get a copy of the test cases
   * @returns {Array} Copy of test cases
   */
  getTestCases() {
    return structuredClone(this.#testCases);
  }

  /**
   * Get the production code
   * @returns {string} Production code
   */
  getProductionCode() {
    return this.#productionCode;
  }

  /**
   * Set the production code
   * @param {string} code - New production code
   */
  setProductionCode(code) {
    this.#productionCode = code;
  }

  /**
   * Get the test code
   * @returns {string} Test code
   */
  getTestCode() {
    return this.#testCode;
  }

  /**
   * Set the test code
   * @param {string} code - New test code
   */
  setTestCode(code) {
    this.#testCode = code;
  }

  /**
   * Get the current state name
   * @returns {string} Current state name
   */
  getState() {
    return this.#currentState.getName();
  }

  /**
   * Get the current test index
   * @returns {number|null} Current test index
   */
  getCurrentTestIndex() {
    return this.#currentTestIndex;
  }

  /**
   * Get the selected test index
   * @returns {number|null} Selected test index
   */
  getSelectedTestIndex() {
    return this.#selectedTestIndex;
  }

  /**
   * Set the selected test index (temporary selection)
   * @param {number} index - Selected test index
   */
  selectTestIndex(index) {
    this.#selectedTestIndex = index;
  }

  /**
   * Get the running cost tracker
   * @returns {RunningCost} Running cost tracker
   */
  getRunningCost() {
    return this.#runningCost;
  }

  /**
   * Get the state description
   * @returns {string} Description of the current state
   */
  getStateDescription() {
    return this.#currentState.getDescription();
  }

  /**
   * Get the code execution results
   * @returns {Object|null} Code execution results
   */
  getCodeExecutionResults() {
    return this.#codeExecutionResults;
  }

  /**
   * Set the code execution results
   * @param {Object} results - Code execution results
   */
  setCodeExecutionResults(results) {
    this.#codeExecutionResults = results;
  }


  /**
   * Capture the last LLM interaction regardless of capture mode
   * @param {Object} interactionData - Data about the interaction with the LLM
   */
  captureLastLlmInteraction(interactionData) {
    this.#lastLlmInteraction = { ...interactionData };
  }

  /**
   * Get the last LLM interaction
   * @returns {Object|null} - The last LLM interaction or null if none exists
   */
  getLastLlmInteraction() {
    return this.#lastLlmInteraction;
  }


  /**
   * Set the current state of the session
   * @param {State} state - The new state object
   * @returns {string} The name of the new state
   */
  setCurrentState(state) {
    if (this.#currentState) {
      this.#currentState.onExit();
    }

    this.#currentState = state;
    this.#currentState.onEnter();
    return this.getState();
  }

  /**
   * Advance to the next state in the TDD cycle
   * @returns {string} The name of the new state
   */
  advanceState() {
    const nextState = this.#currentState.getNextState();
    return this.setCurrentState(nextState);
  }

  /**
   * Check if test case selection is allowed in the current state
   * @returns {boolean} True if test case selection is allowed
   */
  canSelectTestCase() {
    return this.#currentState.canSelectTestCase();
  }

  /**
   * Select a test case to work on
   * @param {number} index - Index of the test case to select
   */
  selectTestCase(index) {
    if (!this.canSelectTestCase()) {
      throw new Error(`Cannot select test case in ${this.getState()} state`);
    }

    if (index < 0 || index >= this.#testCases.length) {
      throw new Error('Invalid test case index');
    }

    if (this.#testCases[index].status !== 'TODO') {
      throw new Error(`Test case not in TODO state: ${this.#testCases[index].status}`);
    }

    this.#currentTestIndex = index;
    this.#testCases[index].status = 'IN_PROGRESS';
  }

  /**
   * Process LLM feedback for the current state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    return this.#currentState.processSubmission(feedback);
  }

  markCurrentTestAsDone() {
    if (this.#currentTestIndex !== null) {
      this.#testCases[this.currentTestIndex].status = 'DONE';
      this.#currentTestIndex = null;
    }
  }

  /**
   * Get test case by index
   * @param {number} index - Index of the test case
   * @returns {Object} Test case
   */
  getTestCase(index) {
    if (index < 0 || index >= this.#testCases.length) {
      throw new Error('Invalid test case index');
    }

    return structuredClone(this.#testCases[index]);
  }

  // Compatibility properties for backward compatibility
  // These will ease the transition to the fully encapsulated version

  get kataName() {
    return this.#kataName;
  }

  get testCases() {
    return this.#testCases;
  }

  get productionCode() {
    return this.#productionCode;
  }

  set productionCode(code) {
    this.#productionCode = code;
  }

  get testCode() {
    return this.#testCode;
  }

  set testCode(code) {
    this.#testCode = code;
  }

  get currentTestIndex() {
    return this.#currentTestIndex;
  }

  get selectedTestIndex() {
    return this.#selectedTestIndex;
  }

  set selectedTestIndex(index) {
    this.#selectedTestIndex = index;
  }

  get runningCost() {
    return this.#runningCost;
  }

  get state() {
    return this.getState();
  }

  get currentState() {
    return this.#currentState;
  }

  /**
   * Serialize session to JSON-compatible object
   * @returns {Object} Serializable session data
   */
  toJSON() {
    return {
      kataName: this.#kataName,
      testCases: this.#testCases,
      productionCode: this.#productionCode,
      testCode: this.#testCode,
      currentTestIndex: this.#currentTestIndex,
      selectedTestIndex: this.#selectedTestIndex,
      lastLlmInteraction: this.#lastLlmInteraction,
      currentState: this.#currentState.getName(),
      runningCost: this.#runningCost.toJSON(),
      codeExecutionResults: this.#codeExecutionResults
    };
  }

  /**
   * Create session from serialized data
   * @param {Object} data - Serialized session data
   * @returns {Session} Restored session instance
   */
  static fromJSON(data) {
    const katas = require('./katas');
    const PickState = require('./states/PickState');
    const RedState = require('./states/RedState');
    const GreenState = require('./states/GreenState');
    const RefactorState = require('./states/RefactorState');
    const CompleteState = require('./states/CompleteState');
    
    // Find the kata by name (katas is an object, not array)
    const kata = Object.values(katas).find(k => k.name === data.kataName);
    if (!kata) {
      throw new Error(`Kata not found: ${data.kataName}`);
    }
    
    // Create a new session but replace the initial data
    const session = new Session(kata);
    
    // Restore private fields
    session.#testCases = data.testCases;
    session.#productionCode = data.productionCode;
    session.#testCode = data.testCode;
    session.#currentTestIndex = data.currentTestIndex;
    session.#selectedTestIndex = data.selectedTestIndex;
    session.#lastLlmInteraction = data.lastLlmInteraction;
    session.#codeExecutionResults = data.codeExecutionResults;
    
    // Restore running cost
    session.#runningCost = RunningCost.fromJSON(data.runningCost);
    
    // Restore state
    const stateMap = {
      'PICK': PickState,
      'RED': RedState,
      'GREEN': GreenState,
      'REFACTOR': RefactorState,
      'COMPLETE': CompleteState
    };
    
    const StateClass = stateMap[data.currentState];
    if (!StateClass) {
      throw new Error(`Unknown state: ${data.currentState}`);
    }
    
    session.#currentState = new StateClass(session);
    
    return session;
  }
}

module.exports = Session;

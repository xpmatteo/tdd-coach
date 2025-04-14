const State = require('./State');

/**
 * Represents the COMPLETE state in the TDD cycle
 * This is the final state when all test cases are complete
 */
class CompleteState extends State {
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() { 
    return 'COMPLETE'; 
  }
  
  /**
   * Get the next state in the TDD cycle
   * @returns {State} Returns itself as there is no next state
   */
  getNextState() {
    return this; // No next state
  }
  
  /**
   * Whether this state allows selecting a test case
   * @returns {boolean} False as no test case selection is allowed
   */
  canSelectTestCase() { 
    return false; 
  }
  
  /**
   * Process LLM feedback for the COMPLETE state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Always false as we can't advance beyond this state
   */
  processSubmission(feedback) {
    return false;
  }
}

module.exports = CompleteState;
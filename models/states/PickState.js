const State = require('./State');

/**
 * Represents the PICK state in the TDD cycle
 * In this state, the user selects the next test case to implement
 */
class PickState extends State {
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() { 
    return 'PICK'; 
  }
  
  /**
   * Whether this state allows selecting a test case
   * @returns {boolean} True if test case selection is allowed
   */
  canSelectTestCase() { 
    return true; 
  }
  
  /**
   * Get the next state in the TDD cycle
   * @returns {State} The next state object (RED)
   */
  getNextState() {
    const RedState = require('./RedState');
    return new RedState(this.session);
  }
  
  /**
   * Get the description of the task for this state
   * @returns {string} The task description
   */
  getDescription() {
    return "Your task: choose the next test case";
  }
  
  /**
   * Process LLM feedback for the PICK state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    // Check if kata is complete
    if (feedback['kata-complete'] === 'yes') {
      const CompleteState = require('./CompleteState');
      this.session.state = new CompleteState(this.session);
      return true;
    }
    
    if (feedback.proceed === 'yes' && this.session.selectedTestIndex !== null) {
      try {
        this.session.selectTestCase(parseInt(this.session.selectedTestIndex, 10));
        this.session.selectedTestIndex = null;
        return true;
      } catch (error) {
        console.error('Error selecting test case:', error.message);
        return false;
      }
    }
    return false;
  }
}

module.exports = PickState;
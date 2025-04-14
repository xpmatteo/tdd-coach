/**
 * Base class for all TDD states
 */
class State {
  /**
   * Create a new state
   * @param {Object} session - The session this state belongs to
   */
  constructor(session) {
    this.session = session;
  }
  
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() { 
    throw new Error('getName() must be implemented by subclasses'); 
  }
  
  /**
   * Called when entering this state
   */
  onEnter() { 
    // Default empty implementation 
  }
  
  /**
   * Called when exiting this state
   */
  onExit() { 
    // Default empty implementation 
  }
  
  /**
   * Get the next state in the TDD cycle
   * @returns {State} The next state object
   */
  getNextState() { 
    throw new Error('getNextState() must be implemented by subclasses'); 
  }
  
  /**
   * Whether this state allows selecting a test case
   * @returns {boolean} True if test case selection is allowed
   */
  canSelectTestCase() { 
    return false; 
  }
  
  /**
   * Process LLM feedback for this state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) { 
    return feedback.proceed === 'yes'; 
  }
}

module.exports = State;
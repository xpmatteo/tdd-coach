const Session = require('../../models/Session');

describe('Session - Last LLM Interaction', () => {
  let session;
  let originalEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.PROMPT_CAPTURE_MODE;
    
    // Create a new session for each test
    session = new Session('fizzbuzz');
  });
  
  afterEach(() => {
    // Restore the original environment
    process.env.PROMPT_CAPTURE_MODE = originalEnv;
  });
  
  describe('captureLastLlmInteraction', () => {
    it('should store the last LLM interaction regardless of capture mode', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      const interactionData = {
        state: 'RED',
        llmResponse: { proceed: 'yes', comments: 'Great test!' }
      };
      
      // Act
      session.captureLastLlmInteraction(interactionData);
      
      // Assert
      expect(session.lastLlmInteraction).not.toBeNull();
      expect(session.lastLlmInteraction.state).toBe('RED');
      expect(session.lastLlmInteraction.llmResponse.proceed).toBe('yes');
      expect(session.lastLlmInteraction.llmResponse.comments).toBe('Great test!');
    });
    
    it('should store LLM interaction when capture mode is enabled', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const interactionData = {
        state: 'GREEN',
        llmResponse: { proceed: 'no', comments: 'Need improvement' }
      };
      
      // Act
      session.captureLastLlmInteraction(interactionData);
      
      // Assert
      expect(session.lastLlmInteraction).not.toBeNull();
      expect(session.lastLlmInteraction.state).toBe('GREEN');
      expect(session.lastLlmInteraction.llmResponse.proceed).toBe('no');
      expect(session.lastLlmInteraction.llmResponse.comments).toBe('Need improvement');
    });
  });
  
  describe('getLastLlmInteraction', () => {
    it('should return the last stored LLM interaction', () => {
      // Arrange
      const interactionData = {
        state: 'REFACTOR',
        llmResponse: { proceed: 'yes', comments: 'Good refactoring!' }
      };
      session.captureLastLlmInteraction(interactionData);
      
      // Act
      const result = session.getLastLlmInteraction();
      
      // Assert
      expect(result).toEqual(interactionData);
    });
    
    it('should return null if no interaction was captured', () => {
      // Act
      const result = session.getLastLlmInteraction();
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('captureInteraction (original method)', () => {
    it('should still work independently for test case capture', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const testCaptureData = {
        state: 'PICK',
        llmResponse: { proceed: 'yes', comments: 'Good choice!' }
      };
      const llmInteractionData = {
        state: 'RED',
        llmResponse: { proceed: 'no', comments: 'Test needs work' }
      };
      
      // Act
      session.captureInteraction(testCaptureData);
      session.captureLastLlmInteraction(llmInteractionData);
      
      // Assert
      expect(session.capturedInteraction).not.toBeNull();
      expect(session.capturedInteraction.state).toBe('PICK');
      
      expect(session.lastLlmInteraction).not.toBeNull();
      expect(session.lastLlmInteraction.state).toBe('RED');
      
      // Verify they're separate objects
      expect(session.capturedInteraction).not.toBe(session.lastLlmInteraction);
    });
  });
});
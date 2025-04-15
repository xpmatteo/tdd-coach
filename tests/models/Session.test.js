const Session = require('../../models/Session');

describe('Session', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save the original environment 
    originalEnv = process.env.PROMPT_CAPTURE_MODE;
  });
  
  afterEach(() => {
    // Restore the original environment
    process.env.PROMPT_CAPTURE_MODE = originalEnv;
  });
  
  describe('captureInteraction', () => {
    it('should store captured interaction when PROMPT_CAPTURE_MODE is true', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const session = new Session('fizzbuzz');
      const interactionData = {
        state: 'RED',
        llmResponse: { proceed: 'yes', comments: 'Great test!' }
      };
      
      // Act
      session.captureInteraction(interactionData);
      
      // Assert
      expect(session.capturedInteraction).not.toBeNull();
      expect(session.capturedInteraction.state).toBe('RED');
      expect(session.capturedInteraction.llmResponse.proceed).toBe('yes');
      expect(session.capturedInteraction.llmResponse.comments).toBe('Great test!');
      expect(session.capturedInteraction.timestamp).toBeDefined();
      expect(session.capturedInteraction.id).toBeDefined();
    });
    
    it('should not store captured interaction when PROMPT_CAPTURE_MODE is not true', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      const session = new Session('fizzbuzz');
      const interactionData = {
        state: 'RED',
        llmResponse: { proceed: 'yes', comments: 'Great test!' }
      };
      
      // Act
      session.captureInteraction(interactionData);
      
      // Assert
      expect(session.capturedInteraction).toBeNull();
    });
  });
  
  describe('getCurrentCapture', () => {
    it('should return the captured interaction', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const session = new Session('fizzbuzz');
      const interactionData = {
        state: 'RED',
        llmResponse: { proceed: 'yes', comments: 'Great test!' }
      };
      session.captureInteraction(interactionData);
      
      // Act
      const result = session.getCurrentCapture();
      
      // Assert
      expect(result).toBe(session.capturedInteraction);
    });
    
    it('should return null if no interaction was captured', () => {
      // Arrange
      const session = new Session('fizzbuzz');
      
      // Act
      const result = session.getCurrentCapture();
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('clearCapturedInteraction', () => {
    it('should clear the captured interaction', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const session = new Session('fizzbuzz');
      const interactionData = {
        state: 'RED',
        llmResponse: { proceed: 'yes', comments: 'Great test!' }
      };
      session.captureInteraction(interactionData);
      
      // Act
      session.clearCapturedInteraction();
      
      // Assert
      expect(session.capturedInteraction).toBeNull();
    });
  });
});

const Session = require('../models/Session');

/**
 * Session Manager - handles session creation and storage
 */
class SessionManager {
  constructor(sessions, persistenceService) {
    this.sessions = sessions;
    this.persistenceService = persistenceService;
  }

  async createSession(sessionId, kata) {
    const session = new Session(kata);
    this.sessions.set(sessionId, session);

    // Save initial session state
    if (this.persistenceService) {
      try {
        await this.persistenceService.saveSession(sessionId, session.toJSON());
      } catch (error) {
        console.error(`Error saving new session ${sessionId}:`, error);
        // Continue without persistence - don't fail session creation
      }
    }

    return session;
  }

  findSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async loadFromPersistence(sessionId) {
    if (!this.persistenceService) {
      return null;
    }

    const sessionData = await this.persistenceService.loadLatestSession(sessionId);
    if (sessionData) {
      const session = Session.fromJSON(sessionData);
      this.sessions.set(sessionId, session);
      return session;
    }
    return null;
  }

  async saveSession(sessionId, session) {
    if (this.persistenceService) {
      await this.persistenceService.saveSession(sessionId, session.toJSON());
    }
  }

  async restartSession(sessionId, oldSession) {
    // Create a fresh session with the same kata
    const newSession = new Session(oldSession.kata);
    
    // Preserve the running cost tracker
    if (oldSession.runningCost) {
      newSession.runningCost = oldSession.runningCost;
    }
    
    // Store the new session
    this.sessions.set(sessionId, newSession);

    // Save restarted session
    if (this.persistenceService) {
      try {
        await this.persistenceService.saveSession(sessionId, newSession.toJSON());
      } catch (error) {
        console.error(`Error saving restarted session ${sessionId}:`, error);
        // Continue without persistence - don't fail session restart
      }
    }

    return newSession;
  }
}

module.exports = SessionManager;
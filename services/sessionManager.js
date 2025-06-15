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
}

module.exports = SessionManager;
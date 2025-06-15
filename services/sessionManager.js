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
}

module.exports = SessionManager;
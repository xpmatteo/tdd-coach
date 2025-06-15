/**
 * Creates a restartSession handler with injected dependencies
 * @param {Object} sessionManager - The session manager dependency
 * @param {Object} viewDataBuilder - The view data builder dependency
 * @returns {Function} The restartSession handler function
 */
function createRestartSessionHandler(sessionManager, viewDataBuilder) {
  return async function restartSession(req, res) {
    const { sessionId } = req.body;
    const oldSession = sessionManager.findSession(sessionId);

    if (!oldSession) {
      return res.status(404).send('Session not found');
    }

    try {
      // Restart the session with the same kata, preserving running cost
      const newSession = await sessionManager.restartSession(sessionId, oldSession);

      // Render the session view with restart message
      const viewData = viewDataBuilder.getSessionViewData(
        sessionId, 
        newSession, 
        "Session restarted. Let's begin again!", 
        null
      );
      res.render('session', viewData);
    } catch (error) {
      console.error(`Error restarting session ${sessionId}:`, error);
      return res.status(500).send('Failed to restart session');
    }
  };
}

module.exports = createRestartSessionHandler;
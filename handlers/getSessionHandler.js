/**
 * Creates a getSession handler with injected dependencies
 * @param {Object} sessionManager - The session manager dependency
 * @param {Object} viewDataBuilder - The view data builder dependency
 * @returns {Function} The getSession handler function
 */
function createGetSessionHandler(sessionManager, viewDataBuilder) {
  return async function getSession(req, res) {
    const sessionId = req.params.id;
    let session = sessionManager.findSession(sessionId);

    // If session not in memory, try to load from persistence
    if (!session) {
      try {
        session = await sessionManager.loadFromPersistence(sessionId);
      } catch (error) {
        console.error(`Error loading session ${sessionId}:`, error);
        // Fall through to redirect to new session
      }
    }

    if (!session) {
      // Session not found, redirect to create a new one
      return res.redirect('/session/new');
    }

    const viewData = viewDataBuilder.getSessionViewData(sessionId, session);
    res.render('session', viewData);
  };
}

module.exports = createGetSessionHandler;
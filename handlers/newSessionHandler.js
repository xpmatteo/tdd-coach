const { v4: uuidv4 } = require('uuid');

/**
 * Creates a newSession handler with injected dependencies
 * @param {Object} katas - The available katas object
 * @param {Object} sessionManager - The session manager dependency
 * @returns {Function} The newSession handler function
 */
function createNewSessionHandler(katas, sessionManager) {
  return async function newSession(req, res) {
    const kataKey = req.query.kata || 'fizzbuzz';
    const kata = katas[kataKey];
    
    if (!kata) {
      return res.status(404).send('Kata not found');
    }

    const sessionId = uuidv4();
    await sessionManager.createSession(sessionId, kata);

    res.redirect(`/session/${sessionId}`);
  };
}

module.exports = createNewSessionHandler;
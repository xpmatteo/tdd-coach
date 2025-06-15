const sessionController = require('../../controllers/sessionController');

describe('sessionController', () => {
  test('should export sessions map', () => {
    expect(sessionController.sessions).toBeDefined();
    expect(sessionController.sessions instanceof Map).toBe(true);
  });
});

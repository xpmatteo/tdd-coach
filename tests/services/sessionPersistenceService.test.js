const fs = require('fs').promises;
const path = require('path');
const SessionPersistenceService = require('../../services/sessionPersistenceService');

describe('SessionPersistenceService', () => {
  let service;
  let testSessionId;
  let testSessionDir;

  beforeEach(() => {
    service = new SessionPersistenceService();
    testSessionId = 'test-session-123';
    testSessionDir = service.getSessionDirectory(testSessionId);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testSessionDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('saveSession', () => {
    it('should create session directory and save session data with timestamp filename', async () => {
      const sessionData = {
        kataName: 'fizzbuzz',
        state: 'pick',
        testCases: [{ description: 'test 1', status: 'TODO' }]
      };

      await service.saveSession(testSessionId, sessionData);

      // Verify directory exists
      const stats = await fs.stat(testSessionDir);
      expect(stats.isDirectory()).toBe(true);

      // Verify file was created with timestamp name
      const files = await fs.readdir(testSessionDir);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/^\d+\.json$/);

      // Verify file contents
      const filepath = path.join(testSessionDir, files[0]);
      const savedData = JSON.parse(await fs.readFile(filepath, 'utf8'));
      expect(savedData).toEqual(sessionData);
    });

    it('should create multiple files for multiple saves', async () => {
      const sessionData1 = { state: 'pick' };
      const sessionData2 = { state: 'red' };

      await service.saveSession(testSessionId, sessionData1);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.saveSession(testSessionId, sessionData2);

      const files = await fs.readdir(testSessionDir);
      expect(files.length).toBe(2);
      
      // Verify both are JSON files with timestamp names
      files.forEach(file => {
        expect(file).toMatch(/^\d+\.json$/);
      });
    });
  });

  describe('loadLatestSession', () => {
    it('should return null for non-existent session', async () => {
      const result = await service.loadLatestSession('non-existent-session');
      expect(result).toBeNull();
    });

    it('should load the latest session data when multiple files exist', async () => {
      const sessionData1 = { state: 'pick', timestamp: 1 };
      const sessionData2 = { state: 'red', timestamp: 2 };

      await service.saveSession(testSessionId, sessionData1);
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.saveSession(testSessionId, sessionData2);

      const result = await service.loadLatestSession(testSessionId);
      expect(result).toEqual(sessionData2);
    });

    it('should handle corrupted JSON gracefully', async () => {
      // Create directory and invalid JSON file
      await fs.mkdir(testSessionDir, { recursive: true });
      const corruptFile = path.join(testSessionDir, '1234567890.json');
      await fs.writeFile(corruptFile, 'invalid json{', 'utf8');

      const result = await service.loadLatestSession(testSessionId);
      expect(result).toBeNull();
    });
  });

  describe('sessionExists', () => {
    it('should return false for non-existent session', async () => {
      const exists = await service.sessionExists('non-existent-session');
      expect(exists).toBe(false);
    });

    it('should return true for existing session directory', async () => {
      const sessionData = { state: 'pick' };
      await service.saveSession(testSessionId, sessionData);

      const exists = await service.sessionExists(testSessionId);
      expect(exists).toBe(true);
    });

    it('should return false for file (not directory) with same name', async () => {
      // Create base directory first
      await service.ensureBaseDirectory();
      
      // Create a file where session directory should be
      const filePath = service.getSessionDirectory(testSessionId);
      await fs.writeFile(filePath, 'not a directory', 'utf8');

      const exists = await service.sessionExists(testSessionId);
      expect(exists).toBe(false);

      // Clean up the file
      await fs.unlink(filePath);
    });
  });

  describe('getSessionHistory', () => {
    it('should return empty array for non-existent session', async () => {
      const history = await service.getSessionHistory('non-existent-session');
      expect(history).toEqual([]);
    });

    it('should return session files sorted by timestamp descending', async () => {
      const sessionData1 = { state: 'pick' };
      const sessionData2 = { state: 'red' };
      const sessionData3 = { state: 'green' };

      await service.saveSession(testSessionId, sessionData1);
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.saveSession(testSessionId, sessionData2);
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.saveSession(testSessionId, sessionData3);

      const history = await service.getSessionHistory(testSessionId);
      expect(history.length).toBe(3);
      
      // Should be sorted by timestamp descending (latest first)
      expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
      expect(history[1].timestamp).toBeGreaterThan(history[2].timestamp);
      
      // All should have filename, timestamp, and date properties
      history.forEach(entry => {
        expect(entry).toHaveProperty('filename');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('date');
        expect(entry.filename).toMatch(/^\d+\.json$/);
        expect(typeof entry.timestamp).toBe('number');
        expect(entry.date).toBeInstanceOf(Date);
      });
    });
  });
});
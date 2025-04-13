const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Route to start a new session
router.get('/new', sessionController.newSession);

// Route to process form submissions
router.post('/submit', sessionController.submitCode);

// Route to get hints
router.post('/hint', sessionController.getHint);

// Route to restart session
router.post('/restart', sessionController.restartSession);

module.exports = router;
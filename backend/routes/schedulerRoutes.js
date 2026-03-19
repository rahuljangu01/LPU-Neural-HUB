const express = require('express');
const router = express.Router();
const { generateAITimetable } = require('../controllers/aiSchedulerController');
const auth = require('../middleware/authMiddleware');

router.post('/generate', auth, generateAITimetable);

module.exports = router;
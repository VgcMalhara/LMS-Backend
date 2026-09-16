const express = require('express');
const router = express.Router();
const { getAIRecommendations, getAIUsage } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route to fetch current global API request usage stats
router.get('/usage', protect, authorize('student'), getAIUsage);

// Route to get AI course recommendations (Students only)
router.post('/recommendations', protect, authorize('student'), getAIRecommendations);

module.exports = router;
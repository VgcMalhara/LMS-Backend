const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only students should be able to ask for recommendations
router.post('/recommendations', protect, authorize('student'), getRecommendations);

module.exports = router;
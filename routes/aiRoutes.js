const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getAIRecommendations, getAIUsage } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Define Rate Limiter: Max 5 requests per 1 minute per user/IP
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute time window
    max: 5, // Limit each user to 5 requests per minute
    message: {
        message: 'Too many AI requests from this account, please try again after a minute.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Route to fetch current global API request usage stats (Students only)
router.get('/usage', protect, authorize('student'), getAIUsage);

// Route to get AI course recommendations with rate limiting applied (Students only)
router.post('/recommendations', protect, authorize('student'), aiLimiter, getAIRecommendations);

module.exports = router;
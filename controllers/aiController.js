const ApiUsage = require('../models/ApiUsage');
const Course = require('../models/Course');
const OpenAI = require('openai');

// Initialize OpenAI client (API key is automatically loaded from environment variables)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Get AI course recommendations and track global API limit (Max 250)
// @route   POST /api/ai/recommendations
const getAIRecommendations = async (req, res) => {
    const { prompt } = req.body;

    try {
        // 1. Fetch or initialize the global API usage tracker document from MongoDB
        let usage = await ApiUsage.findOne();
        if (!usage) {
            usage = await ApiUsage.create({ totalRequests: 0, maxLimit: 250 });
        }

        // 2. Check if the global request limit (250) has been reached
        if (usage.totalRequests >= usage.maxLimit) {
            return res.status(429).json({ 
                message: 'Global API request limit of 250 has been reached. No more requests are allowed.' 
            });
        }

        // 3. Fetch all active course titles and IDs from the database
        const availableCourses = await Course.find({}, '_id title category description');
        
        const courseContextList = availableCourses.map(c => 
            `- Title: "${c.title}" | ID: ${c._id} | Category: ${c.category || 'General'}`
        ).join('\n');

        // 4. Increment usage count by 1 and save back to MongoDB
        usage.totalRequests += 1;
        await usage.save();

        console.log(`[API Log] Global Request Count: ${usage.totalRequests}/${usage.maxLimit}`);

        // 5. Call OpenAI API with a strict system prompt instructing it to include the Course ID format
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Or gpt-4o-mini
            messages: [
                { 
                    role: "system", 
                    content: `You are an intelligent AI career advisor for our LMS platform. 
Your task is to recommend the best courses to users based on their queries, STRICTLY from the provided list of available courses below.
When you recommend a course, you MUST include its exact title and append its ID in this exact format: (ID: <course_id>) so that our frontend system can automatically turn it into a clickable link.
Here is the available course list in our database:
${courseContextList}` 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const aiReply = completion.choices[0].message.content;

        // 6. Respond with the AI recommendation and updated usage statistics
        res.status(200).json({ 
            recommendation: aiReply,
            requestsRemaining: usage.maxLimit - usage.totalRequests,
            totalUsed: usage.totalRequests
        });

    } catch (error) {
        console.error('[API Error]:', error);
        res.status(500).json({ message: error.message || 'Server error during AI recommendation processing' });
    }
};

// @desc    Get current global API usage stats
// @route   GET /api/ai/usage
const getAIUsage = async (req, res) => {
    try {
        let usage = await ApiUsage.findOne();
        if (!usage) {
            usage = await ApiUsage.create({ totalRequests: 0, maxLimit: 250 });
        }

        res.status(200).json({
            totalUsed: usage.totalRequests,
            maxLimit: usage.maxLimit,
            requestsRemaining: usage.maxLimit - usage.totalRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAIRecommendations, getAIUsage };
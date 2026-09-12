const { OpenAI } = require('openai');
const Course = require('../models/Course');

// Initialize OpenAI instance using the API key from .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Get course recommendations from ChatGPT
// @route   POST /api/ai/recommendations
// @access  Private (Student only)
const getRecommendations = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Please provide a prompt' });
    }

    try {
        // 1. Fetch all available courses from our database
        const courses = await Course.find().select('title description');

        // If no courses exist, let the user know
        if (courses.length === 0) {
            return res.status(404).json({ message: 'No courses available to recommend.' });
        }

        // 2. Format the courses into a text list so ChatGPT can read them
        const courseList = courses.map(c => `ID: ${c._id}, Title: ${c.title}, Description: ${c.description}`).join('\n');

        // 3. Create the System Prompt for ChatGPT
        const systemMessage = `
            You are an expert academic advisor. 
            Here is a list of available courses in our system:
            ${courseList}
            
            Based on the user's career goal or interest, recommend the best courses from the list provided above. 
            Only recommend courses from the list. Provide a brief explanation of why you recommend each.
        `;

        // 4. Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // You can use gpt-4o or gpt-3.5-turbo
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        // 5. Send AI's response back to the frontend
        const aiRecommendation = response.choices[0].message.content;
        res.status(200).json({ recommendation: aiRecommendation });

    } catch (error) {
        console.error('OpenAI Error:', error.message);
        res.status(500).json({ message: 'Failed to generate recommendations from AI' });
    }
};

module.exports = { getRecommendations };
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dns = require('dns');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// 1. Load environment variables from .env file
dotenv.config();

// Fix MongoDB Atlas DNS connection issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

// 2. Connect to the database
connectDB();

const app = express();

// 3. Middlewares
app.use(helmet()); // Adds security headers to protect from basic attacks
app.use(cors()); // Allows cross-origin requests (frontend to backend)
app.use(express.json()); // Allows parsing JSON data in request body

// Show API request logs in the terminal only during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// 4. Routes (Connect Auth Routes from Day 2)
app.use('/api/auth', require('./routes/authRoutes'));
// 4. Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes')); 
app.use('/api/ai', require('./routes/aiRoutes'));

// Basic test route
app.get('/', (req, res) => {
    res.send('LMS API is running...');
});

// 5. Global Error Handling Middlewares
app.use(notFound); // Handles 404 errors (route not found)
app.use(errorHandler); // Handles all other errors globally

// 6. Server Initialization
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// 7. Handle Unhandled Promise Rejections (e.g., database connection fail)
// This prevents the server from crashing unexpectedly
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server and exit process safely
    server.close(() => process.exit(1));
});
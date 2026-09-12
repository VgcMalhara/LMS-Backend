const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const dns = require('dns');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Fix MongoDB Atlas DNS issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route to test
app.get('/', (req, res) => {
    res.send('LMS API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
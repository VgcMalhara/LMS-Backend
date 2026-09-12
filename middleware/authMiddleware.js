const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (verify JWT token)
const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find the user by ID from the token and attach it to the request object
            // .select('-password') removes the password from the fetched data for security
            req.user = await User.findById(decoded.id).select('-password'); 
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token is found in the headers
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware for Role-Based Access Control (RBAC)
const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if the user's role is included in the allowed roles array
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role '${req.user.role}' is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorize };
// Return a 404 error if the user requests a route that does not exist
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Global error handler to send errors as JSON instead of HTML
const errorHandler = (err, req, res, next) => {
    // Set status code (default to 500 if it's currently 200)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message,
        // Hide stack trace in production for security reasons
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };
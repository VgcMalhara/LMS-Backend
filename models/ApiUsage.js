const mongoose = require('mongoose');

const apiUsageSchema = new mongoose.Schema({
    totalRequests: { 
        type: Number, 
        default: 0 
    },
    maxLimit: { 
        type: Number, 
        default: 250 
    }
});

module.exports = mongoose.model('ApiUsage', apiUsageSchema);
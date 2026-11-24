// Allison Eckert
// CIS 515 - Module 10 Project Part 6

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
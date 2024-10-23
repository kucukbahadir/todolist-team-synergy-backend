const mongoose = require('mongoose');
const Userschema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('email', Userschema);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    files: [{ 
        filename: String, 
        category: String, 
        path: String 
    }]
});

module.exports = mongoose.model('User', UserSchema);
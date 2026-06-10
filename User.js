const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // পুরানো টেক্সট এবং নতুন অবজেক্ট দুটোর জন্যই মিক্সড টাইপ সেট করা হলো
    uploadedFiles: { type: Array, default: [] } 
});

module.exports = mongoose.model('User', UserSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ইউজারনেম বাধ্যতামূলক
    username: { 
        type: String, 
        required: [true, 'ইউজারনেম দেওয়া আবশ্যক!'], 
        trim: true 
    },
    // ইমেইল বাধ্যতামূলক এবং ইউনিক হতে হবে
    email: { 
        type: String, 
        required: [true, 'ইমেইল দেওয়া আবশ্যক!'], 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    // পাসওয়ার্ড বাধ্যতামূলক
    password: { 
        type: String, 
        required: [true, 'পাসওয়ার্ড দেওয়া আবশ্যক!'],
        minlength: [6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে!']
    },
    // ফেস ডেটার জন্য (আগের আলোচনা অনুযায়ী)
    faceDescriptor: { type: Array, default: [] },
    
    // অ্যাকাউন্ট তৈরির সময় স্বয়ংক্রিয়ভাবে সেভ হবে
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
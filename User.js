const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // পাসওয়ার্ড হ্যাশ করার জন্য

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'ইউজারনেম দেওয়া আবশ্যক!'], 
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'ইমেইল দেওয়া আবশ্যক!'], 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: [true, 'পাসওয়ার্ড দেওয়া আবশ্যক!'],
        minlength: [6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে!']
    },
    faceDescriptor: { 
        type: Array, 
        default: [] 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// ইউজার সেভ করার আগে পাসওয়ার্ড হ্যাশ করার জন্য একটি মিডেলওয়্যার (নিরাপত্তার জন্য)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // ফেস আইডি ভেরিফিকেশনের জন্য
    facialId: { 
        type: String 
    },
    // ফাইল ম্যানেজমেন্টের জন্য (ছবি, ভিডিও, অডিও)
    files: [{ 
        filename: String, 
        category: { 
            type: String, 
            enum: ['image', 'video', 'audio'] 
        }, 
        path: String,
        uploadDate: { 
            type: Date, 
            default: Date.now 
        }
    }]
});

module.exports = mongoose.model('User', UserSchema);
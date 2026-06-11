const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const User = require('./User'); // আপনার User.js ফাইলটি অবশ্যই একই ফোল্ডারে রাখবেন
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const app = express(); // এটি সবার আগে ডিফাইন করতে হবে

// মিডলওয়্যার
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(mongoSanitize());
app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || 'samir_super_secret_key_98765';

// ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas কানেক্টেড!"))
.catch(err => console.error("ডাটাবেজ এরর:", err));

// ইমেইল ট্রান্সপোর্টার
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

// রেজিস্ট্রেশন রুট
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "সবগুলো ফিল্ড পূরণ করা আবশ্যক!" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!" });
    } catch (e) { 
        console.error("রেজিস্ট্রেশন এরর:", e);
        res.status(500).json({ error: "সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করুন।" }); 
    }
});

// পোর্ট লিসেন
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
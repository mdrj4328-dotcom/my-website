const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const upload = require('./upload');
const path = require('path');
const fs = require('fs');
const User = require('./User');
// নতুন সিকিউরিটি প্যাকেজসমূহ
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// ১. নিরাপত্তা মিডলওয়্যার সেটআপ
app.use(helmet()); // সুরক্ষা হেডার যোগ করে
app.use(express.json());
app.use(mongoSanitize()); // মঙ্গোডিবি ইনজেকশন থেকে সুরক্ষা দেয়

// ফরগেট পাসওয়ার্ড ও লগইনের জন্য রেট লিমিট (Brute Force প্রতিরোধে)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট
  max: 5, // প্রতি ১৫ মিনিটে ৫বারের বেশি রিকোয়েস্ট করা যাবে না
  message: { error: "অনেকবার চেষ্টা করেছেন! ১৫ মিনিট পর আবার চেষ্টা করুন।" }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// গোপন কী এনভায়রনমেন্ট থেকে নেওয়া উচিত (নিরাপত্তার খাতিরে)
const JWT_SECRET = process.env.JWT_SECRET || 'samir_super_secret_key_98765';

// ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas ডেটাবেজ কানেক্টেড!"))
.catch(err => console.error("ডেটাবেজ কানেকশন এরর:", err));

// ইমেইল ট্রান্সপোর্টার
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

// অথেনটিকেশন মিডলওয়্যার
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "অনুমতি নেই!" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "টোকেন ভুল!" });
        req.user = user;
        next();
    });
};

// রুটসমূহ
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "অ্যাকাউন্ট আছে!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ email, password: hashedPassword }).save();
        res.status(201).json({ message: "সফল!" });
    } catch (e) { res.status(500).json({ error: "ত্রুটি হয়েছে।" }); }
});

app.post('/login', limiter, async (req, res) => { // এখানে লিমিটার যোগ করা হয়েছে
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) 
            return res.status(400).json({ error: "ভুল তথ্য!" });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (e) { res.status(500).json({ error: "ত্রুটি হয়েছে।" }); }
});

app.post('/forgot-password', limiter, async (req, res) => { // এখানে লিমিটার যোগ করা হয়েছে
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি!" });

        const newPass = Math.floor(100000 + Math.random() * 900000).toString();
        user.password = await bcrypt.hash(newPass, 10);
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER, to: email,
            subject: 'পাসওয়ার্ড রিসেট', html: `<h3>সাময়িক পাসওয়ার্ড: ${newPass}</h3>`
        });
        res.json({ message: "ইমেইল চেক করুন।" });
    } catch (e) { res.status(500).json({ error: "ইমেইল পাঠানো যায়নি।" }); }
});

// অন্যান্য রুট (ফাইল আপলোড/ডিলিট একই থাকবে...)
// ...আপনার আগের কোডের ফাইল আপলোড ও ডিলিট অংশগুলো এখানে বসিয়ে দিন

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
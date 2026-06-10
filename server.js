const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const upload = require('./upload');
const path = require('path');
const fs = require('fs');
const User = require('./User');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// নিরাপত্তা সেটিংস - Helmet (CSP অফ করা হয়েছে)
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(express.json());
app.use(mongoSanitize());

// রেট লিমিট আপাতত কমেন্ট করা হলো যাতে কোনো রিকোয়েস্ট ব্লক না হয়
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
app.use('/login', limiter);
app.use('/forgot-password', limiter);
*/

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || 'samir_super_secret_key_98765';

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas কানেক্টেড!"))
.catch(err => console.error("ডাটাবেজ এরর:", err));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "লগইন করুন।" });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "টোকেন ভুল!" });
        req.user = user;
        next();
    });
};

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "অ্যাকাউন্ট আছে!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ email, password: hashedPassword }).save();
        res.status(201).json({ message: "সফল!" });
    } catch (e) { res.status(500).json({ error: "ত্রুটি।" }); }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) 
            return res.status(400).json({ error: "ভুল তথ্য!" });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "লগইন সফল!", token });
    } catch (e) { res.status(500).json({ error: "ত্রুটি।" }); }
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "ইউজার নেই!" });
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

// ফাইল আপলোড ও অন্যান্য রুট এখানে একইভাবে থাকবে...

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
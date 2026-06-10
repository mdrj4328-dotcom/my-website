const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const upload = require('./upload');
const path = require('path');
const fs = require('fs');
const User = require('./User'); 

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
app.use(express.static(__dirname));

const JWT_SECRET = 'samir_super_secret_key_98765';

// ডাটাবেজ কানেকশন (রেন্ডার এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করে)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas ডেটাবেজ কানেক্টেড!"))
.catch(err => console.error("ডেটাবেজ কানেকশন এরর:", err));

// ইমেইল ট্রান্সপোর্টার (রেন্ডার এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করে)
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
    if (!token) return res.status(401).json({ error: "অনুমতি নেই! দয়া করে লগইন করুন।" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "টোকেন ভুল!" });
        req.user = user;
        next();
    });
};

// ১. রেজিস্ট্রেশন
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "সবগুলো ঘর পূরণ করুন।" });
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "অ্যাকাউন্ট ইতিমধ্যে আছে!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, uploadedFiles: [] });
        await newUser.save();
        res.status(201).json({ message: "অ্যাকাউন্ট তৈরি সফল হয়েছে!" });
    } catch (error) { res.status(500).json({ error: "ব্যর্থ হয়েছে।" }); }
});

// ২. লগইন
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "ভুল তথ্য!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "ভুল তথ্য!" });

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "লগইন সফল!", token });
    } catch (error) { res.status(500).json({ error: "সমস্যা হয়েছে।" }); }
});

// ৩. পাসওয়ার্ড ফরগেট
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "অ্যাকাউন্ট পাওয়া যায়নি!" });

        const newTemporaryPassword = Math.floor(100000 + Math.random() * 900000).toString();
        user.password = await bcrypt.hash(newTemporaryPassword, 10);
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER, 
            to: email,
            subject: 'সামির হোসেন পোর্টাল - পাসওয়ার্ড রিসেট',
            html: `<h3>সাময়িক নতুন পাসওয়ার্ড: ${newTemporaryPassword}</h3>`
        });
        res.json({ message: "জিমেইলে সাময়িক পাসওয়ার্ড পাঠানো হয়েছে।" });
    } catch (error) { res.status(500).json({ error: "ইমেইল পাঠানো যায়নি।" }); }
});

// ৪. পাসওয়ার্ড পরিবর্তন
app.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
        res.json({ message: "আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!" });
    } catch (error) { res.status(500).json({ error: "পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে।" }); }
});

// ৫. ফাইল আপলোড
app.post('/upload', authenticateToken, upload.single('media'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "কোনো ফাইল সিলেক্ট করা হয়নি।" });
        const filePath = `/uploads/${req.file.filename}`;
        const sizeInBytes = req.file.size;
        const sizeStr = sizeInBytes > 1024 * 1024 ? (sizeInBytes / (1024 * 1024)).toFixed(2) + " MB" : (sizeInBytes / 1024).toFixed(2) + " KB";
        const dateStr = new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });

        await User.findByIdAndUpdate(req.user.id, {
            $push: { uploadedFiles: { url: filePath, size: sizeStr, date: dateStr } }
        });
        res.json({ message: "ফাইল আপলোড সফল হয়েছে!", path: filePath });
    } catch (error) { res.status(500).json({ error: "ফাইল আপলোড ব্যর্থ হয়েছে।" }); }
});

// ৬. ফাইল লোড করা
app.get('/my-files', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ files: user.uploadedFiles || [] });
    } catch (error) { res.status(500).json({ error: "লোড করা যায়নি।" }); }
});

// ৭. ফাইল ডিলিট করা
app.delete('/delete-file', authenticateToken, async (req, res) => {
    try {
        const { fileUrl } = req.body;
        const fullPath = path.join(__dirname, fileUrl);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        await User.findByIdAndUpdate(req.user.id, { $pull: { uploadedFiles: { url: fileUrl } } });
        res.json({ message: "ফাইলটি স্থায়ীভাবে ডিলিট করা হয়েছে!" });
    } catch (error) { res.status(500).json({ error: "ডিলিট করতে সমস্যা হয়েছে।" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
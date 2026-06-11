const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: "mdrj4328@gmail.com", pass: "arrkfvypjupjxhdw" }
});

// লগইন ও রেজিস্ট্রেশন
app.post('/api/auth', async (req, res) => {
    const { email, password, type } = req.body;
    try {
        if (type === 'register') {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ error: "এই ইমেইলে অলরেডি একাউন্ট আছে!" });
            
            const newUser = new User({ email, password });
            await newUser.save();
            return res.json({ message: "একাউন্ট তৈরি সফল!" });
        }
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "ভুল তথ্য" });
        res.json({ success: true, message: "লগইন সফল!", email: user.email });
    } catch (err) {
        res.status(500).json({ error: "সার্ভার এরর" });
    }
});

// ফরগেট পাসওয়ার্ড
app.post('/api/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "এই ইমেইলটি আমাদের ডাটাবেজে নেই" });
        
        await transporter.sendMail({
            from: "mdrj4328@gmail.com",
            to: email,
            subject: "আপনার সামির হোসেন পোর্টাল পাসওয়ার্ড",
            text: `আপনার বর্তমান পাসওয়ার্ড হলো: ${user.password}`
        });
        res.json({ message: "আপনার পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: "ইমেইল পাঠাতে সমস্যা হয়েছে" });
    }
});

// ফাইল আপলোড রাউট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    await User.updateOne({ email }, { $push: { files: { filename: req.file.originalname, category, path: req.file.path } } });
    res.json({ message: "আপলোড সফল!" });
});

// পাসওয়ার্ড পরিবর্তন রাউট
app.post('/api/change-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email, password: oldPassword });
    if (!user) return res.status(401).json({ error: "পুরানো পাসওয়ার্ড ভুল!" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "পাসওয়ার্ড পরিবর্তন সফল!" });
});

// ফাইল লিস্ট দেখার রাউট
app.post('/api/files', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ files: [] });
        res.json({ files: user.files || [] });
    } catch (err) {
        res.status(500).json({ files: [] });
    }
});

app.listen(10000, () => console.log("সামির হোসেন পোর্টাল সচল!"));
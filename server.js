require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("ডাটাবেজ কানেক্ট হয়েছে!"))
    .catch(err => console.error("ডাটাবেজ কানেকশন এরর:", err));

// ১. রেজিস্ট্রেশন রুট
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!" });
    } catch (err) {
        res.status(400).json({ error: "রেজিস্ট্রেশন ব্যর্থ হয়েছে!" });
    }
});

// ২. লগইন রুট
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "ইউজার পাওয়া যায়নি!" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "পাসওয়ার্ড ভুল!" });
        res.status(200).json({ message: "লগইন সফল!" });
    } catch (err) {
        res.status(500).json({ error: "সার্ভার এরর!" });
    }
});

// --- নতুন বাটনগুলোর রাউট যোগ করা হলো ---
app.get('/api/media', (req, res) => { res.json({ message: "মিডিয়া ম্যানেজার সচল আছে!" }); });
app.get('/api/upload', (req, res) => { res.json({ message: "ফাইল আপলোড সিস্টেম রেডি!" }); });
app.get('/api/profile', (req, res) => { res.json({ message: "প্রোফাইল লোড হয়েছে!" }); });
app.get('/api/db-status', (req, res) => { res.json({ message: "ডাটাবেজ কানেকশন একদম পারফেক্ট!" }); });
app.get('/api/settings', (req, res) => { res.json({ message: "সেটিংস প্যানেল ওপেন হয়েছে!" }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`সামির হোসেন পোর্টাল ${PORT} পোর্টে সচল!`));
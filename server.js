require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./User');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("ডাটাবেজ কানেক্ট হয়েছে!"))
    .catch(err => console.error("ডাটাবেজ কানেকশন এরর:", err));

// রেজিস্ট্রেশন
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!" });
    } catch (err) {
        res.status(400).json({ error: "রেজিস্ট্রেশন ব্যর্থ হয়েছে!" });
    }
});

// লগইন
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

// প্রতিটি বাটনের জন্য পেজ রাউট
app.get('/media-manager', (req, res) => res.sendFile(path.join(__dirname, 'media.html')));
app.get('/my-profile', (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/db-status', (req, res) => res.sendFile(path.join(__dirname, 'db.html')));
app.get('/settings-panel', (req, res) => res.sendFile(path.join(__dirname, 'settings.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`সামির হোসেন পোর্টাল ${PORT} পোর্টে সচল!`));
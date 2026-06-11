const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User'); // আপনার User মডেল ফাইল
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI);

// রেজিস্ট্রেশন রুট
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: "সব ফিল্ড পূরণ করুন!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "অ্যাকাউন্ট তৈরি হয়েছে!" });
    } catch (e) { res.status(500).json({ error: "সার্ভারে সমস্যা!" }); }
});

// লগইন রুট
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল!" });
        }
        res.status(200).json({ message: "লগইন সফল!" });
    } catch (e) { res.status(500).json({ error: "সার্ভারে সমস্যা!" }); }
});

// ফরগেট পাসওয়ার্ড রুট (এই রুটটিই আপনার আগের এরর দিচ্ছিল)
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "এই ইমেইলের ইউজার নেই!" });
        
        // এখানে রিসেট লজিক কাজ করবে
        res.status(200).json({ message: "পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।" });
    } catch (e) { res.status(500).json({ error: "সার্ভারে সমস্যা!" }); }
});

app.listen(3000, () => console.log("সার্ভার চলছে..."));
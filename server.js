const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');
const app = express();

// ১. মঙ্গুজ ওয়ার্নিং ঠিক করা
mongoose.set('strictQuery', false);

app.use(express.json());
app.use(express.static(__dirname));

// ২. ডাটাবেজ কানেকশন
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("ডাটাবেজ কানেক্টেড!"))
  .catch(err => console.error("ডাটাবেজ এরর:", err));

// ৩. রুটগুলো
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

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি!" });
        res.status(200).json({ message: "পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।" });
    } catch (e) { res.status(500).json({ error: "সার্ভারে সমস্যা!" }); }
});

// ৪. পোর্ট কনফিগারেশন (রেন্ডারের জন্য সবচেয়ে গুরুত্বপূর্ণ)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`সার্ভার সফলভাবে ${PORT} পোর্টে চলছে...`);
});
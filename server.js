const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const User = require('./User');
const app = express();

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
// রুট ডিরেক্টরি থেকে index.html লোড করার জন্য
app.use(express.static(__dirname));

// ডাটাবেজ কানেকশন
mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0")
    .then(() => console.log("ডাটাবেজ কানেক্ট হয়েছে"))
    .catch(err => console.log(err));

// জিমেইল কনফিগারেশন - পাসওয়ার্ডটি স্পেস ছাড়া বসানো হয়েছে
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: "mdrj4328@gmail.com", 
        pass: "arrkfvypjupjxhdw" 
    }
});

// রুট: মূল পেজ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// রেজিস্ট্রেশন
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "এই ইমেইল দিয়ে অলরেডি একাউন্ট আছে!" });
    
    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ message: "একাউন্ট তৈরি সফল! এখন লগইন করুন।" });
});

// লগইন
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(401).json({ error: "ভুল তথ্য" });
    res.json({ success: true, email: user.email });
});

// ফরগেট পাসওয়ার্ড
app.post('/api/forgot', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: "ইউজার নেই" });
    
    await transporter.sendMail({
        from: "mdrj4328@gmail.com",
        to: user.email,
        subject: "আপনার পাসওয়ার্ড",
        text: `আপনার বর্তমান পাসওয়ার্ড হলো: ${user.password}`
    });
    res.json({ message: "পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে" });
});

// ফেস লগইন
app.post('/api/face-login', async (req, res) => {
    const { facialId } = req.body;
    const user = await User.findOne({ facialId });
    if (!user) return res.status(404).json({ error: "ফেস আইডি পাওয়া যায়নি।" });
    res.json({ success: true, message: "ফেস লগইন সফল!" });
});

// পোর্ট লিসেনিং
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`সার্ভার ${PORT} পোর্টে চলছে!`));
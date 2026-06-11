const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./User');
const app = express();
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
    if (type === 'register') {
        const newUser = new User({ email, password });
        await newUser.save();
        return res.json({ message: "একাউন্ট তৈরি সফল!" });
    }
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "ভুল তথ্য" });
    res.json({ success: true, email: user.email });
});

// ফরগেট পাসওয়ার্ড - জিমেইলে পাঠাবে
app.post('/api/forgot', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: "ইউজার নেই" });
    await transporter.sendMail({
        from: "mdrj4328@gmail.com",
        to: user.email,
        subject: "আপনার পাসওয়ার্ড",
        text: `আপনার বর্তমান পাসওয়ার্ড হলো: ${user.password}`
    });
    res.json({ message: "আপনার পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে।" });
});

app.listen(10000, () => console.log("সামির হোসেন পোর্টাল সচল!"));
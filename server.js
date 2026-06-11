const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public'));

// ডাটাবেজ কানেকশন
mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

// জিমেইল কনফিগারেশন
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: "mdrj4328@gmail.com", pass: "arrkfvypjupjxhdw" }
});

// লগইন রুট
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
        subject: "আপনার পাসওয়ার্ড",
        text: `আপনার বর্তমান পাসওয়ার্ড হলো: ${user.password}`
    });
    res.json({ message: "পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে" });
});

// ফাইল আপলোড
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    await User.updateOne({ email }, { $push: { files: { filename: req.file.originalname, category, path: req.file.path } } });
    res.send("আপলোড সফল");
});

app.listen(10000, () => console.log("সামির হোসেন পোর্টাল ১০০০০ পোর্টে সচল!"));
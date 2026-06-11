const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
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

// ফরগেট পাসওয়ার্ড
app.post('/api/forgot', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: "ইউজার নেই" });
    await transporter.sendMail({
        from: "mdrj4328@gmail.com",
        to: user.email,
        subject: "আপনার পাসওয়ার্ড",
        text: `আপনার পাসওয়ার্ড হলো: ${user.password}`
    });
    res.json({ message: "পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে" });
});

// ফাইল আপলোড ও ক্যাটাগরি ম্যানেজমেন্ট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    await User.updateOne({ email }, { 
        $push: { files: { filename: req.file.originalname, category, path: req.file.path } } 
    });
    res.json({ message: "আপলোড সফল" });
});

// পাসওয়ার্ড পরিবর্তন
app.post('/api/change-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email, password: oldPassword });
    if (!user) return res.status(401).json({ error: "পুরনো পাসওয়ার্ড ভুল" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে" });
});

app.listen(process.env.PORT || 10000, () => console.log("সামির হোসেন পোর্টাল সচল!"));
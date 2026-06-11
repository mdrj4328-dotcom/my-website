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
mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0")
    .then(() => console.log("ডাটাবেজ কানেক্ট হয়েছে"))
    .catch(err => console.log(err));

// জিমেইল কনফিগারেশন
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: "mdrj4328@gmail.com", pass: "arrkfvypjupjxhdw" }
});

// নতুন ইউজার রেজিস্ট্রেশন (এই অংশটি নতুন যোগ করা হয়েছে)
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "এই ইমেইল দিয়ে অলরেডি একাউন্ট আছে!" });
    
    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ message: "একাউন্ট তৈরি সফল! এখন লগইন করুন।" });
});

// লগইন রুট
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(401).json({ error: "ভুল তথ্য" });
    res.json({ success: true, email: user.email });
});

// ফরগেট পাসওয়ার্ড রুট
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

// ফাইল আপলোড রুট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file) return res.status(400).send("ফাইল পাওয়া যায়নি");
    
    await User.updateOne({ email }, { 
        $push: { files: { filename: req.file.originalname, category, path: req.file.path } } 
    });
    res.send("আপলোড সফল");
});

// রেন্ডারের জন্য ডাইনামিক পোর্ট
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`সামির হোসেন পোর্টাল ${PORT} পোর্টে সচল!`));
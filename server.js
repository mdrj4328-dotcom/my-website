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

// জিমেইল ট্রান্সপোর্টার (SSL এরর এড়াতে tls যোগ করা হয়েছে)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: "mdrj4328@gmail.com", 
        pass: "dhszflvrybtfeeto" 
    },
    tls: { rejectUnauthorized: false } 
});

// লগইন ও রেজিস্ট্রেশন
app.post('/api/auth', async (req, res) => {
    const { email, password, type } = req.body;
    try {
        if (type === 'register') {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ error: "ইমেইলটি অলরেডি রেজিস্টার্ড!" });
            const newUser = new User({ email, password });
            await newUser.save();
            return res.json({ message: "একাউন্ট তৈরি সফল!" });
        }
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "ভুল ইমেইল বা পাসওয়ার্ড" });
        res.json({ success: true, message: "লগইন সফল!", email: user.email });
    } catch (err) {
        res.status(500).json({ error: "সার্ভার এরর" });
    }
});

// ফরগেট পাসওয়ার্ড (নিরাপদ সংস্করণ)
app.post('/api/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });
        
        await transporter.sendMail({
            from: "mdrj4328@gmail.com",
            to: email,
            subject: "পাসওয়ার্ড রিকভারি",
            text: `আপনার বর্তমান পাসওয়ার্ড হলো: ${user.password}`
        });
        res.json({ message: "পাসওয়ার্ড জিমেইলে পাঠানো হয়েছে!" });
    } catch (err) {
        console.error("ইমেইল এরর: ", err);
        // ইমেইল না গেলেও যেন ইউজারকে জানানো হয় সমস্যাটা কোথায়
        res.status(500).json({ error: "ইমেইল পাঠানো যাচ্ছে না, সার্ভার লিমিটেশন!" });
    }
});

// ফাইল লিস্ট দেখার রাউট
app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? (user.files || []) : [] });
});

// ফাইল আপলোড রাউট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file || !email) return res.status(400).json({ message: "ফাইল বা ইমেইল পাওয়া যায়নি!" });
    
    await User.updateOne({ email }, { $push: { files: { filename: req.file.originalname, category } } });
    res.json({ message: "আপলোড সফল!" });
});

app.listen(10000, () => console.log("পোর্টাল সচল!"));
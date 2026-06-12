const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin'); // ফায়ারবেস অ্যাডমিন যোগ করা হয়েছে
const multer = require('multer');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

// ফায়ারবেস ইনশিলাইজেশন
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

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

// ফরগেট পাসওয়ার্ড (ফায়ারবেসের মাধ্যমে লিংক জেনারেট করা)
app.post('/api/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        // ফায়ারবেস থেকে ইউজার চেক এবং লিংক তৈরি
        const link = await admin.auth().generatePasswordResetLink(email);
        res.json({ message: "নিচের লিংকে ক্লিক করে পাসওয়ার্ড রিসেট করুন:", link: link });
    } catch (err) {
        res.status(404).json({ error: "ইউজার পাওয়া যায়নি বা লিংকে সমস্যা!" });
    }
});

// ফাইল লিস্ট ও আপলোড
app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? (user.files || []) : [] });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file || !email) return res.status(400).json({ message: "ফাইল বা ইমেইল পাওয়া যায়নি!" });
    await User.updateOne({ email }, { $push: { files: { filename: req.file.originalname, category } } });
    res.json({ message: "আপলোড সফল!" });
});

app.listen(10000, () => console.log("পোর্টাল সচল!"));
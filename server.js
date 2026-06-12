const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const multer = require('multer');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

// ফায়ারবেস ইনশিলাইজেশন
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("ফায়ারবেস সফলভাবে সচল হয়েছে!");
} catch (err) {
    console.error("ফায়ারবেস কী (Key) ফাইল পাওয়া যায়নি! গিটহাবে ফাইলটি আপলোড করুন।");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ডাটাবেজ কানেকশন
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

// পাসওয়ার্ড পরিবর্তন রাউট
app.post('/api/change-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    try {
        const user = await User.findOne({ email, password: oldPassword });
        if (!user) return res.status(401).json({ error: "পুরানো পাসওয়ার্ডটি ভুল!" });
        
        user.password = newPassword;
        await user.save();
        res.json({ message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ error: "সার্ভার এরর" });
    }
});

// ফরগেট পাসওয়ার্ড
app.post('/api/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        const link = await admin.auth().generatePasswordResetLink(email);
        res.json({ message: "আপনার রিসেট লিংক: " + link });
    } catch (err) {
        res.status(404).json({ error: "ইউজার পাওয়া যায়নি বা লিংকে সমস্যা!" });
    }
});

// ফাইল লিস্ট লোড
app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? (user.files || []) : [] });
});

// ফাইল আপলোড (বানান ভুল ঠিক করা হয়েছে)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file || !email) return res.status(400).json({ message: "ফাইল বা ইমেইল পাওয়া যায়নি!" });
    
    await User.updateOne({ email }, { $push: { files: { filename: req.file.originalname, category } } });
    res.json({ message: "আপলোড সফল!" });
});

app.listen(10000, () => console.log("পোর্টাল সচল!"));
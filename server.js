const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const multer = require('multer');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

// ফায়ারবেস ইনশিলাইজেশন - এখানে এরর হবে না
let firebaseInitialized = false;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
    console.log("ফায়ারবেস সফলভাবে সচল হয়েছে!");
} catch (err) {
    console.error("Firebase Key ফাইলটি গিটহাবে নেই, ফরগেট পাসওয়ার্ড কাজ করবে না।");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

// লগইন ও রেজিস্ট্রেশন (ইমেইল ভ্যালিডেশনসহ)
app.post('/api/auth', async (req, res) => {
    const { email, password, type } = req.body;
    // ইমেইল ভ্যালিডেশন
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return res.status(400).json({ error: "সঠিক ইমেইল দিন!" });
    if (!password) return res.status(400).json({ error: "পাসওয়ার্ড দিন!" });

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
    } catch (err) { res.status(500).json({ error: "সার্ভার এরর" }); }
});

// ফরগেট পাসওয়ার্ড (ফায়ারবেস চেকসহ)
app.post('/api/forgot', async (req, res) => {
    if (!firebaseInitialized) return res.status(500).json({ error: "ফায়ারবেস কনফিগ করা নেই!" });
    try {
        const link = await admin.auth().generatePasswordResetLink(req.body.email);
        res.json({ message: "রিসেট লিংক: " + link });
    } catch (err) { res.status(404).json({ error: "ইউজার পাওয়া যায়নি!" }); }
});

// ফাইল আপলোড (নতুন মডেলের path ফিল্ডসহ)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file || !email) return res.status(400).json({ message: "ফাইল বা ইমেইল পাওয়া যায়নি!" });
    
    await User.updateOne({ email }, { 
        $push: { files: { filename: req.file.originalname, category, path: req.file.path } } 
    });
    res.json({ message: "আপলোড সফল!" });
});

// ফাইল ডাউনলোড (Path ব্যবহার করে)
app.get('/api/download/:filename', async (req, res) => {
    try {
        const user = await User.findOne({ "files.filename": req.params.filename });
        if (!user) return res.status(404).send("ফাইলটি ডাটাবেজে নেই!");
        const file = user.files.find(f => f.filename === req.params.filename);
        res.download(file.path, file.filename);
    } catch (err) { res.status(500).send("সার্ভার এরর"); }
});

// পাসওয়ার্ড পরিবর্তন
app.post('/api/change-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email, password: oldPassword });
    if (!user) return res.status(401).json({ error: "পুরানো পাসওয়ার্ড ভুল!" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "পাসওয়ার্ড পরিবর্তিত!" });
});

// ফাইল লিস্ট
app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? (user.files || []) : [] });
});

app.listen(process.env.PORT || 10000, () => console.log("পোর্টাল সচল!"));
const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path'); // নতুন লাইব্রেরি যোগ করা হয়েছে
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

let firebaseInitialized = false;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
} catch (err) { console.error("Firebase Key ফাইলটি গিটহাবে নেই!"); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

// --- API রাউটসমূহ ---

app.post('/api/auth', async (req, res) => {
    const { email, password, type } = req.body;
    try {
        if (type === 'register') {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ error: "ইমেইল অলরেডি রেজিস্টার্ড!" });
            await new User({ email, password, files: [] }).save();
            return res.json({ message: "একাউন্ট তৈরি সফল!" });
        }
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "ভুল ইমেইল বা পাসওয়ার্ড" });
        res.json({ success: true, message: "লগইন সফল!", email: user.email });
    } catch (err) { res.status(500).json({ error: "সার্ভার এরর" }); }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { email, category } = req.body;
    if (!req.file || !email) return res.status(400).json({ message: "ফাইল বা ইমেইল পাওয়া যায়নি!" });
    
    await User.updateOne({ email }, { 
        $push: { files: { filename: req.file.originalname, category, path: req.file.path } } 
    });
    res.json({ message: "আপলোড সফল!" });
});

// ডাউনলোড সমস্যা সমাধানের কোড
app.get('/api/download/:filename', async (req, res) => {
    try {
        const decodedName = decodeURIComponent(req.params.filename);
        const user = await User.findOne({ "files.filename": decodedName });
        if (!user) return res.status(404).send("ফাইলটি খুঁজে পাওয়া যায়নি!");
        
        const file = user.files.find(f => f.filename === decodedName);
        const fullPath = path.join(__dirname, file.path);
        res.download(fullPath, file.filename);
    } catch (err) { res.status(500).send("ডাউনলোড এরর"); }
});

// নতুন ফিচার: ফাইল ডিলিট
app.delete('/api/delete/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        await User.updateOne({}, { $pull: { files: { filename } } });
        res.json({ message: "ফাইলটি মুছে ফেলা হয়েছে!" });
    } catch (err) { res.status(500).json({ error: "ডিলিট করা সম্ভব হয়নি" }); }
});

app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? (user.files || []) : [] });
});

app.listen(process.env.PORT || 10000, () => console.log("পোর্টাল সচল!"));
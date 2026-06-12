const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const User = require('./User');
// ১. Cloudinary প্যাকেজগুলো যুক্ত করা হয়েছে
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// ২. Cloudinary কনফিগারেশন (আপনার রেন্ডারের ENV থেকে অটোমেটিক নিয়ে নেবে)
cloudinary.config(); 

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'samir_portal_files',
        format: async (req, file) => 'jpg',
    },
});
const upload = multer({ storage: storage });

const token = '8528728150:AAFgQR0EQH-dyK4DjHyivk3gNri9H7uyO_I';
const bot = new TelegramBot(token, { polling: false }); 
const myChatId = '8748825027';

app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0")
    .then(() => console.log("Database Connected"))
    .catch(err => console.error("Database Error:", err));

app.post('/api/support', async (req, res) => {
    const { email, message } = req.body;
    try {
        await bot.sendMessage(myChatId, `📩 নতুন মেসেজ!\nইউজার: ${email}\nবার্তা: ${message}`);
        res.json({ message: "মেসেজ পাঠানো হয়েছে!" });
    } catch (error) {
        res.status(500).json({ message: "মেসেজ পাঠাতে সমস্যা হয়েছে" });
    }
});

// আপলোড রাউট - Cloudinary এর পাথ ব্যবহার করা হয়েছে
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "ফাইল পাওয়া যায়নি" });
    
    const userEmail = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const fileUrl = req.file.path; // এটি এখন ক্লাউডিনারি লিংক

    try {
        const result = await User.updateOne(
            { email: userEmail }, 
            { $push: { files: { filename: req.file.originalname, path: fileUrl } } }
        );
        
        if (result.matchedCount > 0) {
            res.json({ message: "আপলোড সফল!" });
        } else {
            res.status(404).json({ message: `ইউজার খুঁজে পাওয়া যায়নি: ${userEmail}` });
        }
    } catch (err) {
        res.status(500).json({ message: "ডাটাবেসে সেভ করতে সমস্যা হয়েছে" });
    }
});

// ডাউনলোড রাউট (আপডেট করা হয়েছে যাতে ক্লাউড লিংক থেকে ফাইল খোলে)
app.get('/api/download/:filename', async (req, res) => {
    try {
        const user = await User.findOne({ "files.filename": req.params.filename });
        if (!user) return res.status(404).send("ফাইলটি নেই");
        const file = user.files.find(f => f.filename === req.params.filename);
        // যদি এটি ক্লাউড লিঙ্ক হয়, তবে রিডাইরেক্ট করবে
        if (file.path.startsWith('http')) {
            res.redirect(file.path);
        } else {
            res.download(path.join(__dirname, file.path));
        }
    } catch (err) {
        res.status(500).send("ডাউনলোড এরর");
    }
});

// ডিলিট রাউট
app.delete('/api/delete/:filename', async (req, res) => {
    try {
        const user = await User.findOne({ "files.filename": req.params.filename });
        if (user) {
            const file = user.files.find(f => f.filename === req.params.filename);
            // লোকাল ফাইল থাকলে ডিলিট করবে, না থাকলে ক্লাউড লিংক ইগনোর করবে
            if (file && !file.path.startsWith('http') && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            await User.updateOne({ email: user.email }, { $pull: { files: { filename: req.params.filename } } });
            res.json({ message: "মুছে ফেলা হয়েছে" });
        } else {
            res.status(404).json({ message: "ফাইলটি খুঁজে পাওয়া যায়নি" });
        }
    } catch (err) {
        res.status(500).json({ message: "ডিলিট করতে সমস্যা হয়েছে" });
    }
});

app.post('/api/files', async (req, res) => {
    const userEmail = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: userEmail });
    res.json({ files: user ? user.files : [] });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
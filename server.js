
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const TelegramBot = require('node-telegram-bot-api');
const User = require('./User');

const app = express();

// Cloudinary কনফিগারেশন (আপনার রেন্ডার ENV থেকে সেট করা আছে)
cloudinary.config(); 

// লোকাল ফোল্ডার ব্যবহারের বদলে Cloudinary ব্যবহার করুন
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

// সাপোর্ট রাউট
app.post('/api/support', async (req, res) => {
    const { email, message } = req.body;
    try {
        await bot.sendMessage(myChatId, `📩 নতুন মেসেজ!\nইউজার: ${email}\nবার্তা: ${message}`);
        res.json({ message: "মেসেজ পাঠানো হয়েছে!" });
    } catch (error) {
        res.status(500).json({ message: "মেসেজ পাঠাতে সমস্যা হয়েছে" });
    }
});

// আপলোড রাউট - Cloudinary ব্যবহার
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "ফাইল পাওয়া যায়নি" });
    
    const userEmail = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const fileUrl = req.file.path; 

    try {
        await User.updateOne(
            { email: userEmail }, 
            { $push: { files: { filename: req.file.originalname, path: fileUrl } } }
        );
        res.json({ message: "আপলোড সফল!" });
    } catch (err) {
        res.status(500).json({ message: "ডাটাবেসে সেভ করতে সমস্যা হয়েছে" });
    }
});

// ডাউনলোড রাউট
app.get('/api/download/:filename', async (req, res) => {
    try {
        const user = await User.findOne({ "files.filename": req.params.filename });
        if (!user) return res.status(404).send("ফাইলটি নেই");
        const file = user.files.find(f => f.filename === req.params.filename);
        res.redirect(file.path); // সরাসরি ক্লাউড লিঙ্ক থেকে রিডাইরেক্ট করবে
    } catch (err) {
        res.status(500).send("ডাউনলোড এরর");
    }
});

// ডিলিট রাউট (লোকাল চেক বাদ দেওয়া হয়েছে)
app.delete('/api/delete/:filename', async (req, res) => {
    try {
        await User.updateOne({ "files.filename": req.params.filename }, { $pull: { files: { filename: req.params.filename } } });
        res.json({ message: "মুছে ফেলা হয়েছে" });
    } catch (err) {
        res.status(500).json({ message: "ডিলিট করতে সমস্যা হয়েছে" });
    }
});

app.post('/api/files', async (req, res) => {
    const userEmail = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: userEmail });
    res.json({ files: user ? user.files : [] });
});

// পোর্ট বাইন্ডিং ঠিক করা হয়েছে
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

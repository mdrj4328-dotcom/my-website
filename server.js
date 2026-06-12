const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api'); // নতুন লাইব্রেরি যোগ হয়েছে
const User = require('./User');

const app = express();
const upload = multer({ dest: 'uploads/' });

// টেলিগ্রাম বট কনফিগারেশন
const token = '8528728150:AAFgQR0EQH-dyK4DjHyivk3gNri9H7uyO_I';
const bot = new TelegramBot(token, {polling: true});
const myChatId = '8748825027';

app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

// সাপোর্ট ও নোটিফিকেশন রাউট (টেলিগ্রামে মেসেজ পাঠাবে)
app.post('/api/support', async (req, res) => {
    const { email, message } = req.body;
    try {
        await bot.sendMessage(myChatId, `📩 নতুন মেসেজ!\nইউজার: ${email}\nবার্তা: ${message}`);
        res.json({ message: "মেসেজ পাঠানো হয়েছে!" });
    } catch (error) {
        res.status(500).json({ message: "মেসেজ পাঠাতে সমস্যা হয়েছে" });
    }
});

// আপলোড রাউট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "ফাইল পাওয়া যায়নি" });
    await User.updateOne({ email: req.body.email }, { 
        $push: { files: { filename: req.file.originalname, path: req.file.path } } 
    });
    res.json({ message: "আপলোড সফল!" });
});

// ডাউনলোড রাউট
app.get('/api/download/:filename', async (req, res) => {
    const user = await User.findOne({ "files.filename": req.params.filename });
    if (!user) return res.status(404).send("ফাইলটি নেই");
    const file = user.files.find(f => f.filename === req.params.filename);
    res.download(path.join(__dirname, file.path));
});

// ডিলিট রাউট (ডাটাবেস এবং ফোল্ডার থেকে ফাইল ডিলিট করবে)
app.delete('/api/delete/:filename', async (req, res) => {
    const user = await User.findOne({ "files.filename": req.params.filename });
    if (user) {
        const file = user.files.find(f => f.filename === req.params.filename);
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        await User.updateOne({ email: user.email }, { $pull: { files: { filename: req.params.filename } } });
        res.json({ message: "মুছে ফেলা হয়েছে" });
    } else {
        res.status(404).json({ message: "ফাইলটি খুঁজে পাওয়া যায়নি" });
    }
});

app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? user.files : [] });
});

app.listen(process.env.PORT || 10000);
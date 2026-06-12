const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('./User');

const app = express();

// Cloudinary কনফিগারেশন
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

// আপলোড রাউট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "ফাইল পাওয়া যায়নি" });
    const userEmail = req.body.email ? req.body.email.trim().toLowerCase() : "";

    try {
        await User.updateOne(
            { email: userEmail }, 
            { $push: { files: { filename: req.file.originalname, path: req.file.path } } }
        );
        res.json({ message: "আপলোড সফল!" });
    } catch (err) {
        res.status(500).json({ message: "ডাটাবেসে সেভ করতে সমস্যা হয়েছে" });
    }
});

// ডাউনলোড রাউট
app.get('/api/download/:filename', async (req, res) => {
    const user = await User.findOne({ "files.filename": req.params.filename });
    if (!user) return res.status(404).send("ফাইলটি নেই");
    const file = user.files.find(f => f.filename === req.params.filename);
    res.redirect(file.path);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

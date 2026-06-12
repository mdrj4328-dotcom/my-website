const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./User');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://mdsamirkhan023_db_user:Samir4876@cluster0.lwxljcc.mongodb.net/?appName=Cluster0");

// আপলোড রাউট
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "ফাইল পাওয়া যায়নি" });
    await User.updateOne({ email: req.body.email }, { 
        $push: { files: { filename: req.file.originalname, path: req.file.path } } 
    });
    res.json({ message: "আপলোড সফল!" });
});

// ডাউনলোড রাউট (এখানেই আপনার সমস্যা ছিল, এখন ঠিক হবে)
app.get('/api/download/:filename', async (req, res) => {
    const user = await User.findOne({ "files.filename": req.params.filename });
    if (!user) return res.status(404).send("ফাইলটি নেই");
    const file = user.files.find(f => f.filename === req.params.filename);
    res.download(path.join(__dirname, file.path));
});

// ডিলিট রাউট
app.delete('/api/delete/:filename', async (req, res) => {
    await User.updateOne({}, { $pull: { files: { filename: req.params.filename } } });
    res.json({ message: "মুছে ফেলা হয়েছে" });
});

app.post('/api/files', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    res.json({ files: user ? user.files : [] });
});

app.listen(process.env.PORT || 10000);
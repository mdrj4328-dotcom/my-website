
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');
const app = express();

mongoose.set('strictQuery', false);
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("ডাটাবেজ কানেক্টেড!"))
  .catch(err => console.error("ডাটাবেজ এরর:", err));

// আগের রেজিস্ট্রেশন, লগইন এবং ফরগেট-পাসওয়ার্ড রুটগুলো এখানে থাকবে...

// নতুন ফাইল আপলোড রুট (যেখানে ড্যাশবোর্ড থেকে ফাইল আসবে)
app.post('/upload', async (req, res) => {
    try {
        // এখানে ফাইল সংরক্ষণের লজিক আসবে
        res.status(200).json({ message: "ফাইল আপলোড হয়েছে!" });
    } catch (e) { res.status(500).json({ error: "সার্ভারে সমস্যা!" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`সার্ভার সফলভাবে ${PORT} পোর্টে চলছে...`);
});
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// আপলোড ফোল্ডার না থাকলে তৈরি করবে
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // ছবি, ভিডিও এবং অডিও সব টাইপ অ্যালাউ করা হলো
        const filetypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|mp3|wav|m4a/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('ভুল ফাইল ফরম্যাট! কেবল ছবি, ভিডিও এবং অডিও ফাইল আপলোড করা যাবে।'));
        }
    }
});

module.exports = upload;
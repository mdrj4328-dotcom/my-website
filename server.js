app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ইনপুট ভ্যালিডেশন চেক
        if (!username || !email || !password) {
            return res.status(400).json({ error: "সবগুলো ফিল্ড পূরণ করা আবশ্যক!" });
        }
        
        // ১. চেক করা ইউজার আগে থেকেই আছে কিনা
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে!" });
        }

        // ২. নতুন ইউজার তৈরি (bcrypt দিয়ে পাসওয়ার্ড হ্যাস করে)
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            username, 
            email, 
            password: hashedPassword 
        });

        await newUser.save();
        res.status(201).json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!" });
    } catch (e) { 
        console.error("রেজিস্ট্রেশন এরর:", e);
        res.status(500).json({ error: "সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করুন।" }); 
    }
});
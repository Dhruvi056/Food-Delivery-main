import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/food-delivery-main';

mongoose.connect(uri)
    .then(async () => {
        const db = mongoose.connection;
        const adminUser = await db.collection('users').findOne({ role: 'admin' });

        if (adminUser) {
            console.log("=== ADMIN CREDENTIALS FOUND ===");
            console.log("Email:", adminUser.email);
            console.log("Password Hash:", adminUser.password);
            console.log("===============================");
        } else {
            console.log("No user with role 'admin' was found in the database.");
        }
        process.exit(0);
    })
    .catch((err) => {
        console.error("Database Connection Error:", err);
        process.exit(1);
    });

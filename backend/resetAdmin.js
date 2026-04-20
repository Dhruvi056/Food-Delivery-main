import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const uri = 'mongodb://127.0.0.1:27017/food-delivery-main';

mongoose.connect(uri)
    .then(async () => {
        const db = mongoose.connection;
        const usersCollection = db.collection('users');

        // Hash the new password "admin123"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        // Find and update the admin user
        const result = await usersCollection.updateOne(
            { email: 'admin@gmail.com' },
            {
                $set: {
                    password: hashedPassword,
                    role: 'admin' // Ensure role is definitely admin
                }
            },
            { upsert: true } // If they accidentally deleted the admin, this will recreate it
        );

        console.log("=== STATUS ===");
        if (result.modifiedCount > 0) {
            console.log("SUCCESS: The password for admin@gmail.com was successfully reset to: admin123");
        } else if (result.upsertedCount > 0) {
            console.log("SUCCESS: A new admin account was created with email admin@gmail.com and password: admin123");
        } else {
            console.log("The password was already set to this, or no changes were made.");
        }

        process.exit(0);
    })
    .catch((err) => {
        console.error("Database Connection Error:", err);
        process.exit(1);
    });

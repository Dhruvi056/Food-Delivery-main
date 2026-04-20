import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import userModel from "./models/userModel.js";

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/food-delivery-main';

const resetAdmin = async () => {
    try {
        await mongoose.connect(mongoUrl);
        console.log("DB Connected");

        const email = "admin@gmail.com";
        const newPassword = "adminpassword123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        let user = await userModel.findOne({ email });

        if (user) {
            user.password = hashedPassword;
            user.role = "admin"; // Ensure they have admin privileges
            await user.save();
            console.log(`Password reset for ${email}. New password: ${newPassword}`);
        } else {
            user = new userModel({
                name: "Admin",
                email: email,
                password: hashedPassword,
                role: "admin",
            });
            await user.save();
            console.log(`User ${email} created with password: ${newPassword}`);
        }
    } catch (error) {
        console.log("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

resetAdmin();

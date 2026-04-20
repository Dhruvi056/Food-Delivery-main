import jwt from "jsonwebtoken";
import "dotenv/config";
import userModel from "./models/userModel.js";
import { connectDB } from "./config/db.js";

async function getToken() {
    await connectDB();
    const user = await userModel.findOne({ email: "demo@gmail.com" });
    if (user) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("TEST_TOKEN=" + token);
        console.log("TEST_USER_ID=" + user._id);
    } else {
        console.log("User not found");
    }
    process.exit();
}

getToken();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import userModel from "./models/userModel.js";

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/food-delivery-main";

const createOrUpdateRider = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("DB Connected");

    const email = "rider@gmail.com";
    const password = "rider123";
    const name = "Test Rider";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await userModel.findOne({ email });

    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.role = "rider";
      user.riderStatus = true;
      await user.save();
      console.log(`Rider updated: ${email} / ${password}`);
    } else {
      user = new userModel({
        name,
        email,
        password: hashedPassword,
        role: "rider",
        riderStatus: true,
      });
      await user.save();
      console.log(`Rider created: ${email} / ${password}`);
    }
  } catch (error) {
    console.error("Error creating rider:", error);
  } finally {
    await mongoose.connection.close();
  }
};

createOrUpdateRider();

const mongoose = require('mongoose');

// Connect to MongoDB natively
mongoose.connect('mongodb+srv://rajanmanav40:11223344@cluster0.rtm39.mongodb.net/food-del')
    .then(async () => {
        // We can reach out directly to the database collection instead of importing ES models natively to bypass the ESM issue in CJS
        const db = mongoose.connection;
        const admin = await db.collection('users').findOne({ role: 'admin' });
        console.log("Found Admin Details:", admin);
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });

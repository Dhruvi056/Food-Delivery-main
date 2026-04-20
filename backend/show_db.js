const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://fooddel:fooddel@cluster0.hitrjng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function showDb() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('\n--- MongoDB Collections ---');
        for (let c of collections) {
            const name = c.name;
            const count = await db.collection(name).countDocuments();
            console.log(`- ${name} (${count} documents)`);
        }

        console.log('\n--- Sample Data ---');
        for (let c of collections) {
            const name = c.name;
            if (name !== 'system.indexes') {
                const sample = await db.collection(name).find({}).limit(1).toArray();
                if (sample && sample.length > 0) {
                    console.log(`\n📦 Sample from '${name}':`);
                    console.log(JSON.stringify(sample[0], null, 2));
                } else {
                    console.log(`\n📦 Sample from '${name}': Collection is empty.`);
                }
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

showDb();

import redisClient, { connectRedis } from './utils/redisClient.js';

const flush = async () => {
    try {
        await connectRedis();
        console.log("Connected to redis");
        await redisClient.del("all_foods");
        console.log("Successfully deleted all_foods from cache");
    } catch(e) {
        console.log(e);
    }
    process.exit();
}
flush();

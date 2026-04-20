import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: false
    }
});

redisClient.on("error", (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.log("⚠️  Redis is not running. Caching will be disabled.");
    } else {
        console.log("Redis Client Error", err);
    }
});

redisClient.on("connect", () => {
    console.log("Redis Connected Successfully!");
});

// Since we are moving to production, we need to ensure the client connects when the server starts.
export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error("Failed to connect to Redis during startup", err);
    }
};

export default redisClient;

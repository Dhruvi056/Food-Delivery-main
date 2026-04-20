import redisClient from "./utils/redisClient.js";

const clearCache = async () => {
  try {
    await redisClient.connect();
    await redisClient.del("all_foods");
    console.log("Cache cleared!");
  } catch (e) {
    console.log("Error:", e);
  } finally {
    process.exit();
  }
};

clearCache();

import * as redis from "redis";
import { RedisClientType } from "redis";

const userPostsRedisClient: RedisClientType = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379/0",
  legacyMode: true,
});
userPostsRedisClient.connect().then().catch(console.error);

export const userPostsCache = userPostsRedisClient.v4;

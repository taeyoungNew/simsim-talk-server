import * as redis from "redis";
import { RedisClientType } from "redis";

const postRedisClient: RedisClientType = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379/0",
  legacyMode: true,
});
postRedisClient.connect().then().catch(console.error);

export const postCache = postRedisClient.v4;

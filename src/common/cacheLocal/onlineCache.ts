import * as redis from "redis";
import { RedisClientType } from "redis";

const onlineRedisClient: RedisClientType = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379/0",
  legacyMode: true,
});
onlineRedisClient.connect().then().catch(console.error);
export const onlineCache = onlineRedisClient.v4;

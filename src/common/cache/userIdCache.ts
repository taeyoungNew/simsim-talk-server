import * as redis from "redis";
import { RedisClientType } from "redis";

const userRedisClient: RedisClientType = redis.createClient({
  url: `redis://${process.env.REDIS_NAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: true,
});
userRedisClient.on("connect", () => {
  console.info("Redis connected!");
});
userRedisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});
userRedisClient.connect().then(); // redis v4 연결 (비동기)
export const userCache = userRedisClient.v4;

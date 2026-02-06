import * as redis from "redis";
import { RedisClientType } from "redis";
// import dotenv from "dotenv";

// 그냥 스크립트에서 dotenv에 접근을 하려면 아래의 dotenv.config를 실행시켜야함
// dotenv.config();

const userRedisClient: RedisClientType = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379/0",
  legacyMode: true,
});
userRedisClient.on("connect", () => {
  console.info("Redis connected!");
});
userRedisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});
userRedisClient.connect().then().catch(console.error); // redis v4 연결 (비동기)
export const userCache = userRedisClient.v4;

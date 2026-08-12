import { elasticClient } from "../config/elasticClient";
import { initPostIndex } from "./documents/postDocument";

export const connectElastic = async () => {
  try {
    // 핑/헬스 체크
    const health = await elasticClient.cluster.health();
    console.log("🟢 ElasticSearch Connected! Cluster status:", health.status);

    await initPostIndex();
  } catch (error) {
    console.error("🔴 ElasticSearch Connection Failed:", error);
  }
};

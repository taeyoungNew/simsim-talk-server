import { elasticClient } from "../config/elasticClient";

export const connectElastic = async () => {
  try {
    const health = await elasticClient.cluster.health();
    console.log("🟢 ElasticSearch Connected! Cluster status:", health.status);
  } catch (error) {
    console.error("🔴 ElasticSearch Connection Failed:", error);
  }
};

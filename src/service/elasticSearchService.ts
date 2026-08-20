import logger from "../config/logger";
import { searchPostsDocument } from "../elasticsearch/documents/postDocument";

class ElasticSearchService {
  public globalSearch = async (keyword: string) => {
    logger.info("", {
      method: "get",
      layer: "Service",
      className: "ElasticSearchService",
      functionName: "globalSearch",
    });
    try {
      const [posts] = await Promise.all([searchPostsDocument(keyword)]);

      return {
        posts,
      };
    } catch (error) {
      throw error;
    }
  };
}

export default ElasticSearchService;

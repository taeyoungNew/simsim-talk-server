import { elasticClient } from "../config/elasticClient";
import logger from "../config/logger";

const POST_INDEX_NAME = "simsimtalk_posts";

class ElasticSearchRepository {
  public searchPosts = async (keyword: string) => {
    const result = await elasticClient.search({
      index: POST_INDEX_NAME,
      query: {
        match: {
          content: keyword,
        },
      },
    });

    return result.hits.hits.map((hit) => hit._source);
  };

  public searchUsers = (keyword: string) => {};
}

export default ElasticSearchRepository;

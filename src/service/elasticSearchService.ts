import logger from "../config/logger";
import ElasticSearchRepository from "../repositories/elasticSearchRepository";

class ElasticSearchService {
  private elasticSearchRepository = new ElasticSearchRepository();
  public searchMainPage = async (keyword: string) => {
    logger.info("", {
      method: "post",
      url: "api/comment/:postId",
      layer: "Handlers",
      className: "CommentHandler",
      functionName: "createComent",
    });
    try {
      const [posts, users] = await Promise.all([
        this.elasticSearchRepository.searchPosts(keyword),
        this.elasticSearchRepository.searchUsers(keyword),
      ]);

      return {
        posts,
        users,
      };
    } catch (error) {
      throw error;
    }
  };
}

export default ElasticSearchService;

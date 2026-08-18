import logger from "../config/logger";
import { searchPostsDocument } from "../elasticsearch/documents/postDocument";

class ElasticSearchService {
  public searchMainPage = async (keyword: string) => {
    logger.info("", {
      method: "post",
      url: "api/comment/:postId",
      layer: "Handlers",
      className: "CommentHandler",
      functionName: "createComent",
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

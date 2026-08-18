import { Response, Request, RequestHandler, NextFunction } from "express";
import ElasticSearchService from "../service/elasticSearchService";
import logger from "../config/logger";

class ElasticSearchHandler {
  private elasticSearchService = new ElasticSearchService();
  public searchMainPage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "post",
      url: "api/comment/:postId",
      layer: "Handlers",
      className: "CommentHandler",
      functionName: "createComent",
    });
    try {
      const keyword = req.query.keyword;
      const searchResult = await this.elasticSearchService.searchMainPage(
        String(keyword),
      );

      return res.status(200).json({ data: searchResult });
    } catch (error) {
      next(error);
    }
  };
}

export default ElasticSearchHandler;

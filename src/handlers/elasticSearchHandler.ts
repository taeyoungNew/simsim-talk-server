import { Response, Request, RequestHandler, NextFunction } from "express";
import logger from "../config/logger";

class ElasticSearchHandler {
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
    } catch (error) {
      next(error);
    }
  };
}

export default ElasticSearchHandler;

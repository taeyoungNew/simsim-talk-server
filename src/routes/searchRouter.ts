import { Router } from "express";
import ElasticSearchHandler from "../handlers/elasticSearchHandler";

const elasticSearchRouter = Router();
const elasticSearchHandler = new ElasticSearchHandler();

// 메인페이지에서 검색
elasticSearchRouter.get(
  "/search-mainpage?keyword=:",
  elasticSearchHandler.searchMainPage,
);

export default elasticSearchRouter;

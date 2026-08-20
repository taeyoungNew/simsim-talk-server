import { Router } from "express";
import ElasticSearchHandler from "../handlers/elasticSearchHandler";

const elasticSearchRouter = Router();
const elasticSearchHandler = new ElasticSearchHandler();

// 메인페이지에서 검색
elasticSearchRouter.get("/global-search", elasticSearchHandler.globalSearch);

export default elasticSearchRouter;

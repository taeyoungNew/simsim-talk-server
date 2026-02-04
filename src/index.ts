"use strict";
import express from "express";
import router from "./routes/index";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cacheConnetion from "./common/cacheLocal/index";
import morganMiddleware from "./middlewares/morgan";
import logger from "./config/logger";
import morgan from "morgan";
import { json } from "express";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import cors from "cors";
import http from "http";
import { setupSocket } from "./sockets/socket.index";

import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", router);

// 모든 곳에서 발생하는 에러를 catch
app.use(cacheConnetion);
app.use(
  morgan("combined", {
    skip: function (req, res) {
      return res.statusCode < 400;
    },
  }),
);
app.use(morganMiddleware);

app.all(/(.*)/, (req, res) => {
  res
    .status(404)
    .json({ errorCode: "COMMON_NOT_FOUND", message: "잘못된 경로입니다. " });
});
app.use(errorHandler);

const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  logger.info("심심톡 실행 PORT: ${PORT}");
});

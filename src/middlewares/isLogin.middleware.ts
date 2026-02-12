import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";

// 로그인을 이미 하고이는지 확인하는 미들웨어
// 되어있으면 에러반환
// 어차피 로그인한 상태에서 로그인을  다시하려고 할때 거르는 용도로만 쓰일것임

export const isLoginMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("req.cookies.authorization = ", req.cookies.authorization);

    if (req.cookies.authorization !== undefined) {
      logger.error("현재 로그인상태입니다.", {
        method: "post",
        url: "/api/auth",
        status: 402,
      });
      throw new CustomError(
        errorCodes.AUTH.BAD_REQUEST.status,
        errorCodes.AUTH.BAD_REQUEST.code,
        "현재 로그인상태입니다. ",
      );
    }

    next();
  } catch (error) {
    throw error;
  }
};

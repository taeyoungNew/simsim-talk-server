import { Request, Response, NextFunction } from "express";
import { checkAuth } from "../middlewares/common/checkAuth";
import { tokenType } from "../types/tokenType";
import { accessToken } from "../middlewares/common/accToken";
import { userCache } from "../common/cacheLocal/userIdCache";
import logger from "../config/logger";
import verifyAccToken from "./common/varifyAccToken";
import UserRepository from "../repositories/usersRepository";
import verifyRefToken from "./common/varifyRefToken";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
import * as cookie from "cookie";

/**
 * @param req
 * @param res
 * @param next
 *
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userRepository = new UserRepository();
  try {
    logger.info("", {
      layer: "middleware",
      functionName: "authMiddleware",
    });
    const { authorization } = req.cookies;

    // 1. 토큰이 아예 없는 경우 -> 비로그인 유저로 간주하고 통과
    if (!authorization) {
      res.locals.userInfo = null;
      return next();
    }
    let tokenType, token;

    [tokenType, token] = authorization.split(" ");

    checkAuth(authorization, tokenType, token);

    const accTokenPayment: tokenType = {
      token: token,
      type: "accToken",
    };

    // acctoken이 유효한지 확인
    const decodeAccToken = verifyAccToken(accTokenPayment);

    if (typeof decodeAccToken === "string" && decodeAccToken === "jwt exired") {
      logger.warn("acc토큰이 만료", {
        layer: "middleware",
        functionName: "authMiddleware",
      });
      // accToken이 만료되었을경우
      //  -> 유효하지않으면 reftoken을 확인

      // 캐시에 저장된 userId를 가져온다
      const cacheUserInfo = await userCache.get(`token:${token}`);
      const cacheUserInfoParse = JSON.parse(cacheUserInfo);

      if (cacheUserInfoParse == null) {
        logger.warn("redis의 userId가 null", {
          layer: "middleware",
          functionName: "authMiddleware",
        });
        res.clearCookie("authorization");

        throw new CustomError(
          errorCodes.AUTH.TOKEN_EXPIRED.status,
          errorCodes.AUTH.TOKEN_EXPIRED.code,
          "다시 로그인 해주십시오.",
        );
      }

      // DB에 저장된 유저의 refToken을 가져온다.
      const dbRefToken = await userRepository.getRefToken(
        cacheUserInfoParse.id,
      );

      // 유저테이블의 refToken을 확인하고
      const refTokenPayment: tokenType = {
        token: dbRefToken,
        type: "refToken",
      };

      const decodeRefToken = verifyRefToken(refTokenPayment);
      // refToken이 만료되었을 경우
      if (
        typeof decodeRefToken === "string" &&
        decodeRefToken === "jwt exired"
      ) {
        // 리플레쉬토큰까지 만료가되었을 시 캐시의 정보도 같이 지워준다.
        logger.error("토큰이 만료되어 다시 로그인해주십시오.", {
          layer: "middleware",
          functionName: "authMiddleware",
        });

        await userCache.del(`token:${token}`);
        res.clearCookie("authorization");
        // 다시 로그인하라고 에러
        throw new CustomError(
          errorCodes.AUTH.TOKEN_EXPIRED.status,
          errorCodes.AUTH.TOKEN_EXPIRED.code,
          "토큰이 만료되어 다시 로그인해주십시오.",
        );
      } else {
        // refToken이 유효할경우 user정보를 가져와서
        // accToken을 재발급하고
        const cacheUserInfo = await userCache.get(`token:${token}`);
        const cacheUserInfoParse = JSON.parse(cacheUserInfo);

        const userInfo = await userRepository.findById(
          cacheUserInfoParse.id, // json.stringfy로 저장을 했기때문에 이렇게 한번 큰따옴표와 \를 없애야한다.
        );

        logger.info("acc토큰재발급", {
          layer: "middleware",
          functionName: "authMiddleware",
        });
        // 새로운 acc토큰을 발급받고
        const newAccToken = accessToken(userInfo.id, userInfo.email);

        // res.locals로 다음 모듈에 유저의 정보들을 넘겨준다.
        res.locals.userInfo = {
          userId: userInfo.id,
          email: userInfo.email,
          token: newAccToken,
        };
        const newSetUserInfo = {
          id: userInfo.id,
          email: userInfo.email,
          userNickname: userInfo.UserInfo.nickname,
        };

        await userCache.del(`token:${token}`);
        await userCache.set(
          `token:${newAccToken}`,
          JSON.stringify(newSetUserInfo),
        );

        res.cookie("authorization", `Bearer ${newAccToken}`, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 1000 * 60 * 30,
          expires: new Date(Date.now() + 1000 * 60 * 30),
        });
        next();
      }
    } else {
      // 만료가 안되었을 경우
      if (typeof decodeAccToken === "object") {
        // 다음 모듈에 유저의 정보를 넘긴다.
        res.locals.userInfo = decodeAccToken;
        next();
      }
    }
    // -> reftoken도 유효하지않으면 로그인하라는 에러와 함께 로그인화면으로 go
    // -> 유효하면 인가를 받음
  } catch (error) {
    next(error);
  }
};

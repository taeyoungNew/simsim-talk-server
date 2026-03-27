import { Response, Request, NextFunction } from "express";
import UserRelationService from "../service/userRelationService";
import logger from "../config/logger";

const userRelationService = new UserRelationService();
class UserRelationHandler {
  public getFriends = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      layer: "Handler",
      className: "UserRelationHandler",
      functionName: "getFriends",
    });
    try {
      const userId = res.locals.userInfo?.userId;

      const result = userId ? await userRelationService.getFriends(userId) : [];

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getFollowings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      layer: "Handler",
      className: "UserRelationHandler",
      functionName: "getFollowings",
    });
    try {
      const userId = res.locals.userInfo?.userId;
      const result = userId
        ? await userRelationService.getFollowings(userId)
        : null;
      let rows = [];
      if (userId) {
        rows = result.map(
          (row: {
            id: number;
            "following.UserInfo.profileUrl": string;
            followingId: string;
            "following.id": string;
            "following.email": string;
            "following.UserInfo.id": number;
            "following.UserInfo.nickname": string;
          }) => {
            return {
              id: row.id,
              followingId: row.followingId,
              profileUrl: row["following.UserInfo.profileUrl"],
              followingEmail: row["following.email"],
              followingNickname: row["following.UserInfo.nickname"],
            };
          },
        );
      }

      return res.status(200).json({ rows });
    } catch (error) {
      next(error);
    }
  };
}

export default UserRelationHandler;

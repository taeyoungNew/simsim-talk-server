import { Response, Request, RequestHandler, NextFunction } from "express";
import BlockUserService from "../service/blockUserService";
import {
  BlockUserDto,
  BlockUserListDto,
  UnBlockUserDto,
} from "../dtos/blockUserDto";
import logger from "../config/logger";
/**
 * ブロッククラス
 *
 */
class BlockUserHandler {
  private blockUserService = new BlockUserService();

  /**
   * ユーザブロックAPI
   *
   * @param req ブロック対象のID
   * @param res 自分のID
   * @param next
   * @returns
   */
  public blockUser = async (
    req: Request<{ blockUserId: string }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      layer: "Handler",
      className: "BlockUserHandler",
      functionName: "blockUser",
    });
    try {
      const userId = res.locals.userInfo.userId;
      const blockUserPayment: BlockUserDto = {
        blockedId: req.params.blockUserId,
        blockerId: userId,
      };

      await this.blockUserService.blockUser(blockUserPayment);

      return res.status(200).send({ message: "해당유저를 차단하였습니다." });
    } catch (error) {
      next(error);
    }
  };

  public unBlockUser = async (
    req: Request<{ unblockedId: string }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        layer: "Handler",
        className: "BlockUserHandler",
        functionName: "unBlockUser",
      });
      const userId = res.locals.userInfo.userId;
      const unBlockUserPayment: UnBlockUserDto = {
        blockedId: req.params.unblockedId,
        blockerId: userId,
      };

      await this.blockUserService.unBLockUser(unBlockUserPayment);

      return res
        .status(200)
        .send({ message: "해당유저의 차단을 해제하였습니다." });
    } catch (error) {
      next(error);
    }
  };

  // public blockUserList = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     logger.info("", {
  //       layer: "Handler",
  //       className: "BlockUserHandler",
  //       functionName: "unBlockUser",
  //     });
  //     const userId = res.locals.userInfo.userId;
  //     const blockUserListPayment: BlockUserListDto = {
  //       userId,
  //     };
  //     const blockedUserList =
  //       await this.blockUserService.blockUserList(blockUserListPayment);
  //     return res.status(200).json({ datas: blockedUserList });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}

export default BlockUserHandler;

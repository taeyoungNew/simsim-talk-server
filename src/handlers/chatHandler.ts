import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import ChatService from "../service/chatService";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
class ChatHandler {
  private chatService = new ChatService();
  public getChatList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "post",
      url: "api/chat/get-chatlist",
      layer: "Handlers",
      className: "ChatHandler",
      functionName: "getChatList",
    });
    try {
      const userId = res.locals.userInfo.userId;
      const result = await this.chatService.getChatList(userId);
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
  public createChatRoom = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "post",
      url: "api/chat/create-chatroom",
      layer: "Handlers",
      className: "ChatHandler",
      functionName: "createChatRoom",
    });
    try {
      const targetUserId = req.body.targetUserId;
      const userId = res.locals.userInfo?.userId;
      if (!userId) {
        throw new CustomError(
          errorCodes.AUTH.UNAUTHORIZED.status,
          errorCodes.AUTH.UNAUTHORIZED.code,
          "현재 로그인하지 않았습니다.",
        );
      }

      const result = await this.chatService.createChatRoom({
        userId,
        targetUserId,
      });
      return res
        .status(200)
        .json({ chatRoomId: result.chatRoomId, isNew: result.isNew });
    } catch (e) {
      next(e);
    }
  };
}

export default ChatHandler;

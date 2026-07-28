import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import ChatService from "../service/chatService";
import BlockUserService from "../service/blockUserService";
class ChatHandler {
  private chatService = new ChatService();
  private blockService = new BlockUserService();
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
      const userId = res.locals.userInfo?.userId;
      const result = userId ? await this.chatService.getChatList(userId) : [];

      const blockChatListFilter = await this.blockService.blockChatListFilter(
        userId,
        { chatList: result },
      );

      console.log("blockChatListFilter = ", blockChatListFilter);

      // console.log("blockChatListFilter = ", blockChatListFilter);

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
      const userId = res.locals.userInfo.userId;

      const result = await this.chatService.createChatRoom({
        userId,
        targetUserId,
      });
      const blockChatRoom = await this.blockService.blockChatRoomFilter(
        userId,
        targetUserId,
        result,
      );
      return res.status(200).json({
        createdAt: blockChatRoom.createdAt,
        targetUserEmail: blockChatRoom.targetUserEmail,
        chatRoomId: blockChatRoom.chatRoomId,
        isNew: blockChatRoom.isNew,
        isBlocked: blockChatRoom.isBlocked,
      });
    } catch (e) {
      next(e);
    }
  };
}

export default ChatHandler;

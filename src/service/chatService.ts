import { ChatChatRoom, CreateChatRoom } from "../dtos/chatDto";
import UserService from "./usersService";
import ChatRepository from "../repositories/chatRepository";
import logger from "../config/logger";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";

class ChatService {
  private userService = new UserService();
  private chatRepository = new ChatRepository();
  public getChatList = async (userId: string) => {
    logger.info("", {
      layer: "Service",
      className: "ChatRoomService",
      functionName: "getChatList",
    });
    try {
      return await this.chatRepository.getChats(userId);
    } catch (error) {
      throw error;
    }
  };
  public createChatRoom = async ({ userId, targetUserId }: CreateChatRoom) => {
    // 먼저 상대방이 현재 존재하는 유저인지 확인
    const targetUserInfo = await this.userService.findUserById(targetUserId);
    await this.isSameUser(userId, targetUserId);
    const pairKey = [userId, targetUserId].sort().join("_");

    let chatRoom = await this.isChatRoom({ pairKey });

    let isNew = false;

    if (!chatRoom) {
      chatRoom = await this.chatRepository.createChatRoom({
        userId,
        targetUserId,
        pairKey,
      });
      isNew = true;
    }

    return {
      createdAt: chatRoom.createdAt,
      targetUserEmail: targetUserInfo.email,
      chatRoomId: chatRoom.id,
      isNew,
    };
  };

  private isChatRoom = async ({ pairKey }: ChatChatRoom) => {
    logger.info("", {
      layer: "Service",
      className: "ChatRoomService",
      functionName: "isChatRoom",
    });
    try {
      const result = await this.chatRepository.checkChatRoom({ pairKey });
      return result;
    } catch (error) {
      throw error;
    }
  };

  private isSameUser = async (userId: string, targetUserId: string) => {
    logger.info("", {
      layer: "Service",
      className: "ChatRoomService",
      functionName: "isSameUser",
    });

    try {
      if (userId === targetUserId)
        throw new CustomError(
          errorCodes.CHATROOM.BAD_REQUEST.status,
          errorCodes.CHATROOM.BAD_REQUEST.code,
          "나 자신과 채팅을 할 수 없습니다.",
        );
    } catch (error) {
      throw error;
    }
  };
}

export default ChatService;

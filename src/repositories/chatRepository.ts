import { CreateChatEntity, chatChatRoomEntity } from "../entity/chatEntity";
import db from "../database/models/index";
import logger from "../config/logger";
import { QueryTypes } from "sequelize";

const { ChatRooms } = db;
class ChatRepository {
  public getChats = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "ChatRepository",
      functionName: "getChats",
    });

    const query = `
      SELECT chatrooms.id AS chatRoomId,
             users.id AS targetUserId,
             users.email AS targetUserEmail,
             userinfos.nickname AS targetUserNickname,
             messages.content AS lastMessagePreview,
             messages.contentType AS lastMessageType,
             messages.createdAt AS lastMessageAt
        FROM ChatRooms chatrooms
        JOIN Users users
          ON users.id = 
        CASE WHEN chatrooms.userAId = :userId
        THEN chatrooms.userBId 
        ELSE chatrooms.userAId
         END
        JOIN UserInfos userinfos
          ON userinfos.userId = users.id
        LEFT JOIN Messages messages
          ON messages.id = (
            SELECT messages2.id
              FROM Messages messages2
             WHERE messages2.chatRoomId = chatrooms.id
             ORDER BY messages2.createdAt DESC
             LIMIT 1
          )
       WHERE chatrooms.userAId = :userId
          OR chatrooms.userBId = :userId
       ORDER BY chatrooms.createdAt DESC;
    `;
    return await db.sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
  };
  public createChatRoom = async ({
    userId,
    targetUserId,
    pairKey,
  }: CreateChatEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "ChatRepository",
      functionName: "createChatRoom",
    });

    return await ChatRooms.create({
      userAId: userId,
      userBId: targetUserId,
      pairKey: pairKey,
    });
  };

  public checkChatRoom = async ({ pairKey }: chatChatRoomEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "ChatRepository",
      functionName: "createChatRoom",
    });

    return await ChatRooms.findOne({
      attributes: ["id"],

      where: {
        pairKey,
      },
    });
  };
}

export default ChatRepository;

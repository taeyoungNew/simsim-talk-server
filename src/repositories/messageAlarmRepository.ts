import { QueryTypes } from "sequelize";
import logger from "../config/logger";
import db from "../database/models/index";
import {
  MarkMessagealarmEntity,
  SaveMsgAlarmEntity,
} from "../entity/messageAlarmEntity";

const { MessageAlarms } = db;

class MessageAlarmsRepository {
  public saveAlarm = async ({
    chatRoomId,
    messageId,
    userId,
  }: SaveMsgAlarmEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "MessageAlarmsRepository",
        functionName: "saveAlarm",
      });
      return await MessageAlarms.create({
        userId,
        chatRoomId,
        messageId,
      });
    } catch (error) {
      throw error;
    }
  };

  public findAlarmById = async (userId: string, alarmId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "MessagealarmRepository",
      functionName: "findAlarmById",
    });
    return await db.sequelize.query(
      `
      SELECT msgAlarm.id, 
             msg.chatRoomId,
             msg.senderId,
             userInfo.profileUrl AS profileUrl,
             userInfo.backgroundUrl AS backgroundUrl,
             userInfo.nickname AS senderNickname,
             msg.content,
             msg.contentType,
             msg.id AS messageId,
             msgAlarm.createdAt
        FROM MessageAlarms AS msgAlarm
        JOIN Messages AS msg
          ON msg.id = msgAlarm.messageId
        JOIN Users AS users
          ON users.id = msg.senderId
        JOIN UserInfos AS userInfo
          ON users.id = userInfo.userId
       WHERE msgAlarm.userId = :userId
         AND msgAlarm.isRead = 0
         AND msgAlarm.id = :alarmId
      
      `,
      {
        replacements: { userId, alarmId },
        type: QueryTypes.SELECT,
      },
    );
  };

  public findUnreadByUser = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "MessagealarmRepository",
      functionName: "findUnreadByUser",
    });
    return await db.sequelize.query(
      `SELECT msgAlarm.id, 
             msg.chatRoomId,
             msg.senderId,
             userInfo.nickname AS senderNickname,
             msg.content,
             msg.contentType,
             msg.id AS messageId,
             msgAlarm.createdAt
        FROM MessageAlarms AS msgAlarm
        JOIN Messages AS msg
          ON msg.id = msgAlarm.messageId
        JOIN Users AS users
          ON users.id = msg.senderId
        JOIN UserInfos AS userInfo
          ON users.id = userInfo.userId
        WHERE msgAlarm.userId = :userId
          AND msgAlarm.isRead = 0
        ORDER BY msgAlarm.createdAt ASC`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      },
    );
  };

  public markMessageAlarms = async ({
    chatRoomId,
    userId,
  }: MarkMessagealarmEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "MessageAlarmsRepository",
        functionName: "markMessagealarms",
      });
      await MessageAlarms.update(
        { isRead: true },
        {
          where: {
            userId,
            chatRoomId,
            isRead: false,
          },
        },
      );
    } catch (error) {
      throw error;
    }
  };
}

export default MessageAlarmsRepository;

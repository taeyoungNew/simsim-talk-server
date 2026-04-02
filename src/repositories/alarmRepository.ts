import db from "../database/models/index";
import logger from "../config/logger";
import { DeleteAlarmEntity, SaveAlarmEntity } from "../entity/alarmEntity";
import { ReadAlarmEntity } from "../entity/alarmsEntity";
import { or, QueryTypes, where } from "sequelize";

const { Alarms } = db;

class AlarmsRepository {
  public saveAlarm = async ({
    senderId,
    targetId,
    targetType,
    alarmType,
    receiverId,
    isRead,
  }: SaveAlarmEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "AlarmsRepository",
      functionName: "saveAlarm",
    });

    return await Alarms.create({
      senderId,
      receiverId,
      alarmType,
      targetId,
      targetType,
      isRead,
    });
  };
  public readAlarm = async ({ alarmId, userId }: ReadAlarmEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "AlarmsRepository",
      functionName: "saveAlarm",
    });

    await Alarms.update(
      { isRead: true },
      {
        where: {
          receiverId: userId,
          isRead: false,
          id: alarmId,
        },
      },
    );
  };

  public deleteAlarmsByUser = async ({ userId }: DeleteAlarmEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "AlarmsRepository",
      functionName: "deleteAlarmsByUser",
    });

    await Alarms.destroyAll({
      where: {
        or: [{ senderId: userId }, { receiverId: userId }],
      },
    });
  };

  public getAlarmsByUser = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "AlarmsRepository",
      functionName: "getAlarmsByUser",
    });

    return await db.sequelize.query(
      `
      SELECT alarms.id,
             alarms.senderId,
             alarms.receiverId,
             userInfos.nickname AS senderNickname,
             alarms.targetId,
             alarms.targetType,
             alarms.alarmType,
             alarms.isRead,
             alarms.createdAt
        FROM Alarms AS alarms
        JOIN Users AS users
          ON users.id = alarms.senderId
        JOIN UserInfos AS userInfos
          ON userInfos.userId = users.id
       WHERE alarms.receiverId = :userId
       ORDER BY alarms.createdAt DESC`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      },
    );
  };
}

export default AlarmsRepository;

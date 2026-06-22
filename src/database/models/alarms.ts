"use strict";
import { DataTypes, Model, Sequelize } from "sequelize";

interface AlarmAttributes {
  id: number;
  senderId: string;
  receiveId: string;
  alarmType: number;
  targetId: string;
  isRead: boolean;
}

class alarms extends Model implements AlarmAttributes {
  id: number;
  senderId: string;
  receiveId: string;
  alarmType: number;
  targetId: string;
  isRead: boolean;

  static initModel(sequelize: Sequelize) {
    alarms.init(
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        senderId: { allowNull: false, type: DataTypes.UUID },
        receiverId: { allowNull: false, type: DataTypes.UUID },
        alarmType: {
          allowNull: false,
          type: DataTypes.ENUM("FOLLOW", "LIKE", "COMMENT", "SYSTEM"),
        },
        targetId: { allowNull: false, type: DataTypes.STRING },
        targetType: {
          allowNull: false,
          type: DataTypes.ENUM("USER", "POST", "COMMENT", "SYSTEM"),
        },
        isRead: { allowNull: false, type: DataTypes.BOOLEAN },
      },
      {
        sequelize: sequelize,
        modelName: "Alarms",
      },
    );
    return alarms;
  }
}

export default alarms;

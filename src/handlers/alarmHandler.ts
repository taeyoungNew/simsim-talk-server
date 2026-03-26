import { Response, Request, RequestHandler, NextFunction } from "express";
import logger from "../config/logger";
import AlarmService from "../service/alarmService";
import { ReadAlarmDto } from "../dtos/alarmsDto";
class AlarmHandler {
  private alarmService = new AlarmService();
  public readAlarm = async (
    req: Request<{ alarmId: string }, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "patch",
        url: "api/alarm/:alarmId/read",
        layer: "Handlers",
        className: "AlarmHandler",
        functionName: "readAlarm",
      });
      const userId = res.locals.userInfo.userId;
      const alarmId = req.params.alarmId;

      const payload: ReadAlarmDto = {
        userId,
        alarmId: Number(alarmId),
      };

      await this.alarmService.readAlarm(payload);
      return res.status(200).json({ userId, alarmId });
    } catch (error) {
      next(error);
    }
  };

  public getAlarmsByUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "patch",
        url: "api/alarm/alarms",
        layer: "Handlers",
        className: "AlarmHandler",
        functionName: "getAlarmsByUser",
      });
      const userId = res.locals.userInfo?.userId;

      const result = userId
        ? await this.alarmService.getAlarmsByUser(userId)
        : null;
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default AlarmHandler;

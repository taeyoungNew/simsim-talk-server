import {
  FollowingDto,
  StopFollowingDto,
  GetFollowersDto,
  GetFollowingsDto,
} from "../dtos/followDto";
import logger from "../config/logger";
import FollowRepository from "../repositories/followRepository";
import UserService from "./usersService";
import errorCodes from "../constants/error-codes.json";
import { CustomError } from "../errors/customError";
import { SaveAlarmEntity } from "../entity/alarmEntity";
import { socketGateway } from "../sockets/socket.gateway";
import { SaveAlarmDto } from "../dtos/alarmsDto";
import AlarmsRepository from "../repositories/alarmRepository";

class FollowService {
  private followRepository = new FollowRepository();
  private userService = new UserService();
  private alarmsRepository = new AlarmsRepository();
  // 팔로잉하기
  public following = async (params: FollowingDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "following",
      });
      // 팔로잉하려는 유저가 존재하는지
      const targetUser = await this.userService.findUserById(
        params.followingId,
      );
      await this.isFollowingMe(params.userId, params.followingId);
      // 이미 팔로잉하고있는지
      await this.checkFollowingUser(params);
      const followingResult = await this.followRepository.following(params);
      // isMyPage가 true일경우 팔로잉한 유저의 정보를 리턴
      // isMyPage가 false일경우 내 정보를 리턴
      const getUserInfoId = params.isMyPage
        ? params.followingId
        : params.userId;

      const getFollowingUserInfo =
        await this.userService.findUserById(getUserInfoId);
      const followingUserInfo = {
        id: getFollowingUserInfo.id,
        nickname: getFollowingUserInfo.UserInfo.nickname,
        username: getFollowingUserInfo.UserInfo.username,
        profileUrl: targetUser.UserInfo.profileUrl,
      };
      const alarmPayment: SaveAlarmEntity = {
        senderId: params.userId,
        receiverId: params.followingId,
        alarmType: "FOLLOW",
        targetId: params.followingId,
        targetType: "USER",
        isRead: false,
      };
      const saveAlarmResult =
        await this.alarmsRepository.saveAlarm(alarmPayment);
      const findMyInfosResult = await this.userService.findMyInfos(
        params.userId,
      );
      const alarmData: SaveAlarmDto = {
        id: saveAlarmResult.id,
        senderId: params.userId,
        senderNickname: findMyInfosResult.UserInfo.nickname,
        receiverId: params.followingId,
        alarmType: "FOLLOW",
        targetId: params.followingId,
        targetType: "USER",
        isRead: false,
        createdAt: saveAlarmResult.createdAt,
      };
      socketGateway.sendAlarmToUser(params.followingId, alarmData);
      return followingUserInfo;
    } catch (error) {
      throw error;
    }
  };
  // 팔로잉끊기
  public stopFollowing = async (params: StopFollowingDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "stopFollowing",
      });
      // 팔로잉하려는 유저가 존재하는지
      await this.userService.findUserById(params.followingId);

      await this.checkUnFollowingUser(params);
      await this.followRepository.stopFollowing(params);
      const getUserInfoId = params.isMyPage
        ? params.followingId
        : params.userId;
      const getFollowingUserInfo =
        await this.userService.findUserById(getUserInfoId);
      const followingUserInfo = {
        id: getFollowingUserInfo.id,
        nickname: getFollowingUserInfo.UserInfo.nickname,
        username: getFollowingUserInfo.UserInfo.username,
      };
      return followingUserInfo;
    } catch (e) {
      throw e;
    }
  };
  // 자신이 팔로잉한 유저조회
  public getFollowings = async (param: GetFollowingsDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "getFollowings",
      });
      return await this.followRepository.getFollowings(param);
    } catch (e) {
      throw e;
    }
  };

  // 자신의 팔로워조회
  public getFollowers = async (param: GetFollowersDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "getFollowers",
      });
      return await this.followRepository.getFollowers(param);
    } catch (e) {
      throw e;
    }
  };

  // 상대방을 팔로잉하고있는지 확인
  public checkFollowingUser = async (
    followingId: FollowingDto,
  ): Promise<void> => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "checkFollowingUser",
      });
      const result = await this.followRepository.getFollowing(followingId);
      if (result)
        throw new CustomError(
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.status,
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.code,
          "이미 팔로잉하고있는 유저입니다.",
        );
    } catch (e) {
      throw e;
    }
  };

  // 상대방을 팔로잉
  // 상대방을 팔로잉하고있는지 확인
  public checkUnFollowingUser = async (
    followingId: FollowingDto,
  ): Promise<void> => {
    try {
      logger.info("", {
        layer: "Service",
        className: "FollowService",
        functionName: "checkUnFollowingUser",
      });
      const result = await this.followRepository.getFollowing(followingId);
      if (!result)
        throw new CustomError(
          errorCodes.FOLLOW.BAD_REQUEST.status,
          errorCodes.FOLLOW.BAD_REQUEST.code,
          "팔로잉하고 있지 않습니다.",
        );
    } catch (e) {
      throw e;
    }
  };

  public isFollowingMe = async (myId: string, targetId: string) => {
    try {
      if (myId === targetId) {
        throw new CustomError(
          errorCodes.FOLLOW.BAD_REQUEST.status,
          errorCodes.FOLLOW.BAD_REQUEST.code,
          "자기자신을 팔로잉할수 없습니다.",
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

export default FollowService;

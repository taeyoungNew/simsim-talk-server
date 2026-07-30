import {
  PostLikeDto,
  PostLikeCancelDto,
  PostLikeCntDto,
} from "../dtos/postLikeDto";
import PostLikeRepository from "../repositories/postLikeRepository";
import PostService from "./postService";
import logger from "../config/logger";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
import AlarmsRepository from "../repositories/alarmRepository";
import { SaveAlarmEntity } from "../entity/alarmEntity";
import { socketGateway } from "../sockets/socket.gateway";
import { SaveAlarmDto } from "../dtos/alarmsDto";
import UserService from "./usersService";
import BlockUserService from "./blockUserService";
class PostLikeService {
  private postLikeRepository = new PostLikeRepository();
  private postService = new PostService();
  private alarmsRepository = new AlarmsRepository();
  private userService = new UserService();
  private blockUserService = new BlockUserService();

  // 게시물 좋아요
  public postLike = async (params: PostLikeDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostLikeService",
        functionName: "postLike",
      });
      const result = await this.postService.existPost(params);
      // 해당유저를 차단하고있는지
      const getBlockedIds = await this.blockUserService.getBlockedIds(
        params.userId,
      );
      if (getBlockedIds.has(result.userId)) {
        throw new CustomError(
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.status,
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.code,
          "차단된 유저의 게시물에 좋아요를 누를수 없습니다.",
        );
      }

      await this.checkPostLike(params);
      const likeResult = await this.postLikeRepository.postLike(params);
      const alarmPayment: SaveAlarmEntity = {
        senderId: params.userId,
        receiverId: result.userId,
        alarmType: "LIKE",
        targetId: params.postId,
        targetType: "POST",
        isRead: false,
      };

      const isNotMine = params.userId !== result.userId;

      if (isNotMine) {
        const saveAlarmResult =
          await this.alarmsRepository.saveAlarm(alarmPayment);
        const findMyInfosResult = await this.userService.findMyInfos(
          params.userId,
        );

        const alarmData: SaveAlarmDto = {
          id: saveAlarmResult.id,
          senderId: params.userId,
          senderNickname: findMyInfosResult.UserInfo.nickname,
          receiverId: result.userId,
          alarmType: "LIKE",
          targetId: params.postId,
          targetType: "POST",
          isRead: false,
          createdAt: saveAlarmResult.createdAt,
        };
        socketGateway.sendAlarmToUser(result.userId, alarmData);
      }
    } catch (error) {
      throw error;
    }
  };
  // 게시물 좋아요 취소
  public postLikeCancel = async (params: PostLikeCancelDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostLikeService",
        functionName: "postLikeCancel",
      });
      await this.postService.existPost(params);
      await this.checkPostLikeCencle(params);
      await this.postLikeRepository.postLikeCancel(params);
    } catch (error) {
      throw error;
    }
  };
  // 자신의 게시물들이 받은 좋아요 총 갯수
  public postLikeCnt = async (params: PostLikeCntDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostLikeService",
        functionName: "postLikeCnt",
      });
      const result = await this.postLikeRepository.postLikeCnt(params);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // 게시물을 좋아요 눌렀는지 확인
  public checkPostLike = async (params: PostLikeDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostLikeService",
        functionName: "checkPostLike",
      });
      const result = await this.postLikeRepository.existPostLike(params);
      if (result) {
        throw new CustomError(
          errorCodes.AUTH.USER_ALREADY_EXISTS.status,
          errorCodes.AUTH.USER_ALREADY_EXISTS.code,
          "이미 좋아요를 누른 게시물입니다.",
        );
      }
    } catch (error) {
      throw error;
    }
  };

  // 게시물에 좋아요를 취소한지 체크
  public checkPostLikeCencle = async (params: PostLikeDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostLikeService",
        functionName: "checkPostLikeCencle",
      });
      const result = await this.postLikeRepository.existPostLike(params);

      if (!result) {
        throw new CustomError(
          errorCodes.AUTH.USER_ALREADY_EXISTS.status,
          errorCodes.AUTH.USER_ALREADY_EXISTS.code,
          "이미 좋아요를 취소한 게시물입니다.",
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

export default PostLikeService;

import CommentRepository from "../repositories/commentRepository";
import {
  CreateCommentDto,
  DeleteCommentDto,
  GetCommentDto,
  IsUserCommentDto,
  ModifyCommentDto,
} from "../dtos/commentDto";
import { GetPostDto } from "../dtos/PostDto";
import PostService from "./postService";
import logger from "../config/logger";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
import { SaveAlarmEntity } from "../entity/alarmEntity";
import { socketGateway } from "../sockets/socket.gateway";
import AlarmsRepository from "../repositories/alarmRepository";
import { SaveAlarmDto } from "../dtos/alarmsDto";
import UserService from "./usersService";
import BlockUserService from "./blockUserService";

class CommentService {
  private blockUserService = new BlockUserService();
  private postService = new PostService();
  private alarmsRepository = new AlarmsRepository();
  private commentRepository = new CommentRepository();
  private userService = new UserService();
  // 댓글작성
  public createComment = async (params: CreateCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "createComment",
      });
      // 게시물이 있는지 확인
      const isPost = await this.postService.existPost(params);
      const getBlockedIds = await this.blockUserService.getBlockedIds(
        params.userId,
      );

      if (getBlockedIds.has(isPost.userId)) {
        throw new CustomError(
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.status,
          errorCodes.FOLLOW.FOLLOWING_ALREADY_EXISTS.code,
          "차단된 유저의 게시물에 댓글을 달수없습니다.",
        );
      }

      const commentResult = await this.commentRepository.createComment(params);
      const alarmPayment: SaveAlarmEntity = {
        senderId: params.userId,
        receiverId: isPost.userId,
        alarmType: "COMMENT",
        targetId: params.postId,
        targetType: "COMMENT",
        isRead: false,
      };

      const isNotMine = params.userId !== isPost.userId;
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
          receiverId: isPost.userId,
          alarmType: "COMMENT",
          targetId: params.postId,
          targetType: "COMMENT",
          isRead: false,
          createdAt: saveAlarmResult.createdAt,
        };
        socketGateway.sendAlarmToUser(isPost.userId, alarmData);
      }
      return commentResult;
    } catch (error) {
      throw error;
    }
  };
  // 댓글수정
  public modifyComment = async (params: ModifyCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "modifyComment",
      });
      // 자신의 댓글인지 확인
      await this.isUserComment(params);
      // 댓글이 달린 게시물이 있는지 확인
      const postId: GetPostDto = params;
      await this.postService.existPost(postId);
      // 해당 댓글이 있는지 확인
      await this.existComment(params);
      await this.commentRepository.modifyComment(params);
    } catch (error) {
      throw error;
    }
  };

  // 하나의 댓글불러오기
  public getComment = async (params: GetCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "getComment",
      });
      await this.existComment(params);
      return await this.commentRepository.getComment(params);
    } catch (error) {
      throw error;
    }
  };

  // 댓글삭제
  public deleteComment = async (params: DeleteCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "deleteComment",
      });
      await this.existComment(params);
      // 자신의 댓글인지 확인
      await this.isUserComment(params);
      await this.commentRepository.deleteComment(params);
    } catch (error) {
      throw error;
    }
  };

  // 댓글이 해당유저의 댓글인지 확인하는 모듈
  public isUserComment = async (params: IsUserCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "isUserComment",
      });
      const comment = await this.commentRepository.getComment(params);

      if (comment.userId !== params.userId)
        throw new CustomError(
          errorCodes.COMMENT.FORBIDDEN.status,
          errorCodes.COMMENT.FORBIDDEN.code,
          "자신의 댓글이 아닙니다.",
        );
    } catch (error) {
      throw error;
    }
  };

  // 댓글이 있는지 확인
  public existComment = async (param: GetCommentDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "CommentService",
        functionName: "existComment",
      });
      const result = await this.commentRepository.existComment(param);
      if (!result)
        throw new CustomError(
          errorCodes.COMMENT.NOT_FOUND.status,
          errorCodes.COMMENT.NOT_FOUND.code,
          "해당 댓글이 존재하지 않습니다.",
        );
    } catch (error) {
      throw error;
    }
  };
}

export default CommentService;

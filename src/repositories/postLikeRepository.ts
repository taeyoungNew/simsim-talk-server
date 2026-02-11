import db from "../database/models/index";
import { GetIsLikedPostIdsDto, PostLikeCancelDto } from "../dtos/postLikeDto";
import {
  PostLikeEntity,
  PostLikeCancelEntity,
  PostLikeCntEntity,
} from "../entity/postLikeEntity";
import logger from "../config/logger";
import { GetAllPostDto } from "../dtos/PostDto";
import { log } from "console";

const { PostLikes } = db;
/**
 * 게시물좋아요 리포지토리
 *
 */
class PostLikeRepository {
  // 해당게시물 좋아요
  public postLike = async (params: PostLikeEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "PostLikeRepository",
      functionName: "postLike",
    });
    return await PostLikes.create({
      userId: params.userId,
      postId: params.postId,
    });
  };
  // 해당게시물 좋아요 취소
  public postLikeCancel = async (params: PostLikeCancelEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "PostLikeRepository",
      functionName: "postLikeCancel",
    });
    await PostLikes.destroy({
      where: {
        userId: params.userId,
        postId: params.postId,
      },
    });
  };

  // 자신이 좋아요를 누른 게시물의 id를 가져오기
  public getIsLikedPostIds = async (param: GetIsLikedPostIdsDto) => {
    logger.info("", {
      layer: "Repository",
      className: "PostLikeRepository",
      functionName: "getIsLikedPostIds",
    });
    // log;
    return await PostLikes.findAll({
      attributes: ["postId"],
      where: {
        userId: param,
      },
    });
  };

  // 자신의 게시물들이 받은 좋아요 총 갯수
  public postLikeCnt = async (params: PostLikeCntEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "PostLikeRepository",
      functionName: "postLikeCnt",
    });
    return await PostLikes.findAll({
      attributes: [],
      where: {
        userId: params.userId,
      },
    });
  };

  public existPostLike = async (params: PostLikeEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "PostLikeRepository",
      functionName: "existPostLike",
    });
    return await PostLikes.findOne({
      where: {
        userId: params.userId,
        postId: params.postId,
      },
    });
  };
}

export default PostLikeRepository;

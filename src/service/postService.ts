import PostRepository from "../repositories/postsRepository";
import UserService from "./usersService";
import errorCodes from "../constants/error-codes.json";
import {
  CreatePostDto,
  DeletePostDto,
  GetAllPostDto,
  GetPostDetailDto,
  GetPostDto,
  GetUserPostsDto,
  IsUserPost,
  ModifyPostDto,
} from "../dtos/PostDto";
import logger from "../config/logger";
import PostLikeRepository from "../repositories/postLikeRepository";
import { GetIsLikedPostIdsDto } from "../dtos/postLikeDto";
import { CustomError } from "../errors/customError";
import BlockUserService from "./blockUserService";
class PostService {
  postLikeRepository = new PostLikeRepository();
  postRepository = new PostRepository();
  userService = new UserService();
  blockUserService = new BlockUserService();

  // 자신이 좋아요를 누른 게시물의 id와 isLiked의 리스트 구하기
  public getIsLikedPostIds = async (param: GetIsLikedPostIdsDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "getIsLikedPostIds",
      });
      const isLikedPostIds =
        await this.postLikeRepository.getIsLikedPostIds(param);
      return isLikedPostIds;
    } catch (error) {
      throw error;
    }
  };

  // 게시물작성
  public createPost = async (postInfo: CreatePostDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "createPost",
      });
      const newPost = await this.postRepository.createPost(postInfo);
      const newPostInfo: GetPostDetailDto = {
        postUserId: newPost.userId,
        postId: newPost.id,
        userId: newPost.userId,
      };
      return await this.getPost(newPostInfo);
    } catch (error) {
      throw error;
    }
  };
  // 한 게시물만 조회
  public getPost = async (postInfo: GetPostDetailDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "getPost",
      });

      // 그 게시물이 있는지 확인
      await this.existPost(postInfo);
      const result = await this.postRepository.getPost(postInfo);
      return result;
    } catch (error) {
      throw error;
    }
  };

  public getUserPostIds = async (userId: string) => {
    logger.info("", {
      layer: "Service",
      className: "PostService",
      functionName: "getUserPostIds",
    });
    try {
      // 해당 유저가 있는지 확인?
      await this.userService.findUserById(userId);
      return await this.postRepository.getUserPostIds(userId);
    } catch (error) {
      throw error;
    }
  };

  // 유저가 작성한 게시물들만 조회'
  public getUserPosts = async (postInfo: GetUserPostsDto) => {
    logger.info("", {
      layer: "Service",
      className: "PostService",
      functionName: "getUserPosts",
    });
    try {
      // 해당 유저가 있는지 확인?
      await this.userService.findUserById(postInfo.userId);
      return await this.postRepository.getUserPosts(postInfo);
    } catch (error) {
      throw error;
    }
  };

  // 게시물 수정
  public modifyPost = async (postInfo: ModifyPostDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "modifyPost",
      });
      // 그 게시물이 있는지 확인
      await this.existPost(postInfo);
      await this.isUserPost(postInfo);
      await this.postRepository.modifyPost(postInfo);
    } catch (error) {
      throw error;
    }
  };
  // 게시물 모두조회
  public getAllPosts = async () => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "getAllPosts",
      });

      let result = await this.postRepository.getAllPosts();
      result = result.map(
        (el: { dataValues: { isLiked: number | boolean } }) => {
          el.dataValues.isLiked = el.dataValues.isLiked === 0 ? false : true;
          return el;
        },
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  // 게시물 삭제
  public deletePost = async (param: DeletePostDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "deletePost",
      });
      // 그 게시물이 있는지 확인
      await this.existPost(param);
      // 자신의 게시물인지 확인
      await this.isUserPost(param);

      await this.postRepository.deletePost(param);
    } catch (error) {
      throw error;
    }
  };

  // 게시물이 해당유저의 게시물인지 확인하는 모듈
  public isUserPost = async (param: IsUserPost): Promise<void> => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "isUserPost",
      });
      const post = await this.postRepository.getPost(param);

      if (post.userId !== param.userId)
        throw new CustomError(
          errorCodes.POST.FORBIDDEN.status,
          errorCodes.POST.FORBIDDEN.code,
          "자신의 게시물이 아닙니다.",
        );
    } catch (error) {
      throw error;
    }
  };
  // 그 게시물이 있는지 확인
  public existPost = async (param: GetPostDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "PostService",
        functionName: "existPost",
      });

      const result = await this.postRepository.existPost(param);
      if (!result)
        throw new CustomError(
          errorCodes.POST.NOT_FOUND.status,
          errorCodes.POST.NOT_FOUND.code,
          "해당 게시물이 존재하지 않습니다.",
        );
      return result;
    } catch (error) {
      throw error;
    }
  };
}

export default PostService;

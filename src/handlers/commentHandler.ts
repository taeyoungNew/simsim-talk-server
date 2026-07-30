import { Response, Request, RequestHandler, NextFunction } from "express";
import CommentService from "../service/commentService";
import {
  CreateCommentDto,
  DeleteCommentDto,
  GetCommentDto,
  ModifyCommentDto,
} from "../dtos/commentDto";
import { commentContentExp } from "../common/validators/commentExp";
import { userCache } from "../common/cacheLocal/userIdCache";
import logger from "../config/logger";
import { postCache } from "../common/cacheLocal/postCache";
import PostService from "../service/postService";
import { GetPostDto } from "../dtos/PostDto";
import { userPostsCache } from "../common/cacheLocal/userPostsCache";
import errorCodes from "../constants/error-codes.json";
import { CustomError } from "../errors/customError";
import BlockUserService from "../service/blockUserService";
interface Comment {
  id: number;
  userId: string;
  userNickname: string;
  content: string;
}

/**
 * Comment handler
 */
class CommentHandler {
  private blockUserService = new BlockUserService();
  private commentService = new CommentService();
  private postService = new PostService();
  // 댓글작성
  public createComent = async (
    req: Request<{ postId: string }, {}, { comment: string }, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "post",
        url: "api/comment/:postId",
        layer: "Handlers",
        className: "CommentHandler",
        functionName: "createComent",
      });

      // 유저의 id가져오기
      const userId = res.locals.userInfo.userId;
      const postId = req.params.postId;

      const { authorization } = req.cookies;
      const [_, token] = authorization.split(" ");
      const getUserLoginInfo = JSON.parse(
        await userCache.get(`token:${token}`),
      );

      if (!commentContentExp(req.body.comment))
        throw new CustomError(
          errorCodes.COMMENT.VALIDATION_ERROR.status,
          errorCodes.COMMENT.VALIDATION_ERROR.code,
          "200자내로 적어주세요.",
        );

      // 댓글의 형식검사
      const payment: CreateCommentDto = {
        userId,
        postId: Number(postId),
        content: req.body.comment,
        userNickname: getUserLoginInfo.userNickname,
      };

      const result = await this.commentService.createComment(payment);
      const plainComment = result.get({ plain: true });

      // 레디스의 해당 게시물의 댓글에도 추가
      const post = await postCache.get(`post:${postId}`);
      const userPost = await userPostsCache.get(`post:${postId}`);

      // 해당 댓글이 달린 게시물이 redis에 있는지 확인
      if (!post) {
        const postPayMent: GetPostDto = payment;
        const getPost = await this.postService.getPost(postPayMent);
        getPost.Comments.push(plainComment);
        await postCache.set(`post:${postId}`, JSON.stringify(getPost), {
          EX: 600,
        });
      } else {
        const postParse = await JSON.parse(post);
        await postParse.Comments.push(plainComment);
        const postListTTL = await postCache.ttl("posts:list");
        await postCache.set(`post:${postId}`, JSON.stringify(postParse), {
          expire: postListTTL,
        });
      }
      // 해당 댓글이 달린 게시물이 redis에 있는지 확인
      if (!userPost) {
        const postPayMent: GetPostDto = payment;
        const getPost = await this.postService.getPost(postPayMent);
        getPost.Comments.push(plainComment);
        await userPostsCache.set(`post:${postId}`, JSON.stringify(getPost), {
          EX: 600,
        });
      } else {
        const postParse = await JSON.parse(userPost);

        await postParse.Comments.push(plainComment);

        const postListTTL = await userPostsCache.ttl("posts:list");
        await userPostsCache.set(`post:${postId}`, JSON.stringify(postParse), {
          expire: postListTTL,
        });
      }

      res
        .status(200)
        .json({ message: "댓글이 작성되었습니다. ", plainComment });
    } catch (e) {
      next(e);
    }
  };
  // 댓글수정
  public modifyComment = async (
    req: Request<{ commentId: string }, {}, ModifyCommentDto, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "put",
        url: "api/comment/:commentId",
        layer: "Handlers",
        className: "CommentHandler",
        functionName: "modifyComment",
      });
      const userId = res.locals.userInfo.userId;
      const commentId = req.params.commentId;
      const postId = req.body.postId;
      if (!commentContentExp(req.body.comment))
        throw new CustomError(
          errorCodes.COMMENT.VALIDATION_ERROR.status,
          errorCodes.COMMENT.VALIDATION_ERROR.code,
          "200자내로 적어주세요.",
        );

      const payment: ModifyCommentDto = {
        userId,
        postId: req.body.postId,
        commentId: Number(commentId),
        comment: req.body.comment,
      };

      await this.commentService.modifyComment(payment);

      const post = await postCache.get(`post:${postId}`);
      let returnComment;
      if (post) {
        const postParse = await JSON.parse(post);
        const postTTL = await postCache.ttl(`posts:list`);
        for (let idx = 0; idx < postParse.Comments.length; idx++) {
          if (postParse.Comments[idx].id === Number(commentId)) {
            postParse.Comments[idx].content = req.body.comment;
            returnComment = postParse.Comments[idx];
            break;
          }
        }
        await postCache.set(`post:${postId}`, JSON.stringify(postParse), {
          EX: postTTL,
        });
      } else {
        const postId: GetPostDto = payment;
        const getPost = await this.postService.getPost(postId);
        await postCache.set(`post:${postId}`, JSON.stringify(getPost), {
          EX: 600,
        });
      }

      res.status(200).json({
        message: "해당 댓글이 수정되었습니다.",
        data: {
          comment: returnComment,
        },
      });
    } catch (e) {
      next(e);
    }
  };

  // 하나의 댓글불러오기
  public getComment = async (
    req: Request<{ commentId: number }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/comment/:commentId",
        layer: "Handlers",
        className: "CommentHandler",
        functionName: "getComment",
      });

      const commentId = req.params.commentId;
      const payment: GetCommentDto = {
        commentId,
      };
      const result = await this.commentService.getComment(payment);
      return res.status(200).json({ data: result });
    } catch (e) {
      next(e);
    }
  };

  // 댓글삭제하기
  public deleteComment = async (
    req: Request<{ commentId: string; postId: string }, {}, DeleteCommentDto>,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "delete",
      url: "api/comment/:commentId",
      layer: "Handlers",
      className: "CommentHandler",
      functionName: "deleteComment",
    });
    try {
      logger.info("", {
        method: "delete",
        url: "api/comment/:commentId",
        layer: "Handlers",
        className: "CommentHandler",
        functionName: "deleteComment",
      });
      const userId = res.locals.userInfo.userId;
      const commentId = req.params.commentId;
      const postId = req.query.postId;

      const payment: DeleteCommentDto = {
        userId,
        commentId: Number(commentId),
        postId: Number(postId),
      };

      await this.commentService.deleteComment(payment);

      const post = await postCache.get(`post:${postId}`);
      if (post) {
        const postTtl = await postCache.ttl(`posts:list`);
        const postParse = await JSON.parse(post);
        postParse.Comments = postParse.Comments.filter(
          (el: Comment) => el.id != Number(commentId),
        );
        await postCache.set(`post:${postId}`, JSON.stringify(postParse), {
          EX: postTtl,
        });
      } else {
        const postId: GetPostDto = payment;
        const getPost = await this.postService.getPost(postId);
        await postCache.set(`post:${postId}`, JSON.stringify(getPost), {
          EX: 600,
        });
      }

      res.status(200).json({ message: "해당 댓글이 삭제되었습니다." });
    } catch (e) {
      next(e);
    }
  };
}

export default CommentHandler;

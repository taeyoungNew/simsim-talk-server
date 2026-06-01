import { Response, Request, RequestHandler, NextFunction } from "express";
import {
  CreatePostDto,
  DeletePostDto,
  GetUserPostsDto,
  ModifyPostDto,
  IsUserPost,
  GetPostDetailDto,
} from "../dtos/PostDto";
// import dotenv from "dotenv";
import { postTitleExp, postContentExp } from "../common/validators/postExp";
import PostService from "../service/postService";
import logger from "../config/logger";
import Posts from "../database/models/posts";
import { postCache } from "../common/cacheLocal/postCache";
import { userPostsCache } from "../common/cacheLocal/userPostsCache";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
import FollowService from "../service/followService";
import BlockUserService from "../service/blockUserService";

class PostHandler {
  postService = new PostService();
  followService = new FollowService();
  blockUserService = new BlockUserService();
  // 게시물 작성
  public createPost: RequestHandler = async (
    req: Request<{}, {}, CreatePostDto, {}>,
    res: Response,
    next,
  ) => {
    try {
      logger.info("", {
        method: "post",
        url: "api/post/",
        layer: "Handlers",
        className: "PostHandler",
        functionName: "createPost",
      });
      const userId = res.locals.userInfo.userId;

      const { content } = req.body;

      // content형식체크
      if (!postContentExp(content))
        throw new CustomError(
          errorCodes.POST.VALIDATION_ERROR.status,
          errorCodes.POST.VALIDATION_ERROR.code,
          "300자내로 적어주세요. ",
        );

      const postPayment: CreatePostDto = {
        userId,
        content,
      };

      const newPost = await this.postService.createPost(postPayment);

      // posts:list와 post의 TTL을 조회
      const postListTTL = await postCache.ttl("posts:list");

      if (postListTTL !== -2) {
        await postCache.lPush("posts:list", String(newPost.id));
        const cacheUserPostIds = await userPostsCache.lRange(
          `userPosts:${userId}:List`,
          0,
          -1,
        );

        if (cacheUserPostIds.length !== 0) {
          const userPostListTTL = await userPostsCache.ttl(
            `userPosts:${userId}:List`,
          );
          await userPostsCache.lPush(
            `userPosts:${userId}:List`,
            String(newPost.id),
          );
          await userPostsCache.expire(
            `userPosts:${userId}:List`,
            userPostListTTL,
          );
          await userPostsCache.set(
            `post:${newPost.id}`,
            JSON.stringify({
              id: String(newPost.dataValues.id),
              userId: newPost.dataValues.userId,
              content: newPost.dataValues.content,
              userNickname: newPost.dataValues.userNickname,
              likeCnt: newPost.dataValues.likeCnt,
              commentCnt: newPost.dataValues.commentCnt,
              Comments: newPost.dataValues.Comments,
            }),
            { EX: userPostListTTL },
          );
        }
        await postCache.expire("posts:list", postListTTL);
        await postCache.set(
          `post:${newPost.id}`,
          JSON.stringify({
            id: String(newPost.dataValues.id),
            userId: newPost.dataValues.userId,
            content: newPost.dataValues.content,
            userNickname: newPost.dataValues.userNickname,
            likeCnt: newPost.dataValues.likeCnt,
            commentCnt: newPost.dataValues.commentCnt,
            Comments: newPost.dataValues.Comments,
          }),
          { EX: postListTTL },
        );
      } else {
        const postList: Posts[] = [];
        postList.push(newPost);
        this.cachePosts(postList);
        this.cacheUserPosts(postList, userId);
      }
      res.status(200).json({
        message: "게시물이 작성되었습니다.",
        data: newPost,
      });
    } catch (e) {
      next(e);
    }
  };

  // 게시물 모두조회
  public getAllPosts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "get",
      url: "api/post/",
      layer: "Handlers",
      className: "PostHandler",
      functionName: "getAllPosts",
    });
    try {
      console.time("after-db");
      const postLastId = Number(req.query.postLastId);

      const userId = res.locals.userInfo?.userId;

      const ids: [] = await postCache.lRange("posts:list", 0, -1);

      let isLikedPostIds;
      let isFollowingedUserIds;
      let result: Posts[] = [];

      if (userId) {
        isLikedPostIds = await this.postService.getIsLikedPostIds(userId);
        isFollowingedUserIds = await this.followService.getFollowings({
          userId,
        });
      }

      console.timeEnd("after-db");
      // 첫랜더링
      if (ids.length === 0) {
        result = await this.postService.getAllPosts(userId);

        await this.cachePosts(result);
        let posts;
        if (result.length != 0) {
          posts = result.splice(0, 5);
          const isLast = posts.length < 5 ? true : false;
          // const filtBlockPosts = this.blockUserService.filterBlockedPosts({
          //   userId,
          //   result,
          // });
          return res
            .status(200)
            .json({ posts, isLast, isLikedPostIds, isFollowingedUserIds });
        } else {
          // ✨ 데이터가 없을 때도 응답을 보내야 함!
          return res.status(200).json({
            posts: [],
            isLast: true,
            isLikedPostIds: [],
            isFollowingedUserIds: [],
          });
        }
      } else {
        // 두번째랜더링
        const lastPostIdx = ids.findIndex((id) => {
          return Number(id) === Number(postLastId);
        });
        const targetIds = ids.slice(lastPostIdx + 1, lastPostIdx + 6);

        const postJsons = await Promise.all(
          targetIds.map((id: string) => postCache.get(`post:${id}`)),
        );

        const posts = postJsons.map((post) => JSON.parse(post));
        const isLast = posts.length < 5 ? true : false;

        return res
          .status(200)
          .json({ posts, isLast, isLikedPostIds, isFollowingedUserIds });
      }
    } catch (e) {
      next(e);
    }
  };

  // 한 게시물만 조회
  public getPost = async (
    req: Request<{}, {}, {}, { postId: string; postUserId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/post/:postId",
        layer: "Handlers",
        className: "PostHandler",
        functionName: "getPost",
      });
      const userId = res.locals.userInfo?.userId;
      const postId = Number(req.query.postId);
      const postUserId = req.query.postUserId;

      const payload: GetPostDetailDto = { postId, userId, postUserId };
      const ids: [] = await postCache.lRange("posts:list", 0, -1);

      // 그전에 레디스에 데이터들이 있는지 확인
      if (ids.length === 0) {
        const result = await this.postService.getAllPosts(userId);

        await this.cachePosts(result);
      }
      // 레디스에서 확인

      const checkPostId = ids.find((id) => id === postId);

      let result;
      // 레디스에 해당 게시물이 있으면 반환
      if (checkPostId) {
        const postStr = await postCache.get(`post:${checkPostId}`);
        result = JSON.parse(postStr);
      } else {
        result = await this.postService.getPost(payload);

        result.dataValues.isLiked =
          result.dataValues.isLiked === 0 ? false : true;
        result.dataValues.isFollowinged =
          result.dataValues.isFollowinged === 0 ? false : true;
        postCache.set(
          `post:${result.dataValues.id}`,
          JSON.stringify({
            id: result.dataValues.id,
            profileUrl: result.dataValues.profileUrl,
            userId: result.dataValues.userId,
            isLiked: result.dataValues.isLiked,
            content: result.dataValues.content,
            userNickname: result.dataValues.userNickname,
            likeCnt: result.dataValues.likeCnt,
            isFollowinged: result.dataValues.isFollowinged,
            commentCnt: result.dataValues.commentCnt,
            Comments: result.dataValues.Comments,
          }),
          { EX: 600 },
        );
      }
      // 레디스에 없으면 DB에서 가져오고 redis에도 저장
      res.status(200).json({ data: result });
    } catch (e) {
      next(e);
    }
  };

  // 게시물 수정
  public modifyPost = async (
    req: Request<{ postId: string }, {}, ModifyPostDto, { postUserId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "put",
        url: "api/post/:postId",
        layer: "Handlers",
        className: "PostHandler",
        functionName: "modifyPost",
      });
      // 수정대상게시물의 id
      const postId = Number(req.params.postId);
      const postUserId = req.query.postUserId;
      // 현재로그인한 유저의 id
      const userId = res.locals.userInfo.userId;
      const { content } = req.body;

      // content형식체크
      if (!postContentExp(content))
        throw new CustomError(
          errorCodes.POST.VALIDATION_ERROR.status,
          errorCodes.POST.VALIDATION_ERROR.code,
          "500자내로 적어주세요. ",
        );

      const modifyPayment: IsUserPost = {
        userId,
        postId,
      };
      await this.postService.isUserPost(modifyPayment);
      const payment: ModifyPostDto = {
        userId,
        postId,
        content,
      };

      // DB데이터를 우선으로 수정
      await this.postService.modifyPost(payment);

      // read-through적용
      // 캐싱정보가져오기
      let postParse;
      const post = await postCache.get(`post:${postId}`);
      if (post) {
        postParse = await JSON.parse(post);
        postParse.content = content;
        await postCache.set(`post:${postId}`, JSON.stringify(postParse));
        await userPostsCache.set(`post:${postId}`, JSON.stringify(postParse));
      } else {
        // redis에 해당 게시물의 데이터가 없을경우
        const post: GetPostDetailDto = {
          postId,
          postUserId,
          userId,
        };
        const result = await this.postService.getPost(post);
        this.cachePost(result);
      }

      res
        .status(200)
        .json({ message: "해당게시물이 수정되었습니다.", data: postParse });
    } catch (e) {
      next(e);
    }
  };

  // user의 게시물 조회
  public getUserPosts = async (
    req: Request<
      {},
      {},
      GetUserPostsDto,
      { userId: string; postLastId: string }
    >,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/post/:userId",
        layer: "Handlers",
        className: "PostHandler",
        functionName: "getUserPosts",
      });

      const ids: [] = await userPostsCache.lRange(
        `userPosts:${req.query.userId}:List`,
        0,
        -1,
      );

      let isLikedPostIds;
      const userId = res.locals.userInfo?.userId;
      let result: Posts[] = [];

      if (userId) {
        isLikedPostIds = await this.postService.getIsLikedPostIds(userId);
      }

      // 첫 랜더링
      if (ids.length === 0) {
        const param: GetUserPostsDto = {
          userId: req.query.userId,
          postLastId: undefined,
        };
        result = await this.postService.getUserPosts(param);

        // 유저의 게시물id를 캐싱하기
        await this.cacheUserPosts(result, param.userId);

        // 캐싱한 id들중 최신 10개만
        const userPosts = result.splice(0, 5);
        const isLast = userPosts.length < 5 ? true : false;

        return res.status(200).json({ userPosts, isLast, isLikedPostIds });
      } else {
        const postLastId = req.query.postLastId;

        // 두번째이상의 랜더링
        const lastUserPostIdx = ids.findIndex((id) => {
          return Number(id) === Number(postLastId);
        });

        const targetIds = ids.slice(lastUserPostIdx + 1, lastUserPostIdx + 6);

        const postJsons = await Promise.all(
          targetIds.map((id: string) => postCache.get(`post:${id}`)),
        );
        const userPosts = postJsons.map((post) => JSON.parse(post));
        const isLast = userPosts.length < 5 ? true : false;
        return res.status(200).json({ userPosts, isLast, isLikedPostIds });
      }
    } catch (e) {
      next(e);
    }
  };

  // 게시물 삭제
  public deletePost = async (
    req: Request<{ postId: string }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "delete",
        url: "api/post/:postId",
        layer: "Handlers",
        className: "PostHandler",
        functionName: "deletePost",
      });
      const userId = res.locals.userInfo.userId;
      const postId = req.params.postId;
      const postPayment: DeletePostDto = {
        userId,
        postId: Number(postId),
      };

      // 먼저 DB에 있는 게시물데이터삭제
      await this.postService.deletePost(postPayment);

      // 먼저 posts:list가 있는지 확인
      const ids: string[] = await postCache.lRange("posts:list", 0, -1);
      const userPostIds: string[] = await userPostsCache.lRange(
        `userPosts:${userId}:List`,
        0,
        -1,
      );
      const param: GetUserPostsDto = {
        userId,
        postLastId: undefined,
      };

      if (ids.length === 0) {
        const result = await this.postService.getAllPosts(userId);
        await this.cachePosts(result);
      } else {
        // 해당 삭제할 게시물의 id값을 없앤 posts:list로 덮어쓰기
        const cacheIds = await postCache.lRange("posts:list", 0, -1);

        const postListTTL = await postCache.ttl("posts:list");

        const ids = cacheIds.map((el: string) => JSON.parse(el));

        const filterIds = ids.filter((el: number) => {
          return el.toString() !== postId;
        });

        await postCache.del("posts:list");

        await postCache.rPush(
          "posts:list",
          filterIds.map((el: string) => JSON.stringify(el)),
        );

        await postCache.expire("posts:list", postListTTL);
      }

      if (userPostIds.length === 0) {
        const userGetPostsResult = await this.postService.getUserPosts(param);
        await this.cacheUserPosts(userGetPostsResult, userId);
      } else {
        // userCache의 게시물도 삭제
        const cacheUserPostIds = await userPostsCache.lRange(
          `userPosts:${userId}:List`,
          0,
          -1,
        );
        const userPostListTTL = await userPostsCache.ttl(
          `userPosts:${userId}:List`,
        );
        const userPostIds = cacheUserPostIds.map((el: string) =>
          JSON.parse(el),
        );
        const filterUserPostIds = userPostIds.filter((el: number) => {
          return el.toString() !== postId;
        });

        await userPostsCache.del(`userPosts:${userId}:List`);
        await userPostsCache.rPush(
          `userPosts:${userId}:List`,
          filterUserPostIds.map((el: string) => JSON.stringify(el)),
        );
        await userPostsCache.expire(
          `userPosts:${userId}:List`,
          userPostListTTL,
        );
      }

      const checkPostCache = await postCache.get(`post:${postId}`);

      if (checkPostCache) {
        await postCache.del(`post:${postId}`);
        await userPostsCache.del(`post:${postId}`);
      }
      res.status(200).json({ message: "게시물이 삭제되었습니다." });
    } catch (e) {
      next(e);
    }
  };

  // 게시물데이터들을 다시 캐싱하기
  private cachePosts = async (posts: Posts[]) => {
    const ids = posts.map((el) => el.id);
    if (ids.length !== 0) {
      await postCache.rPush("posts:list", ids.map(String));
      await postCache.expire("posts:list", 600);
    }

    for (let idx = 0; idx < posts.length; idx++) {
      await postCache.set(
        `post:${posts[idx].dataValues.id}`,
        JSON.stringify({
          id: posts[idx].dataValues.id,
          profileUrl: posts[idx].dataValues.profileUrl,
          userId: posts[idx].dataValues.userId,
          content: posts[idx].dataValues.content,
          userNickname: posts[idx].dataValues.userNickname,
          likeCnt: posts[idx].dataValues.likeCnt,
          istLiked: posts[idx].dataValues.isLiked,
          commentCnt: posts[idx].dataValues.commentCnt,
          Comments: posts[idx].dataValues.Comments,
        }),
        { EX: 600 },
      );
    }
  };

  private cachePost = async (post: Posts) => {
    await postCache.set(
      `post:${post.dataValues.postId}`,
      JSON.stringify({
        id: post.dataValues.id,
        profileUrl: post.dataValues.profileUrl,
        userId: post.dataValues.userId,
        content: post.dataValues.content,
        userNickname: post.dataValues.userNickname,
        likeCnt: post.dataValues.likeCnt,
        commentCnt: post.dataValues.commentCnt,
        Comments: post.dataValues.Comments,
      }),
      { EX: 600 },
    );
  };

  // 유저의 게시물을 캐싱하기
  private cacheUserPosts = async (userPosts: Posts[], userId: string) => {
    const ids = userPosts.map((el) => el.id);

    await userPostsCache.rPush(`userPosts:${userId}:List`, ids.map(String));
    await userPostsCache.expire(`userPosts:${userId}:List`, 600);

    for (let idx = 0; idx < userPosts.length; idx++) {
      await userPostsCache.set(
        `post:${userPosts[idx].dataValues.id}`,
        JSON.stringify({
          id: userPosts[idx].dataValues.id,
          profileUrl: userPosts[idx].dataValues.profileUrl,
          userId: userPosts[idx].dataValues.userId,
          content: userPosts[idx].dataValues.content,
          userNickname: userPosts[idx].dataValues.userNickname,
          likeCnt: userPosts[idx].dataValues.likeCnt,
          commentCnt: userPosts[idx].dataValues.commentCnt,
          Comments: userPosts[idx].dataValues.Comments,
        }),
        { EX: 600 },
      );
    }
  };
}

export default PostHandler;

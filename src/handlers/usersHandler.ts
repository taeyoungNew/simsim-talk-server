import { Response, Request, NextFunction } from "express";
import UserService from "../service/usersService";
import FollowService from "../service/followService";
import logger from "../config/logger";
import { SignupDto, ModifyUserDto, GetBlockedUsersDto } from "../dtos/userDto";
import {
  emailExp,
  passwordExp,
  nicknameExp,
  aboutMeExp,
  ageExp,
  username,
} from "../common/validators/userExp";
import errorCodes from "../constants/error-codes.json";
import { CustomError } from "../errors/customError";
import AuthService from "../service/authService";
import { userCache } from "../common/cacheLocal/userIdCache";
import {
  deleteProfileToR2,
  uploadProfileToR2,
} from "../common/r2Cloud/profileStorageToR2";
import { deleteUserPostsCache } from "../common/cacheLocal/userCache/userCacheModule";
import { deletePostsCache } from "../common/cacheLocal/postCache/postCacheModule";
import PostService from "../service/postService";

class UserHandler {
  authService = new AuthService();
  postService = new PostService();
  userService = new UserService();
  followService = new FollowService();
  /**
   * 회원가입
   *
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public createUser = async (
    req: Request<{}, {}, SignupDto, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "post",
        url: "api/user/signup",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "createUser",
      });
      const { email, password, aboutMe, age, nickname, username } = req.body;
      if (!emailExp(email))
        throw new CustomError(
          errorCodes.AUTH.EMAIL_INVALID.status,
          errorCodes.AUTH.EMAIL_INVALID.code,
          "이메일형식이 맞지 않습니다. ",
        );

      if (!passwordExp(password))
        throw new CustomError(
          errorCodes.AUTH.PASSWORD_INVALID.status,
          errorCodes.AUTH.PASSWORD_INVALID.code,
          "패스워드형식이 맞지 않습니다. ",
        );

      if (!nicknameExp(nickname))
        throw new CustomError(
          errorCodes.USER.NICKNAME_INVALID.status,
          errorCodes.USER.NICKNAME_INVALID.code,
          "닉네임형식에 맞지않습니다.",
        );

      const signupInfo: SignupDto = {
        email,
        password,
        aboutMe,
        age,
        nickname,
        username,
      };
      await this.userService.createUser(signupInfo);
      return res.status(200).json({ message: "회원가입이 완료되었습니다. " });
    } catch (e) {
      next(e);
    }
  };

  // 유저의 프사설정
  public changeMyProfileImg = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "patch",
      url: "api/user/my-profile-img",
      layer: "Handlers",
      className: "UserHandler",
      functionName: "chafilengeMyProfileImg",
    });
    try {
      const { authorization } = req.cookies;
      const [tokenType, token] = authorization.split(" ");
      const file = req.file;
      const userId = res.locals.userInfo.userId;
      const userInfo = await userCache.get(`token:${token}`);
      const timestamp = Date.now();
      const useInfoParse = await JSON.parse(userInfo);

      if (!file) return res.status(400).json({ message: "파일이 없습니다." });
      const key = await uploadProfileToR2({
        file: file,
        key: `user-info/profile-img/${userId}/avatar.webp`,
      });
      const profileUrl = `${process.env.R2_PUBLIC_URL}/${key}?v=${timestamp}`;
      useInfoParse.profileUrl = profileUrl;
      await userCache.set(`token:${token}`, JSON.stringify(useInfoParse));
      const payment = {
        userId,
        profileUrl,
        timestamp,
      };
      await this.userService.changeMyProfileImg(payment);
      return res.status(200).json({ url: profileUrl });
    } catch (error) {
      next(error);
    }
  };

  public changeMyBackgroundImg = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    logger.info("", {
      method: "patch",
      url: "api/user/my-background-img",
      layer: "Handlers",
      className: "UserHandler",
      functionName: "changeMyBackgroundImg",
    });
    try {
      const { authorization } = req.cookies;
      const [tokenType, token] = authorization.split(" ");
      const file = req.file;
      const userId = res.locals.userInfo.userId;
      const userInfo = await userCache.get(`token:${token}`);
      const timestamp = Date.now();
      const useInfoParse = await JSON.parse(userInfo);
      if (!file) return res.status(400).json({ message: "파일이 없습니다." });
      const key = await uploadProfileToR2({
        file: file,
        key: `user-info/background-img/${userId}/avatar.webp`,
      });
      const backgroundUrl = `${process.env.R2_PUBLIC_URL}/${key}?v=${timestamp}`;
      useInfoParse.backgroundUrl = backgroundUrl;
      await userCache.set(`token:${token}`, JSON.stringify(useInfoParse));
      const payment = {
        userId,
        backgroundUrl,
        timestamp,
      };
      await this.userService.changeMyBackgroundImg(payment);
      return res.status(200).json({ url: backgroundUrl });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 모든 회원정보리스트
   *
   * @param req
   * @param res
   * @param next
   * @returns 프로필, 닉네임, id
   *
   *
   */
  public findAllUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/user/",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "findAllUser",
      });
      const result = await this.userService.findAllUser();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 자신의 정보가져오기
   *
   * @param req
   * @param res
   * @param next
   * @returns id, email, follower, folloing, blockedUsers, info
   *
   *
   */
  public findMyInfos = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/user/",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "findMyInfos",
      });
      const myId: string = res.locals.userInfo.userId;

      const result = await this.userService.findMyInfos(myId);

      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 특정유저의 정보가져오기
   *
   * @param req
   * @param res
   * @param next
   */
  public findUserInfos = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/user/:userId",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "findUserInfos",
      });

      const myId = res.locals.userInfo?.userId;

      const userId = req.params.userId;
      const result = await this.userService.findUserInfos({ userId, myId });

      result.dataValues.isFollowinged =
        result.dataValues.isFollowinged === 1 ? true : false;

      return res
        .status(200)
        .json({ data: result, isFollowingedIds: result.isFollowingedIds });
    } catch (error) {
      next(error);
    }
  };

  // 특정유저의 정보가져오기
  public findUserByEmail = async (
    req: Request<{ email: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/user/:email",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "findUserByEmail",
      });
      const email: string = req.params.email;

      const result = await this.userService.findUserByEmail(email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // 자신의 정보가져오기
  public findUserById = async (
    req: Request<{ userId: string }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "get",
        url: "api/user/myinfo/:userId",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "findUserById",
      });
      const userId: string = res.locals.userInfo.userId;

      const result = await this.userService.findUserById(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   *
   * @param req
   * @param res
   * @param next
   * @return 자신의 팔로잉 팔로워리스트 가져오기
   */
  // 회원정보 수정하기
  public modifyUserInfo = async (
    req: Request<{ id: string }, {}, ModifyUserDto, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "put",
        url: "api/user/:id",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "modifyUserInfo",
      });
      const userInfo: ModifyUserDto = {
        userId: res.locals.userInfo.userId,
        username: req.body.username,
        aboutMe: req.body.aboutMe,
        age: req.body.age,
      };
      // aboutMe형식
      if (aboutMeExp(userInfo.aboutMe))
        throw new Error("500자이내로 써주세요.");

      // age형식
      if (ageExp(userInfo.age)) throw new Error("나이형식에 맞지않습니다.");

      // username형식
      if (username(userInfo.username))
        throw new Error("유저이름형식에 맞지않습니다. ");

      await this.userService.modifyUserInfo(userInfo);
      return res.status(200).json({ message: "유저정보가 변경되었습니다. " });
    } catch (error) {
      next(error);
    }
  };

  // 회원탈퇴
  public deleteUser = async (
    req: Request<{ password: string }, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "delete",
        url: "api/user/:id",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "deleteUser",
      });
      const { authorization } = req.cookies;
      const [tokenType, token] = authorization.split(" ");
      const id = res.locals.userInfo.userId;
      // 로그인정보로 회원유무확인
      const password = req.params.password;
      const getUserInfo = await this.userService.getUserForAuth(id);

      // 탈퇴유저의 패스워드확인
      this.authService.validPassword(password, getUserInfo.password);
      const getUserPostIds = await this.postService.getUserPostIds(id);
      const postIds = getUserPostIds.map((p: { id: any }) => p.id);

      await this.userService.deleteUser(id);
      await deleteProfileToR2({
        key: `user-info/background-img/${id}/avatar.webp`,
      });

      await userCache.del(`token:${token}`);
      await deleteUserPostsCache(id);
      await deletePostsCache(postIds);
      return res.status(200).send({ message: "회원탈퇴가 완료되었습니다." });
    } catch (error) {
      next(error);
    }
  };

  public getBlockedUsers = async (
    req: Request<{}, {}, GetBlockedUsersDto, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      logger.info("", {
        method: "delete",
        url: "api/user/get-blockedusers-list",
        layer: "Handlers",
        className: "UserHandler",
        functionName: "getBlockedUsers",
      });

      const params: GetBlockedUsersDto = {
        blockedUserIds: req.body.blockedUserIds,
      };
      const result = await this.userService.getBlockedUsers(params);
      return res.status(200).json({ datas: result });
    } catch (error) {
      next(error);
    }
  };
}

export default UserHandler;

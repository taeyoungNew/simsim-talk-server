import {
  ChangeMyBackgroundImgEntity,
  ChangeMyProfileImgEntity,
  GetBlockedUsersEntity,
  GetFindUserInfosEntity,
  ModifyUserEntity,
  SignupUserEntity,
  SignupUserInfosEntity,
} from "../entity/userEntity";
import logger from "../config/logger";
import sequelize, { where } from "sequelize";
import db from "../database/models/index";
import { Op } from "sequelize";

const { Users, UserInfos } = db;
class UserRepository {
  // refToken취득
  public getRefToken = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "getRefToken",
    });
    const result = await Users.findByPk(userId, {
      attributes: ["refToken"],
      raw: true,
    });
    return result;
  };

  // Users 회원가입
  public createUser = async (signupInfo: SignupUserEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "createUser",
    });
    await Users.create({
      email: signupInfo.email,
      password: signupInfo.password,
    });
  };

  public changeMyProfileImg = async ({
    userId,
    profileUrl,
    timestamp,
  }: ChangeMyProfileImgEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "changeMyProfileImg",
    });
    await UserInfos.update(
      {
        profileUrl,
        profileUpdatedAt: timestamp,
      },
      {
        where: {
          userId,
        },
      },
    );
  };

  public changeMyBackgroundImg = async ({
    userId,
    backgroundUrl,
    timestamp,
  }: ChangeMyBackgroundImgEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "changeMyProfileImg",
    });
    await UserInfos.update(
      {
        backgroundUrl,
        backgroundUrlUpdatedAt: timestamp,
      },
      {
        where: {
          userId,
        },
      },
    );
  };

  // UserInfos 회원가입
  public createUserInfo = async (signupInfo: SignupUserInfosEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "createUserInfo",
    });
    await UserInfos.create({
      userId: signupInfo!.userId,
      profileUrl: "",
      username: signupInfo.username,
      aboutMe: signupInfo.aboutMe,
      nickname: signupInfo.nickname,
      age: signupInfo.age,
    });
  };

  /**
   * 자신의 정보가져오기
   *
   * @param myId: string
   * @returns id, email, follower, folloing, blockedUsers, info
   */
  public findMyInfos = async (myId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "findMyInfos",
    });
    // 에러가 난이유는 서브쿼라의 from절에서 테이블을 찾지못했기때문
    // migrate의 모델명으로 해야한다
    const result = await Users.findOne({
      attributes: {
        exclude: [
          "refToken",
          "password",
          "refTokenExp",
          "createdAt",
          "updatedAt",
        ],
        // 서브쿼리
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followingId = '${myId}' THEN 1 END)
                FROM Follows
            )`),
            "followerCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followerId = '${myId}' THEN 1 END)
                FROM Follows
            )`),
            "followingCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN blockerId = '${myId}' THEN 1 END)
                FROM BlockUsers
            )`),
            "blockedCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN userId = '${myId}' THEN 1 END)
                FROM Posts 
            )`),
            "postCnt",
          ],
        ],
      },
      include: [
        {
          model: UserInfos,
          attributes: [
            "username",
            "nickname",
            "profileUrl",
            "backgroundUrl",
            "aboutMe",
            "age",
          ],
        },
        {
          model: Users,
          as: "Followings",
          attributes: ["id"],
          include: [
            {
              model: UserInfos,
              attributes: ["id", "nickname", "profileUrl", "username"],
            },
          ],
          through: { attributes: [] }, // 중간 테이블 제거
        },
        {
          model: Users,
          as: "Followers",
          attributes: ["id"],
          include: [
            {
              model: UserInfos,
              attributes: ["id", "nickname", "username", "profileUrl"],
            },
          ],
          through: { attributes: [] }, // 중간 테이블 제거
        },
      ],
      subQuery: true,
      where: { id: myId },
    });

    return result;
  };

  // 타유저의 정보가져오기
  public findUserInfos = async (params: GetFindUserInfosEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "findUserInfos",
    });

    const isFollowingLiteral = params.myId
      ? sequelize.literal(`(
            SELECT CASE
              WHEN COUNT(*) > 0
              THEN true
              ELSE false
               END
              FROM Follows as follows
             WHERE follows.followerId = '${params.myId}'
               AND follows.followingId = '${params.userId}'
          
          )`)
      : sequelize.literal(`0`);

    const result = await Users.findOne({
      attributes: {
        exclude: [
          "refToken",
          "password",
          "refTokenExp",
          "createdAt",
          "updatedAt",
        ],
        // 서브쿼리
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followingId = '${params.userId}' THEN 1 END)
                FROM Follows
            )`),
            "followerCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followerId = '${params.userId}' THEN 1 END)
                FROM Follows
            )`),
            "followingCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN blockerId = '${params.userId}' THEN 1 END)
                FROM BlockUsers
            )`),
            "blockedCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN userId = '${params.userId}' THEN 1 END)
                FROM Posts 
            )`),
            "postCnt",
          ],
          [isFollowingLiteral, "isFollowinged"],
        ],
      },
      include: [
        {
          model: UserInfos,
          attributes: [
            "username",
            "nickname",
            "aboutMe",
            "profileUrl",
            "backgroundUrl",
            "age",
          ],
        },
        {
          model: Users,
          as: "Followings",
          attributes: ["id"],
          include: [
            {
              model: UserInfos,
              attributes: ["id", "nickname", "profileUrl", "username"],
            },
          ],
          through: { attributes: [] }, // 중간 테이블 제거
        },
        {
          model: Users,
          as: "Followers",
          attributes: ["id"],
          include: [
            {
              model: UserInfos,
              attributes: ["id", "nickname", "profileUrl", "username"],
            },
          ],
          through: { attributes: [] }, // 중간 테이블 제거
        },
      ],
      subQuery: true,
      where: { id: params.userId },
    });

    return result;
  };

  // email로 회원정보가져오기
  public findByEmail = async (email: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "findByEmail",
    });
    const result = await Users.findOne({
      attributes: ["id", "email", "password"],
      include: [
        {
          model: UserInfos,
          attributes: ["username", "nickname", "profileUrl", "aboutMe", "age"],
        },
      ],
      where: {
        email,
      },
    });
    return result;
  };

  // id로 회원정보가져오기
  public findById = async (id: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "findById",
    });
    // 에러가 난이유는 서브쿼라의 from절에서 테이블을 찾지못했기때문
    // migrate의 모델명으로 해야한다
    const result = await Users.findOne({
      attributes: {
        exclude: ["password"],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followingId = '${id}' THEN 1 END)
                FROM Follows
            )`),
            "followerCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN followerId = '${id}' THEN 1 END)
                FROM Follows
            )`),
            "followingCnt",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(CASE WHEN userId = '${id}' THEN 1 END)
                FROM Posts 
            )`),
            "postCnt",
          ],
        ],
      },
      include: {
        model: UserInfos,
        attributes: ["username", "nickname", "aboutMe", "profileUrl", "age"],
      },
      subQuery: true,
      where: { id },
    });

    return result;
  };

  // 닉네임 취득
  public checkNickname = async (nickname: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "checkNickname",
    });
    const result = await UserInfos.findOne({
      where: {
        nickname,
      },
    });

    return result;
  };

  // 모든 회원정보가져오기
  public findAllUser = async () => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "findAllUser",
    });
    const result = await Users.findAll({
      attributes: ["email"],
      include: {
        model: UserInfos,
        attributes: ["username", "aboutMe", "nickname"],
      },
    });

    return result;
  };

  // nickname수정
  public modifyNickname = async (userId: string, newNickname: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "modifyNickname",
    });
    await UserInfos.update(
      { nickname: newNickname },
      {
        where: {
          userId: userId,
        },
      },
    );
  };
  // aboutMe수정
  public modifyAboutMe = async (userId: string, aboutMe: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "modifyAboutMe",
    });
    await UserInfos.update(
      { aboutMe: aboutMe },
      {
        where: {
          userId: userId,
        },
      },
    );
  };
  // age수정
  public modifyAge = async (userId: string, age: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "modifyAge",
    });
    await UserInfos.update({ age }, { where: { userId } });
  };

  // password수정
  public modifyPasssword = async (userId: string, password: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "modifyPasssword",
    });
    await Users.update(
      { password: password },
      {
        where: {
          userId: userId,
        },
      },
    );
  };

  // 회원정보수정
  public modifyUserInfos = async (userInfo: ModifyUserEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "modifyUserInfos",
    });
    await UserInfos.update(userInfo, { where: { userId: userInfo.userId } });
  };

  // 회원탈퇴
  public deleteAccount = async (id: string) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "deleteAccount",
    });
    await Users.destroy({ where: { id } });
  };

  /**
   * 차단한 유저의 리스트가져오기
   *
   * @param blockedUserIds[]
   * @return blockedUserId, nickname
   */

  public getBlockedUsers = async (param: GetBlockedUsersEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "UserRepository",
      functionName: "getBlockedUsers",
    });
    const userIds = param.blockedUserIds.map((el) => {
      return {
        userId: el,
      };
    });
    return await Users.findAll({
      attributes: ["id"],
      include: {
        model: UserInfos,
        attributes: ["nickname"],
        where: {
          [Op.and]: userIds,
        },
      },
    });
  };
}

export default UserRepository;

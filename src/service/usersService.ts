import { SignupDto } from "../dtos/signupDto";
import { ModifyUserDto } from "../dtos/modifyUserDto";
import UserRepository from "../repositories/usersRepository";
import logger from "../config/logger";
import bcrypt from "bcrypt";
import {
  ChangeUserBackgroundImg,
  ChangeUserProfileImg,
  GetBlockedUsersDto,
  GetFindUserInfosDto,
} from "../dtos/userDto";
import { CustomError } from "../errors/customError";
import errorCodes from "../constants/error-codes.json";
import FollowRepository from "../repositories/followRepository";
import AlarmsRepository from "../repositories/alarmRepository";

class UserService {
  private userRepository = new UserRepository();
  private followRepository = new FollowRepository();
  private alarmsRepository = new AlarmsRepository();

  /**
   *
   * @param userInfo
   *
   * 회원가입
   */
  public createUser = async (userInfo: SignupDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "createUser",
      });
      // 중복된 이메일을 쓰는지 확인
      await this.checkUserByEmail(userInfo.email);
      // 중복된 닉네임인지 확인
      await this.checkNickname(userInfo.nickname);
      // password암호화하기
      const hashpassword = bcrypt.hashSync(
        userInfo.password,
        Number(process.env.SALT_ROUND),
      );
      // payment
      const signupUser = {
        email: userInfo.email,
        password: hashpassword,
      };

      // User회원가입
      await this.userRepository.createUser(signupUser);
      // email로 회원가입하는 회원의 id값을 가져옴
      const result = await this.findUserByEmail(userInfo.email);
      const signupUserInfo = {
        userId: result.id,
        username: userInfo.username,
        aboutMe: userInfo.aboutMe,
        nickname: userInfo.nickname,
        age: userInfo.age,
      };
      // userInfo저장
      await this.userRepository.createUserInfo(signupUserInfo);
    } catch (e) {
      throw e;
    }
  };

  public changeMyProfileImg = async ({
    userId,
    profileUrl,
    timestamp,
  }: ChangeUserProfileImg) => {
    logger.info("", {
      layer: "Service",
      className: "UserService",
      functionName: "changeMyProfileImg",
    });
    try {
      return await this.userRepository.changeMyProfileImg({
        userId,
        profileUrl,
        timestamp,
      });
    } catch (error) {
      throw error;
    }
  };

  public changeMyBackgroundImg = async ({
    userId,
    backgroundUrl,
    timestamp,
  }: ChangeUserBackgroundImg) => {
    logger.info("", {
      layer: "Service",
      className: "UserService",
      functionName: "changeMyProfileImg",
    });
    try {
      return await this.userRepository.changeMyBackgroundImg({
        userId,
        backgroundUrl,
        timestamp,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @returns 모든회원정보들
   *
   * 모든회원정보가져오기
   */
  public findAllUser = async () => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findAllUser",
      });
      const result = await this.userRepository.findAllUser();
      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 자신의 정보가져오기
   *
   * @param myId: string
   * @returns id, email, follower, folloing, blockedUsers, info
   */
  public findMyInfos = async (myId: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findMyInfos",
      });

      const result = await this.userRepository.findMyInfos(myId);

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 타유저의 정보가져오기
   *
   * @param userId
   * @returns
   */
  public findUserInfos = async (params: GetFindUserInfosDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findUserInfos",
      });
      const result = await this.userRepository.findUserInfos(params);
      let isFollowingedIds;
      if (params.myId) {
        const getMyFollowings = await this.followRepository.getFollowings({
          userId: params.myId,
        });
        isFollowingedIds = getMyFollowings.map(
          (el: { followingId: string }) => el.followingId,
        );
        result.isFollowingedIds = isFollowingedIds;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @param email
   * @returns 유저의 정보
   *
   * email로 특정회원정보찾기
   */
  public getUserInfo = async (email: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "getUserInfo",
      });
      await this.findUserByEmail(email);
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      throw error;
    }
  };

  public findUser = async (id: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findUser",
      });
      await this.findUserById(id);
      const result = await this.userRepository.findById(id);
      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @param userInfo
   *
   * 회원정보변경
   */
  public modifyUserInfo = async (userInfo: ModifyUserDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "modifyUserInfo",
      });
      await this.findUserById(userInfo.userId);
      await this.userRepository.modifyUserInfos(userInfo);
    } catch (error) {
      throw error;
    }
  };

  //

  /**
   *
   * @param userId
   * @returns 유저의 정보
   *
   * 특정회원의 정보(id)
   */
  public findUserById = async (userId: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findUserById",
      });

      const result = await this.userRepository.findById(userId);

      if (!result) {
        throw new CustomError(
          errorCodes.AUTH.USER_NOT_FOUND.status,
          errorCodes.AUTH.USER_NOT_FOUND.code,
          "존재하지않는 회원입니다.",
        );
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @param email
   *
   * 특정회원의 중복유무
   */
  public checkUserByEmail = async (email: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "checkUserByEmail",
      });
      const result = await this.userRepository.findByEmail(email);
      console.log("result = ", result);

      if (result) {
        throw new CustomError(
          errorCodes.AUTH.USER_ALREADY_EXISTS.status,
          errorCodes.AUTH.USER_ALREADY_EXISTS.code,
          "이미 존재하는 회원입니다. ",
        );
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @param nickname
   *
   * 닉네임중복체크
   */
  public checkNickname = async (nickname: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "checkNickname",
      });
      const result = await this.userRepository.checkNickname(nickname);
      if (result) {
        throw new CustomError(
          errorCodes.USER.NICKNAME_ALREADY_EXISTS.status,
          errorCodes.USER.NICKNAME_ALREADY_EXISTS.code,
          "이미 사용중인 닉네임입니다..",
        );
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * * 회원의 email로 회원정보가져오기
   * @param email
   * @returns 회원정보
   *
   *
  
   */
  public findUserByEmail = async (email: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "findUserByEmail",
      });

      const result = await this.userRepository.findByEmail(email);

      if (!result) {
        throw new CustomError(
          errorCodes.AUTH.USER_NOT_FOUND.status,
          errorCodes.AUTH.USER_NOT_FOUND.code,
          "존재하지않는 회원입니다.",
        );
      }

      return result;
    } catch (error) {
      throw error;
    }
  };
  /**
   *
   * @param id
   *
   * 회원탈퇴
   */
  public deleteUser = async (id: string) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "UserService",
        functionName: "deleteUser",
      });
      await this.findUserById(id);
      await this.alarmsRepository.deleteAlarmsByUser({ userId: id });
      await this.userRepository.deleteAccount(id);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 차단한 유저리스트 불러오기
   *
   * @param blockedUserIds[]
   *  @return blockedUserId, nickname
   */

  public getBlockedUsers = async (param: GetBlockedUsersDto) => {
    try {
      return await this.userRepository.getBlockedUsers(param);
    } catch (error) {
      throw error;
    }
  };
}

export default UserService;

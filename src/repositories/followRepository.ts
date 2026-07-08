import {
  FollowingEntity,
  GetFollowersEntity,
  GetFollowingsEntity,
  RemoveRelationshipEntity,
  StopFollowingEntity,
} from "../entity/followEntity";
import db from "../database/models/index";
import { Op } from "sequelize";
import logger from "../config/logger";
import UserInfos from "../database/models/user-infos";

const { Follows } = db;
class FollowRepository {
  // 팔로잉
  public following = async (params: FollowingEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "following",
      });
      return await Follows.create({
        followerId: params.userId,
        followingId: params.followingId,
      });
    } catch (error) {
      throw error;
    }
  };
  // 팔로잉 끊기
  public stopFollowing = async (params: StopFollowingEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "stopFollowing",
      });
      await Follows.destroy({
        where: {
          followerId: params.userId,
          followingId: params.followingId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // 자신이 팔로잉한 유저들을조회
  public getFollowings = async (param: GetFollowingsEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "getFollowings",
      });

      return await Follows.findAll({
        attributes: ["followingId"],
        where: {
          followerId: param.userId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // 자신의 팔로워들을조회
  public getFollowers = async (param: GetFollowersEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "getFollowers",
      });

      return await Follows.findAll({
        attributes: ["followerId"],
        where: {
          followingId: param.userId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  public getFollowInfos = async (params: string[]) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "getFollowInfos",
      });
      return await UserInfos.findAll({
        attributes: ["userId", "nickname", "username"],
        where: {
          userId: params,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // 팔로잉한 한명의 유저를 조회
  public getFollowing = async (params: FollowingEntity) => {
    try {
      logger.info("", {
        layer: "Repository",
        className: "FollowRepository",
        functionName: "getFollowing",
      });
      return await Follows.findOne({
        where: {
          followingId: params.followingId,
          followerId: params.userId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // 차단시 양방향팔로잉취소
  public removeRelationship = async ({
    userId1,
    userId2,
  }: RemoveRelationshipEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "FollowRepository",
      functionName: "removeRelationship",
    });
    try {
      await Follows.destroy({
        where: {
          [Op.or]: [
            {
              followerId: userId1,
              followingId: userId2,
            },
            {
              followerId: userId2,
              followingId: userId1,
            },
          ],
        },
      });
    } catch (error) {
      throw error;
    }
  };
}

export default FollowRepository;

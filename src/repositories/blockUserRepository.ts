import {
  BlockUserEntity,
  UnBlockUserEntity,
  FindBlockRelationEntity,
} from "../entity/blockUserEntity";
import logger from "../config/logger";
import db from "../database/models/index";
import { QueryTypes } from "sequelize";

const { BlockUsers } = db;

class BlockUserRepository {
  /**
   * 유저차단하기
   */
  public blockUser = async (blockUserPayment: BlockUserEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "BlockUserRepository",
      functionName: "blockUser",
    });
    const { blockedId, blockerId } = blockUserPayment;
    await BlockUsers.create({
      blockerId,
      blockedId,
    });
  };

  /**
   * 유저차단풀기
   */
  public unBLockUser = async (unBlockUserPayment: UnBlockUserEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "BlockUserRepository",
      functionName: "unBLockUser",
    });
    const { blockedId, blockerId } = unBlockUserPayment;
    await BlockUsers.destroy({
      where: {
        blockerId,
        blockedId,
      },
    });
  };

  /**
   * 자신이 차단한 유저리스트 불러오기
   *
   */
  public blockByMe = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "BlockUserRepository",
      functionName: "blockByMe",
    });
    return await db.sequelize.query(
      `
      SELECT blockUsers.blockedId,
	           userInfos.profileUrl,
             blockUsers.createdAt
        FROM BlockUsers blockUsers
        JOIN UserInfos as userInfos
          ON blockUsers.blockedId = userInfos.userId
       WHERE blockUsers.blockerId = :userId
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      },
    );
  };

  /**
   * 자신을 차단한 유저리스트 불러오기
   *
   */
  public blockedMe = async (userId: string) => {
    logger.info("", {
      layer: "Repository",
      className: "BlockUserRepository",
      functionName: "blockedMe",
    });
    return await BlockUsers.findAll({
      attributes: ["blockerId", "createdAt"],
      where: {
        blockedId: userId,
      },
    });
  };

  /**
   * 내가 상대유저를 차단했는지의 여부구하기
   *
   */
  public findBlockRelation = async ({
    myId,
    userId,
  }: FindBlockRelationEntity) => {
    logger.info("", {
      layer: "Repository",
      className: "BlockUserRepository",
      functionName: "findBlockRelation",
    });

    const result = await BlockUsers.findOne({
      where: {
        blockerId: myId,
        blockedId: userId,
      },
    });
    return !!result;
  };
}

export default BlockUserRepository;

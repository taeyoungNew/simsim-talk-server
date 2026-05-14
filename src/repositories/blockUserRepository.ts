import {
  BlockUserEntity,
  UnBlockUserEntity,
  BlockUserListEntity,
} from "../entity/blockUserEntity";
import logger from "../config/logger";
import BlockUser from "../database/models/block-user";
import Users from "../database/models/users";
import UserInfos from "../database/models/user-infos";
import sequelize from "sequelize";

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
    await BlockUser.create({
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
    await BlockUser.destroy({
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
    await BlockUser.findAll({
      attributes: ["id", "createdAt"],
      where: {
        blockerId: userId,
      },
    });
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
    await BlockUser.findAll({
      attributes: ["id", "createdAt"],
      where: {
        blockedId: userId,
      },
    });
  };
}

export default BlockUserRepository;

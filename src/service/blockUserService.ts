import {
  BlockUserDto,
  BlockUserListDto,
  FilterBlockedPostsDto,
  FindBlockRelationDto,
  UnBlockUserDto,
} from "../dtos/blockUserDto";
import UserService from "./usersService";
import BlockUserRepository from "../repositories/blockUserRepository";
import logger from "../config/logger";

class BlockUserService {
  private blockUserRepository = new BlockUserRepository();
  private userService = new UserService();

  /**
   * 내가 차단한 유저의 Id리스트 조회
   *
   */
  public blockByMe = async (userId: string) => {
    logger.info("", {
      layer: "Service",
      className: "BlockUserService",
      functionName: "blockByMe",
    });
    try {
      return this.blockUserRepository.blockByMe(userId);
    } catch (error) {
      throw error;
    }
  };
  /**
   * 상대를 내가 차단했는지의 여부구하기
   */
  public isBlocked = async ({ myId, userId }: FindBlockRelationDto) => {
    const block = await this.blockUserRepository.findBlockRelation({
      myId,
      userId,
    });

    return !!block;
  };

  /**
   * 나를 차단한 유저의 Id리스트조회
   *
   */
  public blockedMe = async (userId: string) => {
    logger.info("", {
      layer: "Service",
      className: "BlockUserService",
      functionName: "blockedMe",
    });
    try {
      return this.blockUserRepository.blockedMe(userId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 유저차단
   */
  public blockUser = async (blockUserPayment: BlockUserDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "BlockUserService",
        functionName: "blockUser",
      });
      const { blockedId, blockerId } = blockUserPayment;
      // 차단할 유저가 존재하는지 유무
      await this.userService.findUserById(blockedId);

      await this.blockUserRepository.blockUser(blockUserPayment);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 유저차단풀기
   */
  public unBLockUser = async (unBlockUserPayment: UnBlockUserDto) => {
    try {
      logger.info("", {
        layer: "Service",
        className: "BlockUserService",
        functionName: "unBLockUser",
      });
      const { blockedId, blockerId } = unBlockUserPayment;
      // 차단을 해제할 유저가 존재하는지 유무
      await this.userService.findUserById(blockedId);

      await this.blockUserRepository.unBLockUser(unBlockUserPayment);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 차단한유저의 게시물필터
   */
  public filterBlockedPosts = async ({
    limit,
    posts,
    userId,
  }: FilterBlockedPostsDto) => {
    logger.info("", {
      layer: "Service",
      className: "BlockUserService",
      functionName: "filterBlockedPosts",
    });
    try {
      let result;
      if (!userId) {
        return posts;
      }

      const blockedIds = await this.getBlockedIds(userId);

      if (blockedIds !== null) {
        result = posts.filter((el) => {
          return !blockedIds.has(el.userId);
        });
      } else {
        result = posts;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  // 나를 차단한 나에게 차단당한 유저id리스트 가져오기
  public getBlockedIds = async (userId: string) => {
    logger.info("", {
      layer: "Service",
      className: "BlockUserService",
      functionName: "getBlockedIds",
    });
    try {
      if (!userId) return new Set();
      const blockByMeIds = (await this.blockByMe(userId)).map(
        (block: { blockedId: string }) => block.blockedId,
      );
      const blockedMeIds = (await this.blockedMe(userId)).map(
        (block: { blockerId: string }) => block.blockerId,
      );

      const blockedIds = new Set([...blockByMeIds, ...blockedMeIds]);
      return blockedIds ? blockedIds : null;
    } catch (error) {
      throw error;
    }
  };
}

export default BlockUserService;

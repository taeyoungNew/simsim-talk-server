import { Router } from "express";
import BlockUserHandler from "../handlers/blockUserHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { isLogoutMiddleware } from "../middlewares/isLogout.middleware";

const blockUserRouter = Router();
const blockUserHandler = new BlockUserHandler();

// 해당유저 차단하기
blockUserRouter.post(
  "/:blockUserId",
  isLogoutMiddleware,
  authMiddleware,
  blockUserHandler.blockUser,
);
// 해당유저 차단풀기
blockUserRouter.delete(
  "/:unblockedId",
  isLogoutMiddleware,
  authMiddleware,
  blockUserHandler.unBlockUser,
);
// 자신이 차단한 유저리스트가져오기
blockUserRouter.get(
  "/blocked-list",
  isLogoutMiddleware,
  authMiddleware,
  blockUserHandler.blockByMeUserList,
);

export default blockUserRouter;

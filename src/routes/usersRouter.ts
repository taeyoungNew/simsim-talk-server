import { Router } from "express";
import UserHandler from "../handlers/usersHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { isLoginMiddleware } from "../middlewares/isLogin.middleware";
import { isLogoutMiddleware } from "../middlewares/isLogout.middleware";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware";
import upload from "../middlewares/upload.middleware";

const userRouter = Router();

const userHandler = new UserHandler();

// 회원가입
userRouter.post("/signup", userHandler.createUser);

// 나의 프로필사진바꾸기
userRouter.patch(
  "/my-profile-img",
  isLogoutMiddleware,
  authMiddleware,
  upload.single("file"),
  userHandler.changeMyProfileImg,
);

userRouter.patch(
  "/my-background-img",
  isLogoutMiddleware,
  authMiddleware,
  upload.single("file"),
  userHandler.changeMyBackgroundImg,
);

// 모든회원정보가져오기
userRouter.get("/", userHandler.findAllUser);

// 나의 회원정보 가져오기
userRouter.get(
  "/my-info",
  isLogoutMiddleware,
  authMiddleware,
  userHandler.findMyInfos,
);

// 특정유저의 회원정보 가져오기
userRouter.get(
  `/user-info/:userId`,
  optionalAuthMiddleware,
  userHandler.findUserInfos,
);

// 차단한 유저의 리스트 가져오기
userRouter.get(
  "/get-blockedusers-list",
  isLogoutMiddleware,
  authMiddleware,
  userHandler.getBlockedUsers,
);

// 특정회원정보가져오기
userRouter.get("/:email", userHandler.findUserByEmail);

// 회원정보변경하기
userRouter.put(
  "/:id",
  isLogoutMiddleware,
  authMiddleware,
  userHandler.modifyUserInfo,
);

// 회원탈퇴
userRouter.delete(
  "/delete-user/:password",
  isLogoutMiddleware,
  authMiddleware,
  userHandler.deleteUser,
);

export default userRouter;

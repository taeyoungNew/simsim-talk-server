import { Router } from "express";
import ChatHandler from "../handlers/chatHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { isLogoutMiddleware } from "../middlewares/isLogout.middleware";

const chatRouter = Router();
const chatHandler = new ChatHandler();

// 채팅방만들기
chatRouter.post(
  "/create-chatroom",
  isLogoutMiddleware,
  authMiddleware,
  chatHandler.createChatRoom,
);
// 나의 채팅방리스트 가져오기
chatRouter.get(
  "/get-chatlist",
  isLogoutMiddleware,
  authMiddleware,
  chatHandler.getChatList,
);

export default chatRouter;

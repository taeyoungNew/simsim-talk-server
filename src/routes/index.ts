import express from "express";
import authRouter from "../routes/authRouter";
import userRouter from "./usersRouter";
import postRouter from "./postRouter";
import commentRouter from "./commentRouter";
import followRouter from "./followRouter";
import postLikeRouter from "./postLikeRouter";
import blockUserRouter from "./blockUsersRouter";
import chatRouter from "./chatRouter";
import uploadRouter from "./uploadRouter";
import messageAlarmRouter from "./messageAlarmRouter";
import userRelationRouter from "./userRelationRouter";
import alarmRouter from "./alarmRouter";
import suggestedUserRouter from "./suggestedUserRouter";
import elasticSearchRouter from "./searchRouter";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/post", postRouter);
router.use("/comment", commentRouter);
router.use("/follow", followRouter);
router.use("/post-like", postLikeRouter);
router.use("/block-user", blockUserRouter);
router.use("/chat", chatRouter);
router.use("/upload", uploadRouter);
router.use("/message-alarm", messageAlarmRouter);
router.use("/user-relation", userRelationRouter);
router.use("/alarms", alarmRouter);
router.use("/suggested-user", suggestedUserRouter);
router.use("/elastic-search", elasticSearchRouter);

export default router;

import { Server, Socket } from "socket.io";
import * as cookie from "cookie";
import { socketLogin, socketLogout } from "./emitters/auth";
// import dotenv from "dotenv";
import { joinChatRoom, leaveChatRoom } from "./emitters/chat";
import { emitSendMessage } from "./emitters/message";
import { getChatHistory } from "./emitters/message";
import {
  notifyMessageAlarm,
  readMsgAlarms,
  saveMessageAlarm,
  sendMessageAlarmToMe,
} from "./emitters/messageAlarm";
import { decodeSocketUser } from "./utils/decodeSocketUser";
import MessagealarmsRepository from "../repositories/messageAlarmRepository";
import logger from "../config/logger";
import { initSocketServer } from "./socket.server";
import { onlineUsers } from "./onlineUsers.store";
import { isUserOnline } from "./onlineUsers.service";
import verifyAccToken from "../middlewares/common/varifyAccToken";
import { tokenType } from "../types/tokenType";

export const setupSocket = (server: any) => {
  const socketIdToUserId = new Map<string, string>();
  let userId: string;

  const io = initSocketServer(server);

  io.on("connection", async (socket) => {
    const socketId = socket.id;
    const decodeAccToken = decodeSocketUser(socket);
    logger.info("", {
      layer: "socket",
      connect: "socket connected!",
    });
    socket.emit("connection", "socket connected!");

    if (decodeAccToken && decodeAccToken != "jwt expired") {
      userId = decodeAccToken?.userId;
      socket.data.userId = userId;

      await sendMessageAlarmToMe(socket, userId);
    }

    broadcastOnlineUsers(socket);

    // 현재 로그인중인 유저정보들을 커넥트한클라이언트에 전달
    socket.on("loginJoinOnlineRoom", async (param, ack) => {
      socketIdToUserId.set(socketId, param.userId);
      socket.data.userId = param.userId;

      await socketLogin(socket, param.userId);
      (socket as any).userId = param.userId;

      if (!isUserOnline(param.userId)) {
        // 첫로그인
        onlineUsers.set(param.userId, {
          lastPing: Date.now(),
          socketIds: new Set([socketId]),
        });
      } else {
        // 한유저가 여러탭이나 다른 브라우저 및 기기에서 접속할수있기때문
        const onlineUser = onlineUsers.get(param.userId);
        onlineUser.socketIds.add(socketId);
      }

      // ❗ 반드시 ack 호출
      if (typeof ack === "function") {
        ack({ ok: true });
      }
      broadcastOnlineUsers(socket);
    });

    socket.on("getMsgAlarms", async (_, ack) => {
      const decodeAccToken = decodeSocketUser(socket);

      if (decodeAccToken && decodeAccToken != "jwt expired") {
        userId = decodeAccToken?.userId;
        const messageAlarmRepository = new MessagealarmsRepository();
        const getMsgAlarms =
          await messageAlarmRepository.findUnreadByUser(userId);

        await ack({ ok: true, reason: getMsgAlarms });
      } else {
        return ack({ ok: false, reason: "NO_COOKIE" });
      }
    });

    socket.on("msgAlarmsRead", async (param) => {
      const decodeAccToken = decodeSocketUser(socket);
      const { chatRoomId } = param;
      if (decodeAccToken && decodeAccToken != "jwt expired") {
        userId = decodeAccToken?.userId;

        const sockets = onlineUsers.get(userId);

        if (!sockets || sockets.socketIds.size === 0) {
          return;
        }
        sockets.socketIds?.forEach((socketId) => {
          readMsgAlarms(io, chatRoomId, socketId);
        });
      }
    });

    socket.on("sendMessage", async (param) => {
      let isJoined = false;
      const { targetUserId, chatRoomId } = param;

      const receiverSocketInfo = onlineUsers.get(targetUserId);
      const room = io.sockets.adapter.rooms.get(chatRoomId);
      const result = await emitSendMessage(io, socket, param);

      const messageId = result.id;

      // 여기서 상대방이 조인했는지 안했는지 확인
      isJoined =
        receiverSocketInfo?.socketIds &&
        Array.from(receiverSocketInfo?.socketIds).some((socketId) => {
          return room?.has(socketId);
        });

      if (!isJoined) {
        const userSocketInfo = onlineUsers.get(targetUserId);
        const alarmData = await saveMessageAlarm(
          socket,
          chatRoomId,
          targetUserId,
          messageId,
        );

        if (userSocketInfo) {
          userSocketInfo.socketIds.forEach((socketId) =>
            notifyMessageAlarm(io, socketId, alarmData),
          );
        }
      }
    });
    socket.on("sendImageOrFile", async () => {});

    // 해당채팅방의 메세지를 불러오는 이벤트
    socket.on("getChatHistory", async ({ chatRoomId }) => {
      getChatHistory(socket, chatRoomId);
    });

    socket.on("joinChatRoom", ({ targetUserId, chatRoomId }) => {
      joinChatRoom(socket, chatRoomId);
    });

    socket.on("leaveChatRoom", ({ chatRoomId }) => {
      leaveChatRoom(socket, chatRoomId);
    });

    socket.on("heartbeat", ({ userId }) => {
      const onlineUserInfo = onlineUsers.get(userId);
      if (onlineUserInfo) {
        onlineUserInfo.lastPing = Date.now();
      }
    });

    socket.on("registerOnline", async ({ userId }) => {
      const rawCookie = socket.request.headers.cookie;
      if (!rawCookie) return;
      const parsed = cookie.parse(rawCookie);

      const auth = parsed.authorization;

      if (!auth) return;
      const [type, token] = auth.split(" ");
      const accTokenPayment: tokenType = {
        token: token,
        type: "accToken",
      };
      const decodeToken = verifyAccToken(accTokenPayment);

      if (typeof decodeToken !== "string") {
        if (!isUserOnline(decodeToken.userId)) {
          onlineUsers.set(decodeToken.userId, {
            lastPing: Date.now(),
            socketIds: new Set([socketId]),
          });
        }
      }

      if (socketIdToUserId.has(socket.id)) return;

      // socketIdToUserId에 등록
      socketIdToUserId.set(socket.id, userId);

      // onlineUsers에 등록
      const userInfo = onlineUsers.get(userId);

      if (!userInfo) return;
      userInfo.socketIds.add(socket.id);
      onlineUsers.set(userId, userInfo);

      // 전체 클라이언트에 온라인 유저 목록 브로드캐스트
      broadcastOnlineUsers(socket);
    });

    socket.on("loginLeaveOnlineRoom", async (param) => {
      const userId = param.userId;
      await socketLogout(socket, userId);
      // 로그아웃 처리 후 소켓 제거
      const onlineUserInfo = onlineUsers.get(userId);
      if (onlineUserInfo) {
        onlineUserInfo.socketIds.delete(socketId);
      }

      // 2. Set이 비면 → 유저 전체 오프라인 처리
      if (
        onlineUserInfo?.socketIds !== undefined &&
        onlineUserInfo.socketIds.size === 0
      ) {
        onlineUsers.delete(userId);
      }

      broadcastOnlineUsers(socket);
    });

    socket.on("disconnect", () => {
      const userId = socketIdToUserId.get(socket.id);
      const onlineUserInfo = onlineUsers.get(userId);
      if (!userId) return;
      if (!onlineUserInfo) return;

      setTimeout(() => {
        const latestUserId = socketIdToUserId.get(socket.id);
        if (!latestUserId) return;

        const latestUserInfo = onlineUsers.get(latestUserId);
        if (!latestUserInfo) return;
        onlineUserInfo.socketIds.delete(socket.id);
        if (onlineUserInfo.socketIds.size === 0) {
          onlineUsers.delete(userId);
        } else {
          onlineUsers.set(latestUserId, latestUserInfo);
        }
        socketIdToUserId.delete(socket.id);
        broadcastOnlineUsers(socket);
      }, 3000);
    });

    // ✅ 4. 진짜 마지막에
    socket.emit("socketReady");
  });

  function broadcastOnlineUsers(socket: Socket) {
    const users = [...onlineUsers.keys()];

    io.emit("onlineUsers", users);
  }

  return io;
};

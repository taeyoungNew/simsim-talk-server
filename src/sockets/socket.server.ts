import { Server } from "socket.io";
let io: Server;

export const initSocketServer = (httpServer: any) => {
  console.log("🔥 SOCKET CORS VERSION 2");
  io = new Server(httpServer, {
    cors: {
      // origin: [
      //   "http://localhost:5173",
      //   "https://simsim-talk-client.vercel.app",
      // ],
      // origin: `${process.env.CORS_ORIGIN}`,
      origin: (origin, callback) => {
        if (
          !origin ||
          origin.endsWith(".vercel.app") ||
          origin === "http://localhost:5173"
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

export const getIO = () => io;

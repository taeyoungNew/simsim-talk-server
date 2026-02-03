import { Server } from "socket.io";
let io: Server;

export const initSocketServer = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: `${process.env.CORS_ORIGIN}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

export const getIO = () => io;

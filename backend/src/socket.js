const { Server } = require("socket.io");
const { isAllowedOrigin } = require("./config/corsOptions");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  io.on("connection", (socket) => {
    socket.emit("realtime:connected", { connected: true });
  });

  return io;
};

const getIO = () => io;

const emitGameEvent = (event, payload) => {
  if (!io) {
    return;
  }
  io.emit(event, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitGameEvent
};

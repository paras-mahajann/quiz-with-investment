import { io } from "socket.io-client";

const SOCKET_EVENTS = [
  "question:added",
  "question:pushed",
  "answer:submitted",
  "answer:revealed",
  "participant:registered",
  "game:reset",
  "balance:default-applied"
];

const socketBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true
    });
  }
  return socket;
};

export const subscribeToGameUpdates = (handler) => {
  const client = getSocket();
  SOCKET_EVENTS.forEach((event) => client.on(event, handler));

  return () => {
    SOCKET_EVENTS.forEach((event) => client.off(event, handler));
  };
};

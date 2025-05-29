import React, { createContext, useContext, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Create the socket instance
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ["websocket"],
  secure: true,
});

// Create a context for the socket
export const SocketContext = createContext<Socket | null>(null);

// Provider component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a ref to persist the socket instance
  const socketRef = useRef(socket);
  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for easy usage
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

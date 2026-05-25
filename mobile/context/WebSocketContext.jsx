import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthProvider";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      if (ws.current) {
        ws.current.close();
      }
      return;
    }

    const connect = () => {
      // Connect to secure WebSocket URL matching baseURL configuration
      const wsUrl = `wss://polydl.ru/api/ws?token=${token}`;
      console.log("[WS] Connecting to:", wsUrl);

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[WS] Connected");
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS] Message received:", data);
          setLastMessage(data);
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      socket.onclose = () => {
        console.log("[WS] Disconnected");
        setIsConnected(false);
        // Clean reconnection attempt
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      socket.onerror = (error) => {
        console.error("[WS] Error:", error);
        socket.close();
      };

      ws.current = socket;
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ lastMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { wsService, WebSocketService } from "@/services/websocket";

interface WebSocketContextType {
  isConnected: boolean;
  service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = async () => {
      try {
        await wsService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setIsConnected(false);
      }
    };

    connect();

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(wsService.isConnected);
    }, 5000);

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, service: wsService }}>
      {children}
    </WebSocketContext.Provider>
  );
};

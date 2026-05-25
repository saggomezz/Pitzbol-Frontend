import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { getSocketBackendOrigin } from './backendUrl';

const BACKEND_URL = getSocketBackendOrigin();

interface UseChatSocketOptions {
  userId: string;
  userType: 'tourist' | 'guide';
  enabled?: boolean;
}

interface ChatNotification {
  chatId: string;
  message: string;
  senderName: string;
  timestamp: Date;
}

export function useChatSocket({ userId, userType, enabled = true }: UseChatSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const token = localStorage.getItem("pitzbol_token");
    if (!token) return;
    
    // Conectar al servidor de Socket.IO
    socketRef.current = io(BACKEND_URL, {
      auth: {
        token,
      },
    });

    socketRef.current.on("connect_error", (error) => {
      if (error?.message === "Invalid token" || error?.message === "Authentication required") {
        socketRef.current?.disconnect();
      }
    });

    socketRef.current.on("connect", () => {
      console.log("Socket conectado para notificaciones");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket desconectado");
      setIsConnected(false);
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userType, enabled]);

  const joinChat = (chatId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-chat", chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-chat", chatId);
    }
  };

  const sendMessage = (data: {
    chatId: string;
    senderId: string;
    senderName: string;
    senderType: 'tourist' | 'guide';
    content: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("send-message", data);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    joinChat,
    leaveChat,
    sendMessage,
    clearNotifications,
  };
}

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface UnreadMessage {
  chatId: string;
  count: number;
  lastMessage: string;
  senderName: string;
  timestamp: Date;
}

interface UseMessageNotificationsOptions {
  userId: string;
  userType: 'tourist' | 'guide';
  enabled?: boolean;
}

export function useMessageNotifications({ userId, userType, enabled = true }: UseMessageNotificationsOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState<UnreadMessage[]>([]);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    message: string;
    senderName: string;
    chatId: string;
  } | null>(null);

  // Función para obtener mensajes no leídos del servidor
  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      const token = localStorage.getItem("pitzbol_token");
      const response = await fetch(
        `${BACKEND_URL}/api/chat/unread/${userId}?userType=${userType}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.totalUnread || 0);
          setUnreadChats(data.chats || []);
        }
      }
    } catch (error) {
      console.error("Error al obtener mensajes no leídos:", error);
    }
  }, [userId, userType, enabled]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const token = localStorage.getItem("pitzbol_token");
    
    // Conectar al servidor de Socket.IO
    socketRef.current = io(BACKEND_URL, {
      auth: {
        token: token || "",
        userId: userId,
        userType: userType,
      },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket conectado para notificaciones");
      setIsConnected(true);
      
      // Obtener conteo inicial de mensajes no leídos
      fetchUnreadCount();
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket desconectado");
      setIsConnected(false);
    });

    // Escuchar nuevos mensajes para actualizar notificaciones
    socketRef.current.on("new-message", (message: any) => {
      // Solo contar si el mensaje no es del usuario actual
      if (message.senderId !== userId) {
        setUnreadCount(prev => prev + 1);
        
        // Actualizar lista de chats no leídos
        setUnreadChats(prev => {
          const existingChat = prev.find(chat => chat.chatId === message.chatId);
          if (existingChat) {
            return prev.map(chat => 
              chat.chatId === message.chatId
                ? {
                    ...chat,
                    count: chat.count + 1,
                    lastMessage: message.content,
                    timestamp: message.timestamp,
                  }
                : chat
            );
          } else {
            return [
              ...prev,
              {
                chatId: message.chatId,
                count: 1,
                lastMessage: message.content,
                senderName: message.senderName,
                timestamp: message.timestamp,
              },
            ];
          }
        });

        // Mostrar notificación temporal
        setNewMessageNotification({
          message: message.content,
          senderName: message.senderName,
          chatId: message.chatId,
        });

        // Ocultar notificación después de 5 segundos
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);

        // Intentar mostrar notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Nuevo mensaje de ${message.senderName}`, {
            body: message.content.substring(0, 100),
            icon: '/logo.png',
            tag: message.chatId,
          });
        }
      }
    });

    // Escuchar evento de mensaje leído
    socketRef.current.on("messages-read", (data: { chatId: string; userId: string }) => {
      if (data.userId === userId) {
        // Actualizar conteo de no leídos
        setUnreadChats(prev => prev.filter(chat => chat.chatId !== data.chatId));
        fetchUnreadCount();
      }
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userType, enabled, fetchUnreadCount]);

  const markChatAsRead = useCallback(async (chatId: string) => {
    if (!socketRef.current?.connected) return;

    try {
      const token = localStorage.getItem("pitzbol_token");
      const response = await fetch(
        `${BACKEND_URL}/api/chat/${chatId}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        // Emitir evento de socket para notificar a otros
        socketRef.current.emit('mark-as-read', { chatId, userId });
        
        // Actualizar estado local
        setUnreadChats(prev => prev.filter(chat => chat.chatId !== chatId));
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error);
    }
  }, [userId, fetchUnreadCount]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const clearNotification = () => {
    setNewMessageNotification(null);
  };

  return {
    socket: socketRef.current,
    isConnected,
    unreadCount,
    unreadChats,
    newMessageNotification,
    markChatAsRead,
    requestNotificationPermission,
    clearNotification,
    refreshUnreadCount: fetchUnreadCount,
  };
}

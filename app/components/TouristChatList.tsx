"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiMessageCircle, FiUser } from "react-icons/fi";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Chat {
  id: string;
  touristId: string;
  touristName: string;
  guideId: string;
  guideName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  updatedAt: Date;
}

interface TouristChatListProps {
  touristId: string;
  onSelectChat: (chat: Chat) => void;
}

export default function TouristChatList({ touristId, onSelectChat }: TouristChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("pitzbol_token");
        
        console.log("Fetching chats for tourist:", touristId);
        
        const response = await fetch(
          `${BACKEND_URL}/api/chat/user/${touristId}?userType=tourist`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
        if (!response.ok) {
          setError(data.msg || "Error al cargar los chats");
          return;
        }

        if (data.success) {
          setChats(data.chats);
          
          // Conectar socket para recibir actualizaciones en tiempo real
          const token = localStorage.getItem("pitzbol_token");
          socketRef.current = io(BACKEND_URL, {
            auth: {
              token: token || "",
            },
          });

          socketRef.current.on("connect", () => {
            console.log("Conectado al servidor de chat");
            // Unirse a todos los chats del turista
            data.chats.forEach((chat: Chat) => {
              socketRef.current?.emit("join-chat", chat.id);
            });
          });

          // Escuchar nuevos mensajes para actualizar la lista
          socketRef.current.on("new-message", (message: any) => {
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.id === message.chatId) {
                  return {
                    ...chat,
                    lastMessage: message.content,
                    lastMessageTime: message.timestamp,
                    unreadCount: message.senderId !== touristId 
                      ? (chat.unreadCount || 0) + 1 
                      : chat.unreadCount,
                    updatedAt: message.timestamp,
                  };
                }
                return chat;
              }).sort((a, b) => {
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();
                return dateB - dateA;
              });
            });
          });

          // Escuchar cuando los mensajes son marcados como leídos
          socketRef.current.on("messages-read", (data: { chatId: string; userId: string }) => {
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.id === data.chatId) {
                  return {
                    ...chat,
                    unreadCount: 0,
                  };
                }
                return chat;
              });
            });
          });
        } else {
          setError(data.msg || "No se pudieron cargar los chats");
        }
      } catch (error) {
        console.error("Error al cargar chats:", error);
        setError("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (touristId) {
      fetchChats();
    }

    // Limpiar socket al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [touristId]);

  const formatTime = (date?: Date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return messageDate.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-red-800 font-bold text-lg mb-2">Error</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <FiMessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
        <h3 className="text-gray-700 font-bold text-xl mb-2">No tienes conversaciones</h3>
        <p className="text-gray-500">
          Cuando contactes a un guía, tus conversaciones aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelectChat(chat)}
          className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="bg-[#1A4D2E] text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <FiUser size={24} />
            </div>

            {/* Información del chat */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800 truncate">
                  {chat.guideName}
                </h4>
                <span className="text-xs text-gray-500 shrink-0 ml-2">
                  {formatTime(chat.lastMessageTime)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {chat.lastMessage || "Inicia la conversación"}
              </p>
            </div>

            {/* Badge de mensajes no leídos */}
            {chat.unreadCount && chat.unreadCount > 0 && (
              <div className="bg-[#1A4D2E] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

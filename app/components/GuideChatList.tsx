"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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

interface GuideChatListProps {
  guideId: string;
  onSelectChat: (chat: Chat) => void;
}

export default function GuideChatList({ guideId, onSelectChat }: GuideChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("pitzbol_token");
      
      console.log("🔄 Fetching chats for guide:", guideId);
      console.log("Token exists:", !!token);
      console.log("Backend URL:", BACKEND_URL);
      
      if (!token) {
        console.warn("⚠️ No token found, user might not be authenticated");
        setError("No se encontró token de autenticación");
        setLoading(false);
        return;
      }
      
      // Cache-busting con timestamp
      const timestamp = new Date().getTime();
      const url = `${BACKEND_URL}/api/chat/user/${guideId}?userType=guide&_t=${timestamp}`;
      console.log("Fetching URL:", url);
      
      // Crear un timeout para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        const data = await response.json();
        console.log("📋 Chat data:", data);
        
        if (!response.ok) {
          const errorMsg = data.msg || `Error ${response.status}: ${response.statusText}`;
          console.error("❌ Error response:", errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        if (data.success) {
          setChats(data.chats);

          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          
          // Conectar socket para recibir actualizaciones en tiempo real
          const token = localStorage.getItem("pitzbol_token");
          socketRef.current = io(BACKEND_URL, {
            auth: {
              token: token || "",
            },
          });

          socketRef.current.on("connect", () => {
            console.log("Conectado al servidor de chat");
            // Unirse a todos los chats del guía
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
                    unreadCount: message.senderId !== guideId 
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
          const errorMsg = data.msg || "No se pudieron cargar los chats";
          console.error("❌ API error:", errorMsg);
          setError(errorMsg);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('La petición tardó demasiado tiempo. El servidor no respondió.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("❌ Error al cargar chats:", error);
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);
      
      let errorMessage = "Error al conectar con el servidor";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "No se pudo conectar al servidor. Verifica que el backend esté corriendo en " + BACKEND_URL;
      } else if (error.name === 'AbortError' || error.message?.includes('tardó demasiado')) {
        errorMessage = "El servidor tardó demasiado en responder";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [guideId]);

  useEffect(() => {
    if (guideId) {
      fetchChats();
    }

    // Escuchar eventos de actualización de perfil
    const handleProfileUpdate = () => {
      console.log("🔔 Perfil actualizado, recargando chats...");
      fetchChats();
    };

    window.addEventListener('guideProfileUpdated', handleProfileUpdate);
    window.addEventListener('fotoPerfilActualizada', handleProfileUpdate);

    // Limpiar socket al desmontar
    return () => {
      window.removeEventListener('guideProfileUpdated', handleProfileUpdate);
      window.removeEventListener('fotoPerfilActualizada', handleProfileUpdate);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [guideId, fetchChats]);

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
        {error.includes("Token") && (
          <p className="text-red-500 text-xs mb-3">
            Por favor, cierra sesión e inicia sesión nuevamente
          </p>
        )}
        <button
          onClick={fetchChats}
          className="mt-2 px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#143d24] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <FiMessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
        <h3 className="text-gray-700 font-bold text-xl mb-2">No tienes mensajes</h3>
        <p className="text-gray-500">
          Cuando los turistas te contacten, sus mensajes aparecerán aquí
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
            <div className="bg-[#1A4D2E] text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <FiUser size={24} />
            </div>

            {/* Información del chat */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800 truncate">
                  {chat.touristName}
                </h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(chat.lastMessageTime)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {chat.lastMessage || "Inicia la conversación"}
              </p>
            </div>

            {/* Badge de mensajes no leídos */}
            {chat.unreadCount && chat.unreadCount > 0 && (
              <div className="bg-[#1A4D2E] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

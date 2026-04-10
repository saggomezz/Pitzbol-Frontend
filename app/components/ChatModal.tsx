"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiX, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import { io, Socket } from "socket.io-client";
import { getSocketBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getSocketBackendOrigin();

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: "tourist" | "guide";
  content: string;
  timestamp: Date;
  read: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideId: string;
  guideName: string;
  touristId: string;
  touristName: string;
  currentUserType: "tourist" | "guide"; // Nuevo prop
  currentUserId: string; // Nuevo prop
  currentUserName: string; // Nuevo prop
  onChatDeleted?: () => void; // Callback cuando se elimina el chat
}

export default function ChatModal({
  isOpen,
  onClose,
  guideId,
  guideName,
  touristId,
  touristName,
  currentUserType,
  currentUserId,
  currentUserName,
  onChatDeleted,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentGuideName, setCurrentGuideName] = useState(guideName);
  const [currentTouristName, setCurrentTouristName] = useState(touristName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar nombres cuando cambien los props
  useEffect(() => {
    setCurrentGuideName(guideName);
    setCurrentTouristName(touristName);
  }, [guideName, touristName]);

  // Inicializar chat y socket
  useEffect(() => {
    if (!isOpen) return;

    const initChat = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem("pitzbol_token");
        
        // Obtener o crear chat
        const response = await fetch(`/api/chat/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            touristId,
            guideId,
            touristName,
            guideName,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error("Error en la respuesta:", data);
          setError(data.msg || "Error al crear el chat. Por favor, inicia sesión.");
          return;
        }
        
        if (data.success) {
          setChatId(data.chat.id);
          
          // Actualizar nombres desde el backend si están disponibles
          if (data.chat.guideName) {
            setCurrentGuideName(data.chat.guideName);
          }
          if (data.chat.touristName) {
            setCurrentTouristName(data.chat.touristName);
          }

          // Cargar mensajes existentes
          const messagesResponse = await fetch(
            `/api/chat/${data.chat.id}/messages`,
            {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );
          const messagesData = await messagesResponse.json();
          if (messagesData.success) {
            setMessages(messagesData.messages);
          }

          // Marcar mensajes como leídos cuando se abre el chat
          try {
            await fetch(`/api/chat/${data.chat.id}/read`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ userId: currentUserId }),
            });
            
            console.log("✅ Mensajes marcados como leídos");
          } catch (err) {
            console.error("Error al marcar mensajes como leídos:", err);
          }

          // Conectar socket
          if (!token) {
            return;
          }

          socketRef.current = io(BACKEND_URL, {
            auth: {
              token,
              userId: currentUserId,
              userType: currentUserType,
            },
          });

          socketRef.current.on("connect_error", (error) => {
            if (error?.message === "Invalid token" || error?.message === "Authentication required") {
              socketRef.current?.disconnect();
            }
          });
          
          socketRef.current.on("connect", () => {
            console.log("Conectado al chat");
            socketRef.current?.emit("join-chat", data.chat.id);
            
            // Emitir evento de marcar como leído vía socket
            socketRef.current?.emit("mark-as-read", { 
              chatId: data.chat.id, 
              userId: currentUserId 
            });
          });

          socketRef.current.on("new-message", (message: Message) => {
            setMessages((prev) => {
              // Evitar duplicados verificando si el mensaje ya existe
              const exists = prev.some(m => m.id === message.id);
              if (exists) {
                return prev;
              }
              
              // Agregar el nuevo mensaje y ordenar por timestamp
              const updatedMessages = [...prev, message];
              return updatedMessages.sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return dateA - dateB;
              });
            });
          });

          socketRef.current.on("user-typing", ({ userName }) => {
            if (userName !== currentUserName) {
              setIsTyping(true);
            }
          });

          socketRef.current.on("user-stop-typing", () => {
            setIsTyping(false);
          });
        } else {
          setError(data.msg || "No se pudo crear el chat");
        }
      } catch (error) {
        console.error("Error al inicializar chat:", error);
        setError("Error al conectar con el servidor. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, touristId, guideId, touristName, guideName, currentUserName]);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !socketRef.current) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    // Enviar mensaje por socket
    socketRef.current.emit("send-message", {
      chatId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderType: currentUserType,
      content: messageContent,
    });
    
    // Detener indicador de "escribiendo"
    socketRef.current.emit("stop-typing", { chatId });
  };

  const handleDeleteChat = async () => {
    if (!chatId) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("pitzbol_token");
      
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Chat eliminado correctamente");
        
        // Desconectar socket
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        // Notificar al componente padre
        if (onChatDeleted) {
          onChatDeleted();
        }
        
        // Cerrar modal
        onClose();
      } else {
        alert(data.msg || "Error al eliminar el chat");
      }
    } catch (error) {
      console.error("Error al eliminar chat:", error);
      alert("Error al eliminar el chat. Por favor, intenta de nuevo.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!chatId || !socketRef.current) return;

    // Emitir evento de "escribiendo"
    socketRef.current.emit("typing", { chatId, userName: currentUserName });

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Detener indicador después de 2 segundos sin escribir
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop-typing", { chatId });
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return messageDate.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    // Primero ordenar todos los mensajes por timestamp
    const sortedMessages = [...messages].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });

    const groups: { [key: string]: Message[] } = {};
    
    sortedMessages.forEach((message) => {
      const date = new Date(message.timestamp).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  if (!isOpen) return null;

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiMessageCircle size={24} />
              <div>
                <h3 className="font-bold text-lg">
                  {currentUserType === "tourist" ? currentGuideName : currentTouristName}
                </h3>
                <p className="text-xs text-white/80">
                  {currentUserType === "tourist" ? "Guía Turístico" : "Turista"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                title="Eliminar conversación"
              >
                <FiTrash2 size={20} />
              </button>
              <button
                onClick={onClose}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                title="Cerrar"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1A4D2E] border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
                  <div className="text-red-500 text-4xl mb-3">⚠️</div>
                  <h3 className="text-red-800 font-bold text-lg mb-2">Error al cargar el chat</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      // Reintentar inicialización
                      window.location.reload();
                    }}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                        {date}
                      </div>
                    </div>

                    {/* Messages for this date */}
                    {msgs.map((message, index) => (
                      <motion.div
                        key={`${message.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-3 flex ${
                          message.senderId === currentUserId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === currentUserId
                              ? "bg-[#1A4D2E] text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          } rounded-2xl px-4 py-2 shadow-sm`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {message.senderName}
                          </p>
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === currentUserId
                                ? "text-white/70"
                                : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                    <span>
                      {currentUserType === "tourist" ? guideName : touristName} está escribiendo...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent text-black"
                disabled={!chatId}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !chatId}
                className="bg-[#1A4D2E] hover:bg-[#0D601E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2"
              >
                <FiSend size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-red-500 text-5xl mb-3">🗑️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  ¿Eliminar conversación?
                </h3>
                <p className="text-gray-600">
                  Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

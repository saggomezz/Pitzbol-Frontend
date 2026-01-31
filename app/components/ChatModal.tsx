"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiX, FiMessageCircle } from "react-icons/fi";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
}

export default function ChatModal({
  isOpen,
  onClose,
  guideId,
  guideName,
  touristId,
  touristName,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar chat y socket
  useEffect(() => {
    if (!isOpen) return;

    const initChat = async () => {
      try {
        setLoading(true);
        
        // Obtener o crear chat
        const response = await fetch(`${BACKEND_URL}/api/chat/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            touristId,
            guideId,
            touristName,
            guideName,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setChatId(data.chat.id);

          // Cargar mensajes existentes
          const messagesResponse = await fetch(
            `${BACKEND_URL}/api/chat/${data.chat.id}/messages`
          );
          const messagesData = await messagesResponse.json();
          if (messagesData.success) {
            setMessages(messagesData.messages);
          }

          // Conectar socket
          socketRef.current = io(BACKEND_URL);
          
          socketRef.current.on("connect", () => {
            console.log("Conectado al chat");
            socketRef.current?.emit("join-chat", data.chat.id);
          });

          socketRef.current.on("new-message", (message: Message) => {
            setMessages((prev) => [...prev, message]);
          });

          socketRef.current.on("user-typing", ({ userName }) => {
            if (userName !== touristName) {
              setIsTyping(true);
            }
          });

          socketRef.current.on("user-stop-typing", () => {
            setIsTyping(false);
          });
        }
      } catch (error) {
        console.error("Error al inicializar chat:", error);
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
  }, [isOpen, touristId, guideId, touristName, guideName]);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId || !socketRef.current) return;

    socketRef.current.emit("send-message", {
      chatId,
      senderId: touristId,
      senderName: touristName,
      senderType: "tourist",
      content: newMessage.trim(),
    });

    setNewMessage("");
    
    // Detener indicador de "escribiendo"
    socketRef.current.emit("stop-typing", { chatId });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!chatId || !socketRef.current) return;

    // Emitir evento de "escribiendo"
    socketRef.current.emit("typing", { chatId, userName: touristName });

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
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
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
                <h3 className="font-bold text-lg">{guideName}</h3>
                <p className="text-xs text-white/80">Guía Turístico</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1A4D2E] border-t-transparent"></div>
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
                    {msgs.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-3 flex ${
                          message.senderId === touristId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === touristId
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
                              message.senderId === touristId
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
                    <span>{guideName} está escribiendo...</span>
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
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
      </motion.div>
    </AnimatePresence>
  );
}

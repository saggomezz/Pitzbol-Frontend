"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { useRouter } from "next/navigation";
import GuideChatList from "@/app/components/GuideChatList";
import ChatModal from "@/app/components/ChatModal";

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

export default function MensajesGuiaPage() {
  const user = usePitzbolUser();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // Debug logs
  console.log("User data:", user);
  console.log("User role:", user?.role);
  console.log("Guide status:", user?.guide_status);  console.log("Token exists:", !!localStorage.getItem("pitzbol_token"));
  // Verificar autenticación y rol
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para ver tus mensajes
          </p>
          <button
            onClick={() => router.push("/registro")}
            className="bg-[#1A4D2E] hover:bg-[#0D601E] text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Verificar que sea guía
  if (user.role !== "guide" && user.role !== "guia" && user.guide_status !== "aprobado") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Solo para Guías
          </h2>
          <p className="text-gray-600 mb-6">
            Esta sección es exclusiva para guías turísticos aprobados
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#1A4D2E] hover:bg-[#0D601E] text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <FiArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FiMessageCircle size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Mis Mensajes</h1>
              <p className="text-white/80 text-lg">
                Gestiona tus conversaciones con turistas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Conversaciones Activas
            </h2>
            <p className="text-gray-600">
              Selecciona una conversación para ver y responder mensajes
            </p>
          </div>

          <GuideChatList
            guideId={user.uid}
            onSelectChat={(chat) => setSelectedChat(chat)}
          />
        </div>
      </div>

      {/* Chat Modal */}
      {selectedChat && (
        <ChatModal
          isOpen={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          guideId={selectedChat.guideId}
          guideName={selectedChat.guideName}
          touristId={selectedChat.touristId}
          touristName={selectedChat.touristName}
          currentUserType="guide"
          currentUserId={user.uid}
          currentUserName={user.nombre + " " + user.apellido}
        />
      )}
    </div>
  );
}

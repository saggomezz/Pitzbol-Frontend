"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { useRouter } from "next/navigation";
import GuideChatList from "@/app/components/GuideChatList";
import TouristChatList from "@/app/components/TouristChatList";
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

export default function MensajesPage() {
  const user = usePitzbolUser();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Determinar si es guía o turista
  const isGuide = user?.role === "guide" || user?.role === "guia" || user?.guide_status === "aprobado";
  const isTourist = user?.role === "tourist" || user?.role === "turista" || (!isGuide && user);

  // Debug logs
  console.log("User data:", user);
  console.log("User role:", user?.role);
  console.log("Is Guide:", isGuide);
  console.log("Is Tourist:", isTourist);
  
  const handleChatDeleted = () => {
    // Cerrar el modal
    setSelectedChat(null);
    // Forzar recarga de la lista
    setRefreshKey(prev => prev + 1);
  };
  
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
                {isGuide 
                  ? "Gestiona tus conversaciones con turistas"
                  : "Tus conversaciones con guías turísticos"}
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

          {isGuide ? (
            <GuideChatList
              key={refreshKey}
              guideId={user.uid}
              onSelectChat={(chat) => setSelectedChat(chat)}
            />
          ) : (
            <TouristChatList
              key={refreshKey}
              touristId={user.uid}
              onSelectChat={(chat) => setSelectedChat(chat)}
            />
          )}
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
          currentUserType={isGuide ? "guide" : "tourist"}
          currentUserId={user.uid}
          currentUserName={user.nombre + " " + user.apellido}
          onChatDeleted={handleChatDeleted}
        />
      )}
    </div>
  );
}

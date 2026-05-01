"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FiMapPin, FiMessageSquare, FiCheckCircle, FiUser, FiCalendar } from "react-icons/fi";
import Link from "next/link";
import ChatModal from "./ChatModal";
import { usePitzbolUser } from "@/lib/usePitzbolUser";

interface GuideCardProps {
  guide: {
    uid: string;
    nombre: string;
    fotoPerfil?: string;
    descripcion?: string;
    idiomas?: string[];
    especialidades?: string[];
    tarifa?: number;
    ubicacion?: string;
  };
}

export default function GuideCard({ guide }: GuideCardProps) {
  const t = useTranslations("tours");
  const [imageError, setImageError] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const user = usePitzbolUser();

  const handleContactGuide = () => {
    if (!user) {
      alert("Debes iniciar sesi\u00f3n para contactar al gu\u00eda");
      return;
    }
    setIsChatOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-md overflow-hidden border border-transparent hover:border-[#1A4D2E]/20 hover:shadow-xl transition-all duration-300 group"
      >
        {/* Foto */}
        <div className="relative h-48 bg-gradient-to-br from-[#1A4D2E] to-[#0D601E] overflow-hidden">
          {guide.fotoPerfil && !imageError ? (
            <img
              src={guide.fotoPerfil}
              alt={guide.nombre}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiUser className="text-white/30" size={56} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge verificado */}
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
            <FiCheckCircle size={10} />
            {t("verified")}
          </div>

          {/* Tarifa en overlay (como el badge de destino en paquetes) */}
          {guide.tarifa != null && Number(guide.tarifa) > 0 && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-semibold">
                ${Number(guide.tarifa).toLocaleString("es-MX")} MXN/hr
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Nombre */}
          <h3 className="font-bold text-[#1A4D2E] text-sm leading-snug line-clamp-1 mb-1">
            {guide.nombre}
          </h3>

          {/* Ubicaci\u00f3n */}
          {guide.ubicacion && (
            <div className="flex items-center gap-1 text-gray-500 text-[11px] mb-2">
              <FiMapPin size={10} className="text-[#0D601E] flex-shrink-0" />
              <span className="truncate">{guide.ubicacion}</span>
            </div>
          )}

          {/* Descripci\u00f3n */}
          <p className="text-gray-600 text-[11px] line-clamp-2 mb-3">
            {guide.descripcion || t("noBio")}
          </p>

          {/* Idiomas */}
          {guide.idiomas && guide.idiomas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {guide.idiomas.slice(0, 3).map((idioma, idx) => (
                <span key={idx} className="bg-[#F6F0E6] text-[#1A4D2E] px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {idioma}
                </span>
              ))}
              {guide.idiomas.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">+{guide.idiomas.length - 3}</span>
              )}
            </div>
          )}

          {/* Especialidades */}
          {guide.especialidades && guide.especialidades.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {guide.especialidades.slice(0, 3).map((esp, idx) => (
                <span key={idx} className="bg-[#1A4D2E] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {esp}
                </span>
              ))}
              {guide.especialidades.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">+{guide.especialidades.length - 3}</span>
              )}
            </div>
          )}

          {/* Acciones compactas (como el footer de paquetes) */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleContactGuide}
              className="flex-1 bg-[#1A4D2E] hover:bg-[#0D601E] text-white py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
            >
              <FiMessageSquare size={13} />
              {t("contactGuide")}
            </button>
            <Link
              href={`/tours/reservar/${guide.uid}`}
              className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
            >
              <FiCalendar size={13} />
              {t("bookTour")}
            </Link>
            <Link
              href={`/perfil/${guide.uid}`}
              title={t("viewProfile")}
              className="bg-white hover:bg-[#F6F0E6] text-[#1A4D2E] border border-[#C9D4CB] hover:border-[#1A4D2E] p-2 rounded-xl transition-all flex-shrink-0"
            >
              <FiUser size={13} />
            </Link>
          </div>
        </div>
      </motion.div>

      {user && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          guideId={guide.uid}
          guideName={guide.nombre}
          touristId={user.uid}
          touristName={user.nombre || "Turista"}
          currentUserType="tourist"
          currentUserId={user.uid}
          currentUserName={user.nombre + " " + user.apellido}
        />
      )}
    </>
  );
}

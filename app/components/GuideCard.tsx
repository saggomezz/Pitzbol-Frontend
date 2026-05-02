"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FiMapPin, FiMessageSquare, FiCheckCircle, FiUser, FiCalendar } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChatModal from "./ChatModal";
import { usePitzbolUser } from "@/lib/usePitzbolUser";

type GuideCardViewMode = "grid" | "list";

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
  viewMode?: GuideCardViewMode;
}

export default function GuideCard({ guide, viewMode = "grid" }: GuideCardProps) {
  const t = useTranslations('tours');
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const user = usePitzbolUser();
  const isListView = viewMode === "list";

  const handleContactGuide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Debes iniciar sesi\u00f3n para contactar al gu\u00eda");
      return;
    }
    setIsChatOpen(true);
  };

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tours/reservar/${guide.uid}`);
  };

  return (
    <>
      <Link
        href={`/perfil/${guide.uid}`}
        className="block group"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-md overflow-hidden border border-transparent hover:border-[#1A4D2E]/20 hover:shadow-xl transition-all duration-300"
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

            {/* Tarifa */}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 group ${
            isListView ? "flex flex-col lg:flex-row" : ""
          }`}
        >
          <div className={`relative overflow-hidden bg-gradient-to-br from-[#1A4D2E] via-[#2A6A44] to-[#0D601E] ${
            isListView ? "lg:w-[300px] p-6 flex items-center justify-center" : "min-h-[280px] p-6 flex items-center justify-center"
          }`}>
            <div className={`absolute inset-0 opacity-80 ${isListView ? "bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(246,240,230,0.18),_transparent_38%)]" : "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(246,240,230,0.14),_transparent_36%)]"}`} />
            <div className={`relative aspect-square overflow-hidden rounded-[2rem] border border-white/70 bg-white/10 shadow-[0_22px_45px_rgba(0,0,0,0.24)] backdrop-blur-[2px] ${
              isListView ? "w-full max-w-[220px]" : "w-full max-w-[260px]"
            }`}>
              {guide.fotoPerfil && !imageError ? (
                <img
                  src={guide.fotoPerfil}
                  alt={guide.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10">
                  <FiUser className="text-white/40" size={80} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
            </div>

            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <FiCheckCircle size={14} />
              {t('verified')}
            </div>
          </div>

          <div className={`flex-1 ${isListView ? "p-6 lg:p-7 flex flex-col justify-between" : "p-6"}`}>
            <div>
              <h3 className="text-2xl font-bold text-[#1A4D2E] mb-2 line-clamp-1">
                {guide.nombre}
              </h3>

              {guide.ubicacion && (
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                  <FiMapPin size={16} />
                  <span>{guide.ubicacion}</span>
                </div>
              )}

              <p className={`text-gray-700 text-sm mb-4 ${isListView ? "line-clamp-4" : "line-clamp-3 min-h-[60px]"}`}>
                {guide.descripcion || t('noBio')}
              </p>

              {guide.idiomas && guide.idiomas.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-[#769C7B] uppercase mb-2">
                    {t('languages')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guide.idiomas.map((idioma, idx) => (
                      <span
                        key={idx}
                        className="bg-[#F6F0E6] text-[#1A4D2E] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {idioma}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {guide.especialidades && guide.especialidades.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-[#769C7B] uppercase mb-2">
                    {t('specialties')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guide.especialidades.slice(0, isListView ? 5 : 3).map((especialidad, idx) => (
                      <span
                        key={idx}
                        className="bg-[#1A4D2E] text-white px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {especialidad}
                      </span>
                    ))}
                    {guide.especialidades.length > (isListView ? 5 : 3) && (
                      <span className="text-xs text-gray-500 self-center">
                        +{guide.especialidades.length - (isListView ? 5 : 3)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {guide.tarifa != null && Number(guide.tarifa) > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-[#F6F0E6] to-white rounded-xl">
                  <p className="text-2xl font-bold text-[#1A4D2E]">
                    ${Number(guide.tarifa).toLocaleString('es-MX')}
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      MXN {t('hourlyRate')}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-3 ${isListView ? "lg:max-w-[520px]" : ""}`}>
              <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={handleContactGuide}
                className="flex-1 bg-[#1A4D2E] hover:bg-[#0D601E] text-white py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <FiMessageSquare size={13} />
                {t("contactGuide")}
              </button>
              <button
                onClick={handleBook}
                className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <FiCalendar size={13} />
                {t("bookTour")}
              </button>
            </div>
            </div>
          </div>
        </motion.div>
      </Link>

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

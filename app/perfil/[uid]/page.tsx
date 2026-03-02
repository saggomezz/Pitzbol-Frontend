"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FiMapPin, FiGlobe, FiAward, FiStar, FiMessageSquare, 
  FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiUser
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import ChatModal from "@/app/components/ChatModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface GuideProfile {
  uid: string;
  nombre: string;
  fotoPerfil?: string;
  descripcion?: string;
  biografia?: string;
  idiomas?: string[];
  especialidades?: string[];
  tarifa?: number;
  tarifaCompleta?: number;
  ubicacion?: string;
  experiencia?: string;
  certificaciones?: string[];
  disponibilidad?: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
  };
  toursPorDia?: number;
  calificacion?: number;
  resenas?: number;
}

export default function GuidePublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const user = usePitzbolUser();
  const guideId = params?.uid as string;

  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchGuideProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/guides/profile/${guideId}`);
        
        if (!response.ok) {
          throw new Error("No se pudo cargar el perfil del guía");
        }

        const data = await response.json();
        setGuide(data.guide);
      } catch (error) {
        console.error("Error al cargar perfil del guía:", error);
      } finally {
        setLoading(false);
      }
    };

    if (guideId) {
      fetchGuideProfile();
    }
  }, [guideId]);

  const handleContactGuide = () => {
    if (!user) {
      alert("Debes iniciar sesión para contactar al guía");
      router.push("/");
      return;
    }
    setIsChatOpen(true);
  };

  const handleBookTour = () => {
    if (!user) {
      alert("Debes iniciar sesión para reservar un tour");
      router.push("/");
      return;
    }
    router.push(`/tours/reservar/${guideId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Guía no encontrado</h2>
          <button
            onClick={() => router.push("/tours")}
            className="bg-[#1A4D2E] text-white px-6 py-3 rounded-xl font-bold"
          >
            Volver a Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header con foto y info básica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8"
        >
          <div className="relative h-80 bg-gradient-to-br from-[#1A4D2E] to-[#0D601E]">
            {guide.fotoPerfil && !imageError ? (
              <img
                src={guide.fotoPerfil}
                alt={guide.nombre}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FiUser className="text-white/30" size={120} />
              </div>
            )}
            
            {/* Badge de verificado */}
            <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
              <FiCheckCircle size={20} />
              Guía Verificado
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-[#1A4D2E] mb-4">{guide.nombre}</h1>
                
                {guide.ubicacion && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <FiMapPin size={20} />
                    <span className="text-lg">{guide.ubicacion}</span>
                  </div>
                )}

                {guide.calificacion && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <FiStar size={20} fill="currentColor" />
                      <span className="text-xl font-bold text-gray-800">
                        {guide.calificacion.toFixed(1)}
                      </span>
                    </div>
                    {guide.resenas && (
                      <span className="text-gray-600">
                        ({guide.resenas} reseñas)
                      </span>
                    )}
                  </div>
                )}

                {guide.experiencia && (
                  <div className="flex items-center gap-2 text-gray-700 mb-4">
                    <FiAward size={20} />
                    <span>{guide.experiencia} de experiencia</span>
                  </div>
                )}
              </div>

              {/* Tarifa */}
              {guide.tarifa && (
                <div className="bg-gradient-to-br from-[#F6F0E6] to-white p-6 rounded-2xl border-2 border-[#1A4D2E] min-w-[250px]">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiDollarSign size={20} />
                    <span className="text-sm font-semibold">Tarifa por hora</span>
                  </div>
                  <p className="text-4xl font-bold text-[#1A4D2E]">
                    ${guide.tarifa.toLocaleString('es-MX')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">MXN por hora</p>
                  
                  {guide.tarifaCompleta && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm text-gray-600 mb-1">Tour día completo</p>
                      <p className="text-2xl font-bold text-[#0D601E]">
                        ${guide.tarifaCompleta.toLocaleString('es-MX')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleBookTour}
                className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FiCalendar size={22} />
                Reservar Tour
              </button>
              
              <button
                onClick={handleContactGuide}
                className="flex-1 bg-white hover:bg-[#F6F0E6] text-[#1A4D2E] border-2 border-[#1A4D2E] py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300"
              >
                <FiMessageSquare size={22} />
                Contactar Guía
              </button>
            </div>
          </div>
        </motion.div>

        {/* Biografía y detalles */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="md:col-span-2 space-y-8">
            {/* Biografía */}
            {guide.biografia && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                  <FiUser size={24} />
                  Sobre mí
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {guide.biografia}
                </p>
              </motion.div>
            )}

            {/* Especialidades */}
            {guide.especialidades && guide.especialidades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                  <FiAward size={24} />
                  Especialidades
                </h2>
                <div className="flex flex-wrap gap-3">
                  {guide.especialidades.map((especialidad, idx) => (
                    <span
                      key={idx}
                      className="bg-[#1A4D2E] text-white px-4 py-2 rounded-full font-medium"
                    >
                      {especialidad}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Certificaciones */}
            {guide.certificaciones && guide.certificaciones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                  <FiCheckCircle size={24} />
                  Certificaciones
                </h2>
                <ul className="space-y-2">
                  {guide.certificaciones.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-8">
            {/* Idiomas */}
            {guide.idiomas && guide.idiomas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                  <FiGlobe size={20} />
                  Idiomas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guide.idiomas.map((idioma, idx) => (
                    <span
                      key={idx}
                      className="bg-[#F6F0E6] text-[#1A4D2E] px-3 py-2 rounded-full font-medium"
                    >
                      {idioma}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Disponibilidad */}
            {guide.disponibilidad && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                  <FiClock size={20} />
                  Disponibilidad
                </h3>
                <div className="space-y-2">
                  {Object.entries(guide.disponibilidad).map(([dia, disponible]) => (
                    <div key={dia} className="flex items-center justify-between">
                      <span className="text-gray-700 capitalize">{dia}</span>
                      {disponible ? (
                        <FiCheckCircle className="text-green-500" size={18} />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  ))}
                </div>
                {guide.toursPorDia && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Máximo <strong>{guide.toursPorDia}</strong> tours por día
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {user && guide && (
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
    </div>
  );
}

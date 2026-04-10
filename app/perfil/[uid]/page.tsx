"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FiMapPin, FiGlobe, FiAward, FiStar, FiMessageSquare, 
  FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiUser, FiMail, FiPhone, FiShield, FiDatabase, FiShoppingBag
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import ChatModal from "@/app/components/ChatModal";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();

interface PublicProfile {
  uid: string;
  role?: string;
  nombre: string;
  apellido?: string;
  nombreCompleto?: string;
  fotoPerfil?: string;
  descripcion?: string;
  biografia?: string;
  email?: string;
  telefono?: string;
  nacionalidad?: string;
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

interface AdminUserDetail {
  uid: string;
  role: string;
  path: string;
  docId: string | null;
  data: Record<string, any>;
}

const toReadableLabel = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatRawValue = (value: any) => {
  if (value === null || value === undefined) return "No disponible";
  if (typeof value === "string") return value || "No disponible";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const profileFromAdminData = (adminUser: AdminUserDetail): PublicProfile => {
  const data = adminUser.data || {};
  const nombre = data["01_nombre"] || data.nombre || "";
  const apellido = data["02_apellido"] || data.apellido || "";

  return {
    uid: adminUser.uid,
    role: data["03_rol"] || data.role || adminUser.role,
    nombre,
    apellido,
    nombreCompleto: `${nombre} ${apellido}`.trim(),
    fotoPerfil: data["14_foto_perfil"]?.url || data.fotoPerfil || "",
    descripcion: data["15_descripcion"] || data.descripcion || "",
    biografia: data["19_biografia"] || data.biografia || data["15_descripcion"] || data.descripcion || "",
    email: data["04_correo"] || data.email || "",
    telefono: data["06_telefono"] || data.telefono || "",
    nacionalidad: data["05_nacionalidad"] || data.nacionalidad || "",
    idiomas: data["09_idiomas"] || data.idiomas || [],
    especialidades: data["07_especialidades"] || data.especialidades || [],
    ubicacion: data.ubicacion || "",
    experiencia: data.experiencia || "",
    certificaciones: data.certificaciones || [],
    disponibilidad: data.disponibilidad || null,
    toursPorDia: data.toursPorDia || null,
    tarifa: data["17_tarifa_mxn"] || data.tarifa || null,
    tarifaCompleta: data["18_tarifa_dia_completo"] || data.tarifaCompleta || null,
    calificacion: data.calificacion || null,
    resenas: data.numeroResenas || data.resenas || null,
  };
};

export default function GuidePublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const user = usePitzbolUser();
  const profileUid = params?.uid as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminDetail, setAdminDetail] = useState<AdminUserDetail | null>(null);
  const [loadingAdminDetail, setLoadingAdminDetail] = useState(false);
  const [tours, setTours] = useState<any[]>([]);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const isAdminViewer = user?.role === "admin";

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        let fetchedProfile: PublicProfile | null = null;

        const response = await fetch(`/api/perfil/public/${profileUid}`);
        if (response.ok) {
          const data = await response.json();
          fetchedProfile = data.profile || null;
          setProfile(fetchedProfile);
        }

        if (isAdminViewer) {
          const token = localStorage.getItem("pitzbol_token");
          if (token) {
            setLoadingAdminDetail(true);
            const identifier = fetchedProfile?.uid || profileUid;
            const adminResponse = await fetch(`/api/admin/usuarios/${encodeURIComponent(identifier)}/detalle`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            });

            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              const adminUser: AdminUserDetail | null = adminData?.user || null;
              setAdminDetail(adminUser);

              if (!fetchedProfile && adminUser) {
                setProfile(profileFromAdminData(adminUser));
              }
            }
          }
        }

        // Cargar tours y negocios del usuario
        const uid = fetchedProfile?.uid || profileUid;
        if (uid) {
          setLoadingRelated(true);
          try {
            const [toursRes, negociosRes] = await Promise.all([
              fetch(`/api/perfil/tours/${encodeURIComponent(uid)}`),
              fetch(`/api/perfil/negocios/${encodeURIComponent(uid)}`),
            ]);

            if (toursRes.ok) {
              const toursData = await toursRes.json();
              setTours(toursData.tours || []);
            }
            if (negociosRes.ok) {
              const negociosData = await negociosRes.json();
              setNegocios(negociosData.negocios || []);
            }
          } catch (err) {
            console.error("Error cargando tours/negocios:", err);
          }
          setLoadingRelated(false);
        }
      } catch (error) {
        console.error("Error al cargar perfil público:", error);
      } finally {
        setLoadingAdminDetail(false);
        setLoading(false);
      }
    };

    if (profileUid) {
      fetchPublicProfile();
    }
  }, [profileUid, isAdminViewer]);

  const isGuide = profile?.role === "guia";
  const profileName = profile?.nombreCompleto?.trim() || `${profile?.nombre || ""} ${profile?.apellido || ""}`.trim();

  const handleContactGuide = () => {
    if (!isGuide) return;

    if (!user) {
      alert("Debes iniciar sesión para contactar al guía");
      router.push("/");
      return;
    }
    setIsChatOpen(true);
  };

  const handleBookTour = () => {
    if (!isGuide) return;

    if (!user) {
      alert("Debes iniciar sesión para reservar un tour");
      router.push("/");
      return;
    }
    router.push(`/tours/reservar/${profileUid}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFCF9] to-[#F6F0E6]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFCF9] to-[#F6F0E6] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white border-2 border-[#1A4D2E]/20 rounded-3xl shadow-2xl px-8 py-12 max-w-lg w-full"
        >
          <div className="mb-4 text-5xl">❌</div>
          <h2 className="text-3xl font-bold text-[#1A4D2E] mb-3">Usuario no encontrado</h2>
          <p className="text-[#1A4D2E]/70 mb-8">No se pudo localizar la información de este perfil.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] via-[#F6F0E6] to-[#FDFCF9]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#1A4D2E] via-[#0D601E] to-[#0A4014] pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/pastoVerde.png')] bg-repeat-x bg-bottom pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg" style={{ fontFamily: "var(--font-jockey)" }}>
              {profileName || "Usuario"}
            </h1>
            <p className="text-xl text-white/90 drop-shadow">
              {isGuide ? "🎯 Guía Turístico Verificado" : `✓ ${profile.role || "usuario"} registrado`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-24 mb-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#1A4D2E]/10 backdrop-blur"
        >
          <div className="relative h-80 bg-gradient-to-br from-[#1A4D2E] to-[#0D601E]">
            {profile.fotoPerfil && !imageError ? (
              <img
                src={profile.fotoPerfil}
                alt={profileName || "Usuario"}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FiUser className="text-white/30" size={120} />
              </div>
            )}
            
            <div className="absolute top-6 right-6 bg-[#0D601E] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg capitalize">
              <FiCheckCircle size={20} />
              {isGuide ? "Guía Verificado" : `${profile.role || "usuario"} registrado`}
            </div>

            {isAdminViewer && (
              <div className="absolute top-6 left-6 bg-[#1A4D2E]/85 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 border border-white/20">
                <FiShield size={16} /> Vista de administrador
              </div>
            )}
          </div>

          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-[#1A4D2E] mb-4">{profileName || "Usuario"}</h1>
                
                {profile.ubicacion && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <FiMapPin size={20} />
                    <span className="text-lg">{profile.ubicacion}</span>
                  </div>
                )}

                {profile.calificacion && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <FiStar size={20} fill="currentColor" />
                      <span className="text-xl font-bold text-gray-800">
                        {profile.calificacion.toFixed(1)}
                      </span>
                    </div>
                    {profile.resenas && (
                      <span className="text-gray-600">
                        ({profile.resenas} reseñas)
                      </span>
                    )}
                  </div>
                )}

                {profile.experiencia && (
                  <div className="flex items-center gap-2 text-gray-700 mb-4">
                    <FiAward size={20} />
                    <span>{profile.experiencia} de experiencia</span>
                  </div>
                )}
              </div>

              {isGuide && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#F6F0E6] to-white p-8 rounded-3xl border-2 border-[#1A4D2E] min-w-[280px] shadow-xl"
              >
                <div className="flex items-center gap-2 text-[#1A4D2E]/70 mb-3">
                  <FiDollarSign size={24} className="text-[#0D601E]" />
                  <span className="text-sm font-bold uppercase tracking-wider">Tarifa</span>
                </div>
                <p className="text-5xl font-bold text-[#1A4D2E]">
                  ${profile.tarifa?.toLocaleString('es-MX') || "N/A"}
                </p>
                <p className="text-sm text-[#1A4D2E]/60 mt-2 font-semibold">por hora</p>
                
                {profile.tarifaCompleta && (
                  <div className="mt-6 pt-6 border-t-2 border-[#1A4D2E]/20">
                    <p className="text-sm text-[#1A4D2E]/70 mb-2">Tour día completo</p>
                    <p className="text-3xl font-bold text-[#0D601E]">
                      ${profile.tarifaCompleta.toLocaleString('es-MX')}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            </div>

            {isGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 mt-10"
              >
                <button
                  onClick={handleBookTour}
                  className="flex-1 bg-gradient-to-r from-[#0D601E] via-[#1A4D2E] to-[#0D601E] hover:shadow-2xl text-white py-5 px-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:scale-105 border border-[#1A4D2E]/30"
                >
                  <FiCalendar size={24} />
                  Reservar Tour
                </button>
                
                <button
                  onClick={handleContactGuide}
                  className="flex-1 bg-white hover:bg-[#F6F0E6] text-[#1A4D2E] border-2 border-[#1A4D2E] py-5 px-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <FiMessageSquare size={24} />
                  Contactar Guía
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 my-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {profile.biografia && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-8 hover:shadow-2xl transition-all"
              >
                <h2 className="text-3xl font-bold text-[#1A4D2E] mb-5 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-3 rounded-2xl">
                    <FiUser size={28} className="text-[#1A4D2E]" />
                  </div>
                  Sobre mí
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {profile.biografia}
                </p>
              </motion.div>
            )}

            {profile.especialidades && profile.especialidades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#F6F0E6] to-white rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-8 hover:shadow-2xl transition-all"
              >
                <h2 className="text-3xl font-bold text-[#1A4D2E] mb-6 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-3 rounded-2xl">
                    <FiAward size={28} className="text-[#1A4D2E]" />
                  </div>
                  {isGuide ? "Especialidades" : "Intereses"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.especialidades.map((especialidad, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                      className="bg-[#1A4D2E] text-white px-4 py-2 rounded-full font-medium"
                    >
                      {especialidad}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {profile.certificaciones && profile.certificaciones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-8 hover:shadow-2xl transition-all"
              >
                <h2 className="text-3xl font-bold text-[#1A4D2E] mb-6 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-3 rounded-2xl">
                    <FiCheckCircle size={28} className="text-[#1A4D2E]" />
                  </div>
                  Certificaciones
                </h2>
                <ul className="space-y-3">
                  {profile.certificaciones.map((cert, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.05 }}
                      className="flex items-start gap-3 text-gray-700 hover:text-[#1A4D2E] transition-colors"
                    >
                      <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0 text-xl" size={20} />
                      <span className="text-lg">{cert}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {isAdminViewer && adminDetail && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-3xl border border-[#1A4D2E]/10 shadow-lg p-7"
              >
                <h2 className="text-2xl font-bold text-[#1A4D2E] mb-3 flex items-center gap-2">
                  <FiDatabase size={24} />
                  Información completa (Admin)
                </h2>
                <p className="text-sm text-[#1A4D2E]/75 mb-5">
                  Ruta: <strong>{adminDetail.path}</strong> · Doc: <strong>{adminDetail.docId || "N/A"}</strong> · UID: <strong>{adminDetail.uid}</strong>
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(adminDetail.data || {}).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-[#1A4D2E]/10 bg-[#FDFCF9] p-3">
                      <p className="text-xs font-bold text-[#1A4D2E]/75 mb-1">{toReadableLabel(key)}</p>
                      <pre className="text-sm text-[#1A4D2E] whitespace-pre-wrap break-words font-sans">
                        {formatRawValue(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-8">
            {profile.idiomas && profile.idiomas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-6 hover:shadow-2xl transition-all"
              >
                <h3 className="text-2xl font-bold text-[#1A4D2E] mb-5 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-2 rounded-xl">
                    <FiGlobe size={24} className="text-[#1A4D2E]" />
                  </div>
                  Idiomas
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profile.idiomas.map((idioma, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="bg-gradient-to-r from-[#F6F0E6] to-[#FDFCF9] text-[#1A4D2E] px-4 py-2 rounded-full font-semibold border border-[#1A4D2E]/30 hover:border-[#1A4D2E]/60 transition-all"
                    >
                      {idioma}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {(profile.email || profile.telefono || profile.nacionalidad || profile.descripcion) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-6 hover:shadow-2xl transition-all"
              >
                <h3 className="text-2xl font-bold text-[#1A4D2E] mb-5 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-2 rounded-xl">
                    <FiUser size={24} className="text-[#1A4D2E]" />
                  </div>
                  Información
                </h3>

                <div className="space-y-4 text-gray-700">
                  {profile.email && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFCF9] hover:bg-[#F6F0E6] transition-colors"
                    >
                      <FiMail size={20} className="text-[#1A4D2E] flex-shrink-0" />
                      <span className="text-sm font-medium break-all">{profile.email}</span>
                    </motion.div>
                  )}

                  {profile.telefono && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFCF9] hover:bg-[#F6F0E6] transition-colors"
                    >
                      <FiPhone size={20} className="text-[#1A4D2E] flex-shrink-0" />
                      <span className="text-sm font-medium">{profile.telefono}</span>
                    </motion.div>
                  )}

                  {profile.nacionalidad && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFCF9] hover:bg-[#F6F0E6] transition-colors"
                    >
                      <FiGlobe size={20} className="text-[#1A4D2E] flex-shrink-0" />
                      <span className="text-sm font-medium">{profile.nacionalidad}</span>
                    </motion.div>
                  )}

                  {profile.descripcion && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                      className="pt-4 border-t-2 border-[#1A4D2E]/20 whitespace-pre-line text-sm text-gray-700 italic"
                    >
                      {profile.descripcion}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Disponibilidad */}
            {isGuide && profile.disponibilidad && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-6 hover:shadow-2xl transition-all"
              >
                <h3 className="text-2xl font-bold text-[#1A4D2E] mb-5 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-2 rounded-xl">
                    <FiClock size={24} className="text-[#1A4D2E]" />
                  </div>
                  Disponibilidad
                </h3>
                <div className="space-y-3">
                  {Object.entries(profile.disponibilidad).map(([dia, disponible], idx) => (
                    <motion.div
                      key={dia}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FDFCF9] hover:bg-[#F6F0E6] transition-colors"
                    >
                      <span className="text-gray-700 capitalize font-semibold">{dia}</span>
                      {disponible ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Disponible</span>
                          <FiCheckCircle className="text-green-500" size={20} />
                        </div>
                      ) : (
                        <span className="text-gray-400 font-semibold">No disponible</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                {profile.toursPorDia && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 pt-6 border-t-2 border-[#1A4D2E]/20 bg-[#1A4D2E]/5 rounded-2xl p-4"
                  >
                    <p className="text-sm text-[#1A4D2E]/70 mb-1">Límite de tours por día</p>
                    <p className="text-2xl font-bold text-[#1A4D2E]">{profile.toursPorDia} tours</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Tours */}
            {isGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-8 hover:shadow-2xl transition-all"
              >
                <h3 className="text-3xl font-bold text-[#1A4D2E] mb-6 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-3 rounded-2xl">
                    <FiMapPin size={28} className="text-[#1A4D2E]" />
                  </div>
                  Mis Tours ({tours.length})
                </h3>

                {tours.length > 0 ? (
                  <div className="space-y-4">
                    {tours.map((tour: any, idx: number) => {
                      const statusColors: { [key: string]: string } = {
                        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-500",
                        CONFIRMED: "bg-blue-100 text-blue-800 border-blue-500",
                        COMPLETED: "bg-green-100 text-green-800 border-green-500",
                        CANCELLED: "bg-red-100 text-red-800 border-red-500",
                      };
                      const statusColor = statusColors[tour.status] || "bg-gray-100 text-gray-800";

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="p-5 rounded-2xl border-2 border-[#1A4D2E]/15 bg-gradient-to-r from-white to-[#FDFCF9] hover:from-[#F6F0E6] hover:to-white transition-all hover:shadow-md hover:border-[#1A4D2E]/30"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-lg text-[#1A4D2E]">👤 {tour.touristName || "Turista"}</p>
                              <p className="text-sm text-[#1A4D2E]/70">📅 {tour.fecha || "Fecha no especificada"}</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor} whitespace-nowrap`}>
                              {tour.status || "PENDING"}
                            </span>
                          </div>
                          {(tour.horaInicio || tour.horaFin) && (
                            <p className="text-sm text-[#1A4D2E]/80 font-semibold">
                              🕐 {tour.horaInicio} - {tour.horaFin}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#1A4D2E]/60">
                    <p className="text-lg">No hay tours aún</p>
                    <p className="text-sm mt-2">Los tours aparecerán aquí cuando alguien te reserve</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Negocios */}
            {profile.role === "dueno_negocio" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-white to-[#FDFCF9] rounded-3xl border-2 border-[#1A4D2E]/20 shadow-xl p-8 hover:shadow-2xl transition-all"
              >
                <h3 className="text-3xl font-bold text-[#1A4D2E] mb-6 flex items-center gap-3">
                  <div className="bg-[#1A4D2E]/10 p-3 rounded-2xl">
                    <FiShoppingBag size={28} className="text-[#1A4D2E]" />
                  </div>
                  Mis Negocios ({negocios.length})
                </h3>

                {negocios.length > 0 ? (
                  <div className="space-y-4">
                    {negocios.map((negocio: any, idx: number) => {
                      const statusColors: { [key: string]: string } = {
                        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-500",
                        APPROVED: "bg-green-100 text-green-800 border-green-500",
                        ARCHIVED: "bg-gray-100 text-gray-800 border-gray-500",
                      };
                      const estadoKey = negocio.estado?.toUpperCase() || "PENDING";
                      const statusColor = statusColors[estadoKey as keyof typeof statusColors] || "bg-gray-100 text-gray-800";

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.05 }}
                          className="p-5 rounded-2xl border-2 border-[#1A4D2E]/15 bg-gradient-to-r from-white to-[#FDFCF9] hover:from-[#F6F0E6] hover:to-white transition-all hover:shadow-md hover:border-[#1A4D2E]/30"
                        >
                          <div className="flex items-start gap-4">
                            {negocio.logo && (
                              <img
                                src={negocio.logo}
                                alt={negocio.nombre}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-[#1A4D2E]/20"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="font-bold text-lg text-[#1A4D2E] truncate">{negocio.nombre}</p>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor} whitespace-nowrap`}>
                                  {negocio.estado || "PENDING"}
                                </span>
                              </div>
                              {negocio.categoria && (
                                <p className="text-sm text-[#1A4D2E]/70 font-semibold">🏷️ {negocio.categoria}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#1A4D2E]/60">
                    <p className="text-lg">No hay negocios registrados</p>
                    <p className="text-sm mt-2">Los negocios aparecerán aquí cuando los registres</p>
                  </div>
                )}
              </motion.div>
            )}

            {isAdminViewer && !adminDetail && !loadingAdminDetail && (
              <div className="bg-white rounded-3xl border border-[#1A4D2E]/10 shadow-lg p-6">
                <h3 className="text-lg font-bold text-[#1A4D2E] mb-2">Detalle admin no disponible</h3>
                <p className="text-sm text-[#1A4D2E]/70">
                  No fue posible recuperar la información completa desde la ruta de administración.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {user && profile && isGuide && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          guideId={profile!.uid}
          guideName={profileName || "Guía"}
          touristId={user!.uid}
          touristName={user!.nombre || "Turista"}
          currentUserType="tourist"
          currentUserId={user!.uid}
          currentUserName={user!.nombre + " " + user!.apellido}
        />
      )}
    </div>
  );
}

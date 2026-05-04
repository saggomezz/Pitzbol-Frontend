"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FiMapPin, FiGlobe, FiAward, FiStar, FiMessageSquare, 
  FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiUser, FiMail, FiPhone, FiShield, FiDatabase, FiShoppingBag, FiMap
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
  experiencia?: string | string[];
  experiencias?: string[];
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

const normalizeGuideExperiences = (profile: PublicProfile | null): string[] => {
  if (!profile) return [];

  const result: string[] = [];
  const rawSources = [
    profile.experiencias,
    (profile as any)?.experiences,
    profile.experiencia,
    (profile as any)?.experienciaTours,
  ];

  for (const raw of rawSources) {
    if (!raw) continue;

    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        if (typeof item === "string" && item.trim()) result.push(item.trim());
      });
      continue;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (typeof item === "string" && item.trim()) result.push(item.trim());
          });
          continue;
        }
      } catch {
        // Si no es JSON, se trata como texto plano o lista separada por delimitadores.
      }

      const splitItems = trimmed
        .split(/\n+|\s*[;|]\s*/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (splitItems.length > 1) {
        result.push(...splitItems);
      } else {
        result.push(trimmed);
      }
    }
  }

  return Array.from(new Set(result));
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
  const [negocios, setNegocios] = useState<any[]>([]);
  const [guideTours, setGuideTours] = useState<any[]>([]);
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

        // Cargar negocios y tours del usuario
        const uid = fetchedProfile?.uid || profileUid;
        if (uid) {
          try {
            const [negociosRes, toursRes] = await Promise.all([
              fetch(`/api/perfil/negocios/${encodeURIComponent(uid)}`),
              fetch(`/api/tours/guia/${encodeURIComponent(uid)}`),
            ]);
            if (negociosRes.ok) {
              const negociosData = await negociosRes.json();
              setNegocios(negociosData.negocios || []);
            }
            if (toursRes.ok) {
              const toursData = await toursRes.json();
              setGuideTours(toursData.tours || []);
            }
          } catch (err) {
            console.error("Error cargando datos del guía:", err);
          }
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
  const guideExperiences = normalizeGuideExperiences(profile);
  const showPublicPhone = Boolean(profile?.telefono && !isGuide);

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
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FDFCF9] to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C9D1C] to-[#3A5A40] border-b border-[#4CAF50]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-medium text-white mb-1"
            style={{ fontFamily: "'Jockey One', sans-serif" }}
          >
            Perfil del Guía
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Columna izquierda ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]">
              <div className="flex flex-col items-center">

                {/* Foto de perfil */}
                <div className="relative mb-6 mt-2">
                  <div className="relative w-40 h-40 md:w-48 md:h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0D601E] to-[#F00808] rounded-full opacity-20 blur-xl" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-[#1A4D2E] to-[#0D601E] flex items-center justify-center">
                      {profile.fotoPerfil && !imageError ? (
                        <img
                          src={profile.fotoPerfil}
                          alt={profileName || "Guía"}
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <FiUser size={64} className="text-white/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Nombre */}
                <h2 className="text-2xl md:text-3xl font-semibold text-[#1A4D2E] text-center mb-1">
                  {profileName || "Usuario"}
                </h2>

                {/* Nacionalidad */}
                {profile.nacionalidad && (
                  <div className="flex items-center justify-center gap-1 text-[#81C784] text-xs mb-1">
                    <FiGlobe size={13} />
                    <span className="font-normal">{profile.nacionalidad}</span>
                  </div>
                )}

                {/* Ubicación */}
                {profile.ubicacion && (
                  <div className="flex items-center justify-center gap-1 text-[#81C784] text-xs mb-2">
                    <FiMapPin size={13} />
                    <span className="font-normal">{profile.ubicacion}</span>
                  </div>
                )}

                {/* Badge de rol */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F8F6] text-[#0D601E] rounded-full border border-[#0D601E]/10 mb-6">
                  <FiShield size={12} className="opacity-70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {isGuide ? "Guía Verificado" : profile.role || "Usuario"}
                  </span>
                  {isAdminViewer && (
                    <span className="ml-1 text-[9px] font-bold text-[#F00808] uppercase">(Admin)</span>
                  )}
                </div>

                {/* Calificación */}
                {profile.calificacion && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <FiStar size={18} fill="currentColor" />
                      <span className="text-lg font-bold text-gray-800">{profile.calificacion.toFixed(1)}</span>
                    </div>
                    {profile.resenas && (
                      <span className="text-sm text-gray-500">({profile.resenas} reseñas)</span>
                    )}
                  </div>
                )}

                <div className="w-full space-y-4 mb-6">
                  {/* Descripción */}
                  {(profile.descripcion || profile.biografia) && (
                    <div className="bg-white p-4 rounded-xl border border-[#E0F2F1]">
                      <h3 className="text-xs font-medium text-[#81C784] tracking-wide mb-2">Descripción</h3>
                      <p className="text-sm font-normal text-[#1A4D2E] whitespace-pre-wrap">
                        {profile.descripcion || profile.biografia}
                      </p>
                    </div>
                  )}

                  {/* Teléfono */}
                  {showPublicPhone && (
                    <div className="bg-white p-4 rounded-xl border border-[#E0F2F1]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-[#F1F8F6] rounded-lg">
                          <FiPhone size={16} className="text-[#66BB6A]" />
                        </div>
                        <h3 className="text-xs font-medium text-[#81C784] tracking-wide">Teléfono</h3>
                      </div>
                      <p className="text-sm font-medium text-[#1A4D2E] pl-10">{profile.telefono}</p>
                    </div>
                  )}

                  {/* Tarifa */}
                  {isGuide && profile.tarifa != null && Number(profile.tarifa) > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-[#E0F2F1]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-[#F1F8F6] rounded-lg">
                          <FiDollarSign size={16} className="text-[#66BB6A]" />
                        </div>
                        <h3 className="text-xs font-medium text-[#81C784] tracking-wide">Cobro por Tour</h3>
                      </div>
                      <p className="text-sm font-medium text-[#1A4D2E] pl-10">
                        ${Number(profile.tarifa).toLocaleString("es-MX")} MXN / hora
                      </p>
                      {profile.tarifaCompleta && (
                        <p className="text-xs text-[#81C784] pl-10 mt-1">
                          Día completo: ${Number(profile.tarifaCompleta).toLocaleString("es-MX")} MXN
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                {isGuide && (
                  <div className="w-full space-y-3">
                    <button
                      onClick={handleBookTour}
                      className="w-full bg-[#0D601E] hover:bg-[#094d18] text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FiCalendar size={16} />
                      Reservar Tour
                    </button>
                    <button
                      onClick={handleContactGuide}
                      className="w-full bg-white border-2 border-[#1A4D2E] hover:bg-[#F6F0E6] text-[#1A4D2E] py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <FiMessageSquare size={16} />
                      Contactar Guía
                    </button>
                  </div>
                )}

                {/* Stats */}
                {isGuide && (
                  <div className="w-full mt-6 bg-gradient-to-r from-[#E8F5E9] to-white rounded-xl p-4 border border-[#E0F2F1]">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="text-xl font-semibold text-[#66BB6A]">{guideTours.length}</p>
                        <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wide">Tours</p>
                      </div>
                      {profile.resenas && (
                        <>
                          <div className="w-px h-8 bg-[#E0F2F1]" />
                          <div className="text-center flex-1">
                            <p className="text-xl font-semibold text-[#66BB6A]">{profile.resenas}</p>
                            <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wide">Reseñas</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Columna derecha ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Especialidades */}
            {profile.especialidades && profile.especialidades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A4D2E] mb-1">
                    {isGuide ? "Especialidades" : "Intereses"}
                  </h3>
                  <p className="text-xs text-[#81C784] font-normal">
                    {profile.especialidades.length} {profile.especialidades.length === 1 ? "seleccionada" : "seleccionadas"}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {profile.especialidades.map((esp, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2, scale: 1.02 }}
                      className="bg-gradient-to-br from-[#F1F8F6] to-white rounded-xl p-5 border border-[#E0F2F1] hover:border-[#A5D6A7] transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A4D2E] to-[#0D601E] flex items-center justify-center text-white shadow-lg">
                        <FiAward size={28} />
                      </div>
                      <span className="text-sm font-medium text-[#1A4D2E] text-center leading-tight">{esp}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Idiomas */}
            {isGuide && profile.idiomas && profile.idiomas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1] overflow-hidden"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A4D2E] leading-none">Idiomas</h3>
                  <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wider mt-1">
                    Idiomas que habla
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.idiomas.map((idioma, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2, scale: 1.05 }}
                      className="bg-gradient-to-br from-[#F1F8F6] to-white rounded-lg px-4 py-2 border border-[#E0F2F1] hover:border-[#A5D6A7] transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <FiGlobe size={16} className="text-[#3A5A40]" />
                        <span className="text-sm font-medium text-[#1A4D2E]">{idioma}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Experiencias / Tours */}
            {isGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1] overflow-hidden"
              >
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1A4D2E] leading-none">Mis Experiencias</h3>
                    <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wider mt-1">Tours publicados</p>
                  </div>
                  <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full font-medium">
                    {guideTours.length} publicados
                  </span>
                </div>
                {guideTours.length > 0 ? (
                  <div className="space-y-4">
                    {guideTours.map((tour: any, idx: number) => {
                      const foto = tour.fotoPrincipal || tour.fotos?.[0] || null;
                      const idiomasTour = Array.isArray(tour.idiomas) ? tour.idiomas.slice(0, 2).join(" · ") : "";
                      return (
                        <motion.div
                          key={tour.id || idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + idx * 0.05 }}
                        >
                          <Link
                            href={`/tours/${tour.id}`}
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#1A4D2E]/15 bg-gradient-to-r from-white to-[#FDFCF9] hover:from-[#F6F0E6] hover:to-white transition-all hover:shadow-md hover:border-[#1A4D2E]/40 group"
                          >
                            {foto ? (
                              <img src={foto} alt={tour.titulo || "Experiencia"} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-[#1A4D2E]/20" />
                            ) : (
                              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] border border-[#1A4D2E]/10">
                                <FiMap size={24} className="text-[#0D601E]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#1A4D2E] group-hover:text-[#0D601E] truncate">{tour.titulo || "Experiencia"}</p>
                              <p className="text-sm text-gray-500 truncate">{tour.destino || ""}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#6C8870]">
                                {tour.duracion && <span>{tour.duracion}</span>}
                                {tour.precio && <span className="font-semibold text-[#0D601E]">{tour.precio}</span>}
                                {idiomasTour && <span>{idiomasTour}</span>}
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">Ver detalles</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#1A4D2E]/60">
                    <p className="text-lg">Este guía aún no ha publicado experiencias</p>
                    <p className="text-sm mt-2">Los tours que publique aparecerán aquí</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Certificaciones */}
            {profile.certificaciones && profile.certificaciones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]"
              >
                <h3 className="text-xl font-semibold text-[#1A4D2E] mb-5">Certificaciones</h3>
                <ul className="space-y-3">
                  {profile.certificaciones.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Disponibilidad */}
            {isGuide && profile.disponibilidad && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]"
              >
                <h3 className="text-xl font-semibold text-[#1A4D2E] mb-5 flex items-center gap-2">
                  <FiClock size={20} className="text-[#1A4D2E]" /> Disponibilidad
                </h3>
                <div className="space-y-3">
                  {Object.entries(profile.disponibilidad).map(([dia, disponible], idx) => (
                    <div key={dia} className="flex items-center justify-between p-3 rounded-xl bg-[#FDFCF9] hover:bg-[#F6F0E6] transition-colors">
                      <span className="text-gray-700 capitalize font-semibold">{dia}</span>
                      {disponible ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Disponible</span>
                          <FiCheckCircle className="text-green-500" size={18} />
                        </div>
                      ) : (
                        <span className="text-gray-400 font-semibold text-sm">No disponible</span>
                      )}
                    </div>
                  ))}
                </div>
                {profile.toursPorDia && (
                  <div className="mt-5 pt-5 border-t border-[#E0F2F1] bg-[#1A4D2E]/5 rounded-2xl p-4">
                    <p className="text-sm text-[#1A4D2E]/70 mb-1">Límite de tours por día</p>
                    <p className="text-2xl font-bold text-[#1A4D2E]">{profile.toursPorDia} tours</p>
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
                className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]"
              >
                <h3 className="text-xl font-semibold text-[#1A4D2E] mb-5">Negocios ({negocios.length})</h3>
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
                        <div key={idx} className="p-5 rounded-2xl border-2 border-[#1A4D2E]/15 bg-gradient-to-r from-white to-[#FDFCF9] hover:from-[#F6F0E6] transition-all hover:shadow-md">
                          <div className="flex items-start gap-4">
                            {negocio.logo && <img src={negocio.logo} alt={negocio.nombre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-[#1A4D2E]/20" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="font-bold text-lg text-[#1A4D2E] truncate">{negocio.nombre}</p>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor} whitespace-nowrap`}>{negocio.estado || "PENDING"}</span>
                              </div>
                              {negocio.categoria && <p className="text-sm text-[#1A4D2E]/70 font-semibold">🏷️ {negocio.categoria}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#1A4D2E]/60">
                    <p>No hay negocios registrados</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Admin detail */}
            {isAdminViewer && adminDetail && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-[#1A4D2E]/10 shadow-md p-7"
              >
                <h3 className="text-xl font-bold text-[#1A4D2E] mb-3 flex items-center gap-2">
                  <FiDatabase size={22} /> Información completa (Admin)
                </h3>
                <p className="text-sm text-[#1A4D2E]/75 mb-5">
                  Ruta: <strong>{adminDetail.path}</strong> · Doc: <strong>{adminDetail.docId || "N/A"}</strong> · UID: <strong>{adminDetail.uid}</strong>
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(adminDetail.data || {}).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-[#1A4D2E]/10 bg-[#FDFCF9] p-3">
                      <p className="text-xs font-bold text-[#1A4D2E]/75 mb-1">{toReadableLabel(key)}</p>
                      <pre className="text-sm text-[#1A4D2E] whitespace-pre-wrap break-words font-sans">{formatRawValue(value)}</pre>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {isAdminViewer && !adminDetail && !loadingAdminDetail && (
              <div className="bg-white rounded-2xl border border-[#1A4D2E]/10 shadow-md p-6">
                <h3 className="text-lg font-bold text-[#1A4D2E] mb-2">Detalle admin no disponible</h3>
                <p className="text-sm text-[#1A4D2E]/70">No fue posible recuperar la información completa desde la ruta de administración.</p>
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

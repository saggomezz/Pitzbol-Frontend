"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePitzbolUser } from "../../../lib/usePitzbolUser";
import {
  FaStore, FaSearch, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
  FaArchive, FaEnvelope, FaPhone, FaMapMarkerAlt, FaList,
} from "react-icons/fa";
import { MdBusiness, MdCategory, MdImage } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

type TabKey = "todas" | "pendiente" | "aprobado" | "rechazado" | "archivado";

const TABS: { key: TabKey; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "En revisión" },
  { key: "aprobado", label: "Aprobadas" },
  { key: "rechazado", label: "Rechazadas" },
  { key: "archivado", label: "Archivadas" },
];

const TAB_COLORS: Record<TabKey, { active: string }> = {
  todas:     { active: "bg-[#1A4D2E] text-white" },
  pendiente: { active: "bg-amber-500 text-white" },
  aprobado:  { active: "bg-emerald-600 text-white" },
  rechazado: { active: "bg-red-600 text-white" },
  archivado: { active: "bg-gray-600 text-white" },
};

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  todas:     <FaList />,
  pendiente: <FaHourglassHalf />,
  aprobado:  <FaCheckCircle />,
  rechazado: <FaTimesCircle />,
  archivado: <FaArchive />,
};

export default function MisSolicitudesPage() {
  const router = useRouter();
  const user = usePitzbolUser();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchSolicitudes();
    // eslint-disable-next-line
  }, [user]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pitzbol_token") : null;
      const res = await fetch(`${BACKEND_URL}/api/business/my-requests`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setSolicitudes(data.success ? data.solicitudes : []);
    } catch {
      setSolicitudes([]);
    }
    setLoading(false);
  };

  const filtered = (
    tab === "todas" ? solicitudes : solicitudes.filter((s) => s.estado === tab)
  ).filter((s) => {
    if (!searchQuery) return true;
    const b = s.business || {};
    const q = searchQuery.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q) ||
      (s.email || b.email || "").toLowerCase().includes(q) ||
      (b.description || "").toLowerCase().includes(q)
    );
  });

  const countByTab = (key: TabKey) =>
    key === "todas"
      ? solicitudes.length
      : solicitudes.filter((s) => s.estado === key).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#0D601E]/20 text-[#1A4D2E] font-semibold hover:bg-[#F6F0E6] transition-all shadow-sm text-sm"
            >
              <FiArrowLeft /> Volver
            </button>
            <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-3 md:p-4 rounded-2xl shadow-lg">
              <FaStore className="text-white text-2xl md:text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-[#1A4D2E]">
                Mis Solicitudes de Negocio
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Aquí puedes ver el estado de todas tus solicitudes enviadas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          {TABS.map(({ key, label }) => {
            const isActive = tab === key;
            const count = countByTab(key);
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 text-sm ${
                  isActive
                    ? `${TAB_COLORS[key].active} scale-105 shadow-lg`
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
                }`}
              >
                {TAB_ICONS[key]}
                {label}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black ${
                    isActive ? "bg-white/25" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#0D601E]/20 focus:border-[#0D601E] focus:outline-none bg-white shadow-md text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
        </motion.div>

        {/* Content */}
        {!user ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="bg-white p-8 rounded-full shadow-lg">
              <FaStore className="text-gray-300 text-6xl" />
            </div>
            <p className="text-gray-600 font-medium text-lg">
              Debes iniciar sesión para ver tus solicitudes.
            </p>
          </motion.div>
        ) : loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
              <FaStore className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
            </div>
            <p className="text-gray-600 font-medium">Cargando solicitudes...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="bg-white p-8 rounded-full shadow-lg">
              <FaStore className="text-gray-300 text-6xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">
                {tab === "todas"
                  ? "Aún no has enviado ninguna solicitud"
                  : `No tienes solicitudes en "${TABS.find((t) => t.key === tab)?.label}"`}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Intenta con otra búsqueda"
                  : "Puedes publicar tu negocio desde la página principal"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white font-bold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Publicar un negocio
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((sol, index) => {
                const business = sol.business || {};
                const logo: string = business.logo || "";
                const images: string[] = Array.isArray(business.images)
                  ? business.images.filter((img: string) => !!img)
                  : [];
                const estado: string = sol.estado || "pendiente";

                return (
                  <motion.div
                    key={sol.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    onClick={() => router.push(`/negocio/mis-solicitudes/${sol.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/negocio/mis-solicitudes/${sol.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent hover:border-[#0D601E]/20 cursor-pointer"
                  >
                    {/* Hero imagen / logo */}
                    <div className="relative h-32 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center overflow-hidden">
                      {logo ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={logo}
                            alt={business.name || "Logo"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <MdBusiness className="text-[#0D601E]/30 text-6xl mb-2" />
                          <span className="text-xs text-gray-400 font-medium">Sin logo</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {estado === "aprobado" && (
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <FaCheckCircle /> Aprobado
                          </span>
                        )}
                        {estado === "pendiente" && (
                          <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <FaHourglassHalf /> En revisión
                          </span>
                        )}
                        {estado === "rechazado" && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <FaTimesCircle /> Rechazado
                          </span>
                        )}
                        {estado === "archivado" && (
                          <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <FaArchive /> Archivado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-[#1A4D2E] mb-3 line-clamp-1">
                        {business.name || "Sin nombre"}
                      </h3>

                      {business.category && (
                        <div className="flex items-center gap-2 mb-3">
                          <MdCategory className="text-[#0D601E] text-sm" />
                          <span className="text-xs font-medium text-gray-600 bg-[#0D601E]/10 px-2 py-1 rounded-lg">
                            {business.category}
                          </span>
                        </div>
                      )}

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {business.description || "Sin descripción"}
                      </p>

                      {/* Contacto */}
                      <div className="space-y-2 text-xs mb-4">
                        {(sol.email || business.email) && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaEnvelope className="text-[#0D601E]" />
                            <span className="truncate">{sol.email || business.email}</span>
                          </div>
                        )}
                        {business.phone && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaPhone className="text-[#0D601E]" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                        {business.location && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaMapMarkerAlt className="text-[#0D601E]" />
                            <span className="truncate">{business.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Galería */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MdImage className="text-[#0D601E]" />
                          <span className="text-xs font-semibold text-gray-600">
                            Galería {images.length > 0 ? `(${images.length})` : ""}
                          </span>
                        </div>
                        {images.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.slice(0, 4).map((img: string, i: number) => (
                              <div
                                key={i}
                                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-100 hover:border-[#0D601E] transition-colors shadow-sm"
                              >
                                <Image
                                  src={img}
                                  alt={`Imagen ${i + 1}`}
                                  fill
                                  className="object-cover hover:scale-110 transition-transform"
                                />
                              </div>
                            ))}
                            {images.length > 4 && (
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#0D601E]/10 flex items-center justify-center border-2 border-dashed border-[#0D601E]/30">
                                <span className="text-xs font-bold text-[#0D601E]">+{images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <MdImage className="text-gray-300 text-3xl mx-auto mb-1" />
                              <span className="text-xs text-gray-400 font-medium">Sin imágenes</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fecha */}
                      <p className="text-xs text-gray-400">
                        Enviada:{" "}
                        {business.createdAt
                          ? new Date(business.createdAt).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Sin fecha"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

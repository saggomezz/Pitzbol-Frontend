"use client";
import React, { useEffect, useState } from "react";
import { FaSearch, FaCheckCircle, FaHourglassHalf, FaUserTie, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaStar, FaMoneyBillWave, FaIdCard } from "react-icons/fa";
import { MdPerson, MdCategory } from "react-icons/md";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export interface Guide {
  id: string;
  uid: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  nacionalidad: string;
  especialidades: string[];
  rfc: string;
  idiomas: string[];
  codigoPostal: string;
  fotoFrente: string;
  fotoReverso: string;
  fotoRostro: string;
  fotoPerfil: string;
  descripcion: string;
  status: string;
  tarifaMxn: number;
  tarifaDiaCompleto?: number | null;
  validacionBiometrica?: { porcentaje: number; mensaje: string } | null;
  biografia: string;
  calificacion: number;
  resenas: number;
  tours: any[];
  createdAt: string;
  approvedAt: string;
}

const AdminGuiasPage = () => {
  const [aprobados, setAprobados] = useState<Guide[]>([]);
  const [pendientes, setPendientes] = useState<Guide[]>([]);
  const [tab, setTab] = useState<"aprobados" | "pendientes">("aprobados");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filterGuides = (guides: Guide[]) => {
    if (!searchQuery) return guides;
    const q = searchQuery.toLowerCase();
    return guides.filter(g =>
      `${g.nombre} ${g.apellido}`.toLowerCase().includes(q) ||
      g.correo.toLowerCase().includes(q) ||
      g.especialidades.some(e => e.toLowerCase().includes(q)) ||
      g.nacionalidad.toLowerCase().includes(q)
    );
  };

  const currentGuides = filterGuides(tab === "aprobados" ? aprobados : pendientes);

  const cargarGuias = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      let token = "";
      if (typeof window !== "undefined") {
        token = localStorage.getItem("pitzbol_token") || "";
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [resAprobados, resPendientes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/guias/aprobados`, { credentials: "include", headers }),
        fetch(`${API_BASE}/api/admin/guias/pendientes`, { credentials: "include", headers }),
      ]);

      const dataAprobados = await resAprobados.json();
      const dataPendientes = await resPendientes.json();

      setAprobados(dataAprobados.success ? dataAprobados.guias : []);
      setPendientes(dataPendientes.success ? dataPendientes.guias : []);
    } catch (err) {
      console.error("Error al cargar guías:", err);
      setAprobados([]);
      setPendientes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarGuias();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "aprobados" || requestedTab === "pendientes") {
      setTab(requestedTab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-4 rounded-2xl shadow-lg">
              <FaUserTie className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A4D2E] flex items-center gap-2">
                Gestionar Guías
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Administra y supervisa a los guías turísticos registrados
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-[#0D601E]/20 text-[#0D601E] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push("/admin")}
          >
            ← Volver al Panel
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === "aprobados"
                ? "bg-[#0D601E] text-white scale-105 shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
            }`}
            onClick={() => setTab("aprobados")}
          >
            <FaCheckCircle /> Aprobados ({aprobados.length})
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === "pendientes"
                ? "bg-[#EAB308] text-black scale-105 shadow-lg font-extrabold"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
            }`}
            onClick={() => setTab("pendientes")}
          >
            <FaHourglassHalf /> Pendientes ({pendientes.length})
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar guías por nombre, correo, especialidad o nacionalidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#0D601E]/20 focus:border-[#0D601E] focus:outline-none bg-white shadow-md text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin"></div>
              <FaUserTie className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
            </div>
            <p className="text-gray-600 font-medium">Cargando guías...</p>
          </motion.div>
        ) : currentGuides.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="bg-white p-8 rounded-full shadow-lg">
              <FaUserTie className="text-gray-300 text-6xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">
                No hay guías {tab}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Intenta con otra búsqueda"
                  : "Aún no hay guías en esta categoría"}
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {tab === "pendientes" && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] rounded-2xl border-2 border-[#0D601E]/50 shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                      <FaHourglassHalf className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">
                        Pendientes por Aprobar
                      </h2>
                      <p className="text-white/90 text-sm font-semibold mt-1">
                        Tienes {pendientes.length} guía
                        {pendientes.length !== 1 ? "s" : ""} esperando aprobación
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                      <span className="text-white font-black text-2xl">
                        {pendientes.length}
                      </span>
                      <p className="text-white/80 text-xs font-semibold">
                        Pendientes
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {currentGuides.map((guia, index) => (
                  <motion.div
                    key={guia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    onClick={() => router.push(`/admin/guias/${guia.uid}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/admin/guias/${guia.uid}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent hover:border-[#0D601E]/20 cursor-pointer"
                  >
                    {/* Guide Header */}
                    <div className="relative h-32 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center overflow-hidden">
                      {guia.fotoPerfil ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={guia.fotoPerfil}
                            alt={`${guia.nombre} ${guia.apellido}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <MdPerson className="text-[#0D601E]/30 text-6xl mb-2" />
                          <span className="text-xs text-gray-400 font-medium">
                            Sin foto
                          </span>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {guia.status === "activo" ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaCheckCircle />
                            Aprobado
                          </motion.span>
                        ) : (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaHourglassHalf />
                            En revisión
                          </motion.span>
                        )}
                      </div>

                      {/* Biometric Badge */}
                      {guia.validacionBiometrica && (
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                              guia.validacionBiometrica.porcentaje >= 70
                                ? "bg-green-500 text-white"
                                : guia.validacionBiometrica.porcentaje >= 40
                                ? "bg-yellow-500 text-black"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            🔐 {guia.validacionBiometrica.porcentaje}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Guide Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-[#1A4D2E] mb-1 line-clamp-1">
                        {guia.nombre} {guia.apellido}
                      </h3>

                      {/* Rating & Reviews */}
                      {tab === "aprobados" && (
                        <div className="flex items-center gap-2 mb-3">
                          <FaStar className="text-amber-400 text-sm" />
                          <span className="text-sm font-semibold text-gray-700">
                            {guia.calificacion > 0
                              ? guia.calificacion.toFixed(1)
                              : "Sin calificación"}
                          </span>
                          {guia.resenas > 0 && (
                            <span className="text-xs text-gray-500">
                              ({guia.resenas} reseña
                              {guia.resenas !== 1 ? "s" : ""})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Specialties */}
                      {guia.especialidades.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {guia.especialidades.slice(0, 3).map((esp, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium text-gray-600 bg-[#0D601E]/10 px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                              <MdCategory className="text-[#0D601E] text-xs" />
                              {esp}
                            </span>
                          ))}
                          {guia.especialidades.length > 3 && (
                            <span className="text-xs font-bold text-[#0D601E] bg-[#0D601E]/10 px-2 py-1 rounded-lg">
                              +{guia.especialidades.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tarifa */}
                      <div className="flex items-center gap-2 mb-3 bg-emerald-50 px-3 py-2 rounded-lg">
                        <FaMoneyBillWave className="text-emerald-600 text-sm" />
                        <span className="text-sm font-bold text-emerald-700">
                          ${guia.tarifaMxn} MXN/hr
                        </span>
                        {guia.tarifaDiaCompleto && (
                          <span className="text-xs text-emerald-600">
                            · ${guia.tarifaDiaCompleto} día completo
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {guia.biografia || guia.descripcion || "Sin descripción"}
                      </p>

                      {/* Contact Info */}
                      <div className="space-y-2 text-xs mb-4">
                        {guia.correo && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaEnvelope className="text-[#0D601E]" />
                            <span className="truncate">{guia.correo}</span>
                          </div>
                        )}
                        {guia.telefono && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaPhone className="text-[#0D601E]" />
                            <span>{guia.telefono}</span>
                          </div>
                        )}
                        {guia.nacionalidad && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaGlobe className="text-[#0D601E]" />
                            <span>{guia.nacionalidad}</span>
                          </div>
                        )}
                      </div>

                      {/* Tours count (for approved) */}
                      {tab === "aprobados" && guia.tours && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                          <FaMapMarkerAlt className="text-[#0D601E]" />
                          <span className="font-medium">
                            {guia.tours.length} tour
                            {guia.tours.length !== 1 ? "s" : ""} publicado
                            {guia.tours.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* RFC for pending */}
                      {tab === "pendientes" && guia.rfc && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                          <FaIdCard className="text-[#0D601E]" />
                          <span className="font-medium">RFC: {guia.rfc}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminGuiasPage;

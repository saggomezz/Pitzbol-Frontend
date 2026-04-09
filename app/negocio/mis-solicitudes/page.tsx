"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePitzbolUser } from "../../../lib/usePitzbolUser";
import {
  FaPlus, FaStore, FaSearch, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
  FaArchive, FaEnvelope, FaPhone, FaMapMarkerAlt, FaList,
} from "react-icons/fa";
import { MdBusiness, MdCategory, MdImage } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";

const API_BASE = "/api";
const APPROVED_TOAST_PENDING_KEY = "pitzbol_approved_business_toast_pending_v2";

type ApprovedToastPendingPayload = {
  businessId?: string;
  businessName?: string;
};

type TabKey = "todas" | "pendiente" | "aprobado" | "rechazado" | "archivado";

const TABS: { key: TabKey; label: string }[] = [
  { key: "aprobado", label: "Negocios Activos" },
  { key: "todas", label: "Todas las solicitudes" },
  { key: "pendiente", label: "En revisión" },
  { key: "rechazado", label: "Rechazadas" },
  { key: "archivado", label: "Archivadas" },
];

const TAB_COLORS: Record<TabKey, { active: string }> = {
  todas:     { active: "bg-[#2D7B5A] text-white" },
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
  const [businessView, setBusinessView] = useState<"activos" | "archivados">("activos");
  const [selectedMetric, setSelectedMetric] = useState<"activos" | TabKey>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToSection = (id: "activos" | "solicitudes") => {
    if (typeof window === "undefined") return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openBusinessFlowLikeNavbar = () => {
    if (typeof window === "undefined") return;
    if (typeof window.openBusinessFlowLikeNavbar === "function") {
      window.openBusinessFlowLikeNavbar();
      return;
    }
    // Fallback only if global trigger is not available yet.
    router.push("/negocio");
  };

  useEffect(() => {
    if (!user) return;
    fetchSolicitudes();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const handleBusinessSubmitted = () => {
      fetchSolicitudes();
      setSelectedMetric("todas");
      setTab("todas");
    };

    const handleBusinessStatusChanged = (event: any) => {
      const { businessId, status } = event.detail || {};
      console.log(`[mis-solicitudes] Business status changed: ${businessId} -> ${status}`);
      fetchSolicitudes();
    };

    window.addEventListener("businessRequestSubmitted", handleBusinessSubmitted);
    window.addEventListener("businessStatusChanged", handleBusinessStatusChanged as EventListener);
    
    return () => {
      window.removeEventListener("businessRequestSubmitted", handleBusinessSubmitted);
      window.removeEventListener("businessStatusChanged", handleBusinessStatusChanged as EventListener);
    };
    // eslint-disable-next-line
  }, [user]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pitzbol_token") : null;
      const res = await fetch(`${API_BASE}/business/my-requests`, {
        cache: "no-store",
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

  const searchFn = (s: any) => {
    if (!searchQuery) return true;
    const b = s.business || {};
    const q = searchQuery.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q) ||
      (s.email || b.email || "").toLowerCase().includes(q) ||
      (b.description || "").toLowerCase().includes(q)
    );
  };

  const activeBusinesses = solicitudes
    .filter((s) => s.estado === "aprobado")
    .filter(searchFn);

  const archivedBusinesses = solicitudes
    .filter((s) => s.estado === "archivado")
    .filter(searchFn);

  const requestsPool = solicitudes.filter((s) => s.estado !== "aprobado" && s.estado !== "archivado");

  const filteredRequests = (
    tab === "todas" || tab === "aprobado"
      ? requestsPool
      : requestsPool.filter((s) => s.estado === tab)
  ).filter(searchFn);

  const countByTab = (key: TabKey) =>
    key === "aprobado"
      ? solicitudes.filter((s) => s.estado === "aprobado").length
      : key === "todas"
      ? requestsPool.length
      : solicitudes.filter((s) => s.estado === key).length;

  const metricCardClass = (active: boolean) =>
    `group text-left rounded-2xl p-4 border transition-all ${
      active
        ? "bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] text-white border-[#0D601E]/20 shadow-lg"
        : "bg-white/85 backdrop-blur border-[#0D601E]/10 shadow-sm hover:bg-gradient-to-br hover:from-[#0D601E] hover:to-[#1A4D2E] hover:text-white hover:border-[#0D601E]/20 hover:shadow-lg hover:-translate-y-0.5"
    }`;
  
  const filterTabClass = (active: boolean, color: "green" | "amber" | "red" | "gray") => {
    const activeStyles: Record<typeof color, string> = {
      green: "bg-[#1A4D2E] text-white shadow-lg",
      amber: "bg-amber-500 text-white shadow-lg",
      red: "bg-red-600 text-white shadow-lg",
      gray: "bg-gray-600 text-white shadow-lg",
    };

    const hoverStyles: Record<typeof color, string> = {
      green: "hover:bg-[#1A4D2E] hover:text-white hover:border-[#0D601E]/20",
      amber: "hover:bg-amber-500 hover:text-white hover:border-amber-500",
      red: "hover:bg-red-600 hover:text-white hover:border-red-600",
      gray: "hover:bg-gray-600 hover:text-white hover:border-gray-600",
    };

    return `group px-5 py-3 rounded-xl font-bold border transition-all duration-300 flex items-center gap-2 text-sm ${
      active ? activeStyles[color] : `bg-white text-gray-700 border-[#0D601E]/10 shadow-md hover:scale-[1.03] ${hoverStyles[color]}`
    }`;
  };

  const getCardNavigationHref = (sol: any, kind: "activo" | "solicitud") => {
    const estado = String(sol?.estado || "").toLowerCase();
    const businessName = sol?.business?.name;

    if (kind === "activo" && estado === "aprobado" && businessName) {
      return `/informacion/${encodeURIComponent(String(businessName))}?origen=gestion-negocios-activo`;
    }

    return `/negocio/mis-solicitudes/${sol.id}`;
  };

  const shouldTriggerApprovedToast = (sol: any, kind: "activo" | "solicitud") => {
    const estado = String(sol?.estado || "").toLowerCase();
    return kind === "activo" && estado === "aprobado";
  };

  const navigateFromCard = (sol: any, kind: "activo" | "solicitud", targetHref: string) => {
    if (typeof window !== "undefined" && shouldTriggerApprovedToast(sol, kind)) {
      const payload: ApprovedToastPendingPayload = {
        businessId: String(sol?.id || ""),
        businessName: String(sol?.business?.name || ""),
      };
      localStorage.setItem(APPROVED_TOAST_PENDING_KEY, JSON.stringify(payload));
    }
    router.push(targetHref);
  };

  const renderCard = (sol: any, index: number, kind: "activo" | "solicitud" = "solicitud") => {
    const business = sol.business || {};
    const logo: string = business.logo || "";
    const images: string[] = Array.isArray(business.images)
      ? business.images.filter((img: string) => !!img)
      : [];
    const estado: string = sol.estado || "pendiente";
    const targetHref = getCardNavigationHref(sol, kind);

    return (
      <motion.div
        key={sol.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.04 }}
        layout
        onClick={() => navigateFromCard(sol, kind, targetHref)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigateFromCard(sol, kind, targetHref);
          }
        }}
        role="button"
        tabIndex={0}
        className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent cursor-pointer ${
          kind === "activo" ? "hover:border-emerald-300" : "hover:border-[#0D601E]/20"
        }`}
      >
        <div className="relative h-32 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center overflow-hidden">
          {logo ? (
            <div className="relative w-full h-full">
              <Image
                src={logo}
                alt={business.name || "Logo"}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                loading={index === 0 ? "eager" : "lazy"}
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

          <div className="absolute top-3 right-3">
            {estado === "aprobado" && (
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <FaCheckCircle /> {kind === "activo" ? "Activo" : "Negocio Activo"}
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
                      sizes="64px"
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="absolute -left-6 md:-left-20 top-1 md:top-2 w-10 h-10 rounded-full bg-white border border-[#0D601E]/20 text-[#1A4D2E] flex items-center justify-center hover:bg-[#F6F0E6] transition-all shadow-sm"
          >
            <FiArrowLeft className="text-base" />
          </button>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-3 md:p-4 rounded-2xl shadow-lg shrink-0">
                <FaStore className="text-white text-2xl md:text-3xl" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl md:text-4xl font-extrabold text-[#1A4D2E]">
                  Gestionar Negocios
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Administra tus negocios activos y da seguimiento al estatus de tus solicitudes
                </p>
              </div>
            </div>
            <button
              onClick={openBusinessFlowLikeNavbar}
              className="group w-full sm:w-auto lg:w-[calc((100%-3rem)/4)] lg:flex-none inline-flex items-center justify-start gap-3 self-center h-fit px-5 py-3 bg-white rounded-2xl text-[#0D601E] shadow-lg border-2 border-[#0D601E] hover:bg-[#1A4D2E] hover:text-white hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0D601E]/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-white/15">
                <FaPlus className="text-sm" />
              </div>
              <p className="text-xs md:text-sm uppercase tracking-wide font-bold text-inherit text-center whitespace-nowrap transition-colors">
                Nuevo negocio
              </p>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <button
            onClick={() => {
              setSelectedMetric("activos");
              setBusinessView("activos");
              scrollToSection("activos");
            }}
            className={metricCardClass(selectedMetric === "activos")}
          >
            <p className={`text-xs uppercase tracking-wide font-bold transition-colors ${selectedMetric === "activos" ? "text-white/80" : "text-[#1A4D2E]/70 group-hover:text-white/80"}`}>Negocios Activos</p>
            <p className={`text-3xl font-black mt-2 transition-colors ${selectedMetric === "activos" ? "text-white" : "text-emerald-700 group-hover:text-white"}`}>{countByTab("aprobado")}</p>
          </button>
          <button
            onClick={() => {
              setSelectedMetric("pendiente");
              setTab("pendiente");
              scrollToSection("solicitudes");
            }}
            className={metricCardClass(selectedMetric === "pendiente")}
          >
            <p className={`text-xs uppercase tracking-wide font-bold transition-colors ${selectedMetric === "pendiente" ? "text-white/80" : "text-[#1A4D2E]/70 group-hover:text-white/80"}`}>Solicitudes en revisión</p>
            <p className={`text-3xl font-black mt-2 transition-colors ${selectedMetric === "pendiente" ? "text-white" : "text-amber-600 group-hover:text-white"}`}>{countByTab("pendiente")}</p>
          </button>
          <button
            onClick={() => {
              setSelectedMetric("rechazado");
              setTab("rechazado");
              scrollToSection("solicitudes");
            }}
            className={metricCardClass(selectedMetric === "rechazado")}
          >
            <p className={`text-xs uppercase tracking-wide font-bold transition-colors ${selectedMetric === "rechazado" ? "text-white/80" : "text-[#1A4D2E]/70 group-hover:text-white/80"}`}>Solicitudes rechazadas</p>
            <p className={`text-3xl font-black mt-2 transition-colors ${selectedMetric === "rechazado" ? "text-white" : "text-red-600 group-hover:text-white"}`}>{countByTab("rechazado")}</p>
          </button>
          <button
            onClick={() => {
              setSelectedMetric("todas");
              setTab("todas");
              scrollToSection("solicitudes");
            }}
            className={metricCardClass(selectedMetric === "todas")}
          >
            <p className={`text-xs uppercase tracking-wide font-bold transition-colors ${selectedMetric === "todas" ? "text-white/80" : "text-[#1A4D2E]/70 group-hover:text-white/80"}`}>Total de solicitudes</p>
            <p className={`text-3xl font-black mt-2 transition-colors ${selectedMetric === "todas" ? "text-white" : "text-[#0D601E] group-hover:text-white"}`}>{requestsPool.length}</p>
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
              Debes iniciar sesión para gestionar tus negocios.
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
            <p className="text-gray-600 font-medium">Cargando panel de negocios...</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
            <motion.section
              id="activos"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="min-w-0"
            >
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-xl md:text-2xl font-extrabold text-[#1A4D2E]">
                  {businessView === "activos" ? "Negocios Activos" : "Negocios Archivados"}
                </h2>
                <div className="inline-flex items-center rounded-xl border border-[#0D601E]/20 bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setBusinessView("activos")}
                    className={`group px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      businessView === "activos"
                        ? "bg-[#1A4D2E] text-white"
                        : "text-[#1A4D2E] hover:bg-[#0D601E] hover:text-white"
                    }`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => setBusinessView("archivados")}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      businessView === "archivados"
                        ? "bg-[#1A4D2E] text-white"
                        : "text-[#1A4D2E] hover:bg-[#0D601E] hover:text-white"
                    }`}
                  >
                    <FaArchive className={businessView === "archivados" ? "text-white" : "text-[#0D601E] group-hover:text-white"} />
                    Archivados
                  </button>
                </div>
              </div>

              {(businessView === "activos" ? activeBusinesses.length : archivedBusinesses.length) === 0 ? (
                <div className="bg-white/90 rounded-2xl border border-[#0D601E]/10 p-8 text-center shadow-sm">
                  <p className="text-gray-600 font-semibold">
                    {businessView === "activos"
                      ? "Aún no tienes negocios activos."
                      : "Aún no tienes negocios archivados."}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {businessView === "activos"
                      ? "Cuando una solicitud sea aprobada aparecerá aquí primero."
                      : "Cuando archives un negocio, aparecerá en esta vista."}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-stretch"
                >
                  <AnimatePresence mode="popLayout">
                    {(businessView === "activos" ? activeBusinesses : archivedBusinesses).map((sol: any, index: number) => renderCard(sol, index, "activo"))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.section>

            <motion.section
              id="solicitudes"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="min-w-0"
            >
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-[#1A4D2E]">Solicitudes de Negocio</h2>
                <p className="text-sm text-gray-600 mt-1">Consulta el estatus de tus solicitudes enviadas.</p>
              </div>

              <div className="flex flex-wrap gap-3 mb-6 justify-start">
                {TABS.filter(({ key }) => key !== "aprobado" && key !== "archivado").map(({ key, label }) => {
                  const isActive = tab === key;
                  const count = countByTab(key);
                  const color = key === "pendiente" ? "amber" : key === "rechazado" ? "red" : "gray";
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={filterTabClass(isActive, color)}
                    >
                      {TAB_ICONS[key]}
                      {label}
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                          isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600 group-hover:bg-white/25 group-hover:text-white"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-14 flex flex-col items-center gap-4 bg-white/80 rounded-2xl border border-[#0D601E]/10"
                >
                  <div className="bg-white p-6 rounded-full shadow-sm">
                    <FaStore className="text-gray-300 text-4xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-600 mb-1">
                      {tab === "todas"
                        ? "No hay solicitudes por mostrar"
                        : `No tienes solicitudes en "${TABS.find((t) => t.key === tab)?.label}"`}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ? "Intenta con otra búsqueda" : "Puedes publicar un nuevo negocio cuando quieras."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-stretch"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredRequests.map((sol: any, index: number) => renderCard(sol, index, "solicitud"))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.section>
          </div>
        )}
      </div>
    </div>
  );
}

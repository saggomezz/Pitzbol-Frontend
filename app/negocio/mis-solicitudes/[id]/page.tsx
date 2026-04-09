"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiFileText,
  FiMail,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArchive,
  FiImage,
  FiShare2,
} from "react-icons/fi";

const API_BASE = "/api";

// ─── Status config (matches preview page) ────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string }
> = {
  pendiente: {
    label: "En revisión",
    color: "text-[#B56A00]",
    bgColor: "bg-[#FFF7E8] border-[#F2C47C]",
    icon: <FiClock className="text-[#B56A00]" size={20} />,
    description: "Tu negocio está siendo revisado por nuestro equipo",
  },
  PENDING: {
    label: "En revisión",
    color: "text-[#B56A00]",
    bgColor: "bg-[#FFF7E8] border-[#F2C47C]",
    icon: <FiClock className="text-[#B56A00]" size={20} />,
    description: "Tu negocio está siendo revisado por nuestro equipo",
  },
  aprobado: {
    label: "Aprobado",
    color: "text-[#1F6B3A]",
    bgColor: "bg-[#E9F7EE] border-[#9ED9B2]",
    icon: <FiCheckCircle className="text-[#1F6B3A]" size={20} />,
    description: "¡Tu negocio ha sido aprobado y es visible para usuarios!",
  },
  APPROVED: {
    label: "Aprobado",
    color: "text-[#1F6B3A]",
    bgColor: "bg-[#E9F7EE] border-[#9ED9B2]",
    icon: <FiCheckCircle className="text-[#1F6B3A]" size={20} />,
    description: "¡Tu negocio ha sido aprobado y es visible para usuarios!",
  },
  rechazado: {
    label: "Rechazado",
    color: "text-[#8B0000]",
    bgColor: "bg-[#FDEAEA] border-[#F2A5A5]",
    icon: <FiAlertCircle className="text-[#8B0000]" size={20} />,
    description: "Tu solicitud fue rechazada. Revisa los comentarios para más detalles.",
  },
  REJECTED: {
    label: "Rechazado",
    color: "text-[#8B0000]",
    bgColor: "bg-[#FDEAEA] border-[#F2A5A5]",
    icon: <FiAlertCircle className="text-[#8B0000]" size={20} />,
    description: "Tu solicitud fue rechazada. Revisa los comentarios para más detalles.",
  },
  archivado: {
    label: "Archivado",
    color: "text-gray-600",
    bgColor: "bg-gray-100 border-gray-300",
    icon: <FiArchive className="text-gray-600" size={20} />,
    description: "Este negocio ha sido archivado",
  },
  ARCHIVED: {
    label: "Archivado",
    color: "text-gray-600",
    bgColor: "bg-gray-100 border-gray-300",
    icon: <FiArchive className="text-gray-600" size={20} />,
    description: "Este negocio ha sido archivado",
  },
};

// ─── LocationMap (same as preview) ───────────────────────────────────────────

const LocationMap = dynamic(() => Promise.resolve(LocationMapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#F6F0E6] rounded-3xl flex items-center justify-center border border-[#1A4D2E]/10">
      <p className="text-[#769C7B] font-semibold">Cargando mapa...</p>
    </div>
  ),
});

function LocationMapComponent({
  location,
  businessName,
  latitud,
  longitud,
}: {
  location: string;
  businessName: string;
  latitud?: string | null;
  longitud?: string | null;
}) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (latitud && longitud) {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      if (!isNaN(lat) && !isNaN(lon)) {
        setCoordinates([lat, lon]);
        setError(false);
        setLoading(false);
        return;
      }
    }

    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [location, latitud, longitud]);

  if (loading) {
    return (
      <div className="h-[400px] bg-[#F6F0E6] rounded-3xl flex items-center justify-center border border-[#1A4D2E]/10">
        <p className="text-[#769C7B] font-semibold">Cargando ubicación...</p>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="bg-[#F6F0E6] rounded-3xl p-6 border border-[#1A4D2E]/10">
        <div className="flex items-center gap-3 mb-3">
          <FiMapPin className="text-[#0D601E]" size={24} />
          <h4 className="font-bold text-[#1A4D2E]">Ubicación</h4>
        </div>
        <p className="text-[#1A4D2E] mb-2">{location}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="text-yellow-800 font-semibold mb-1">ℹ️ Mapa no disponible</p>
          <p className="text-yellow-700 text-xs">
            No hay coordenadas guardadas para este negocio.
          </p>
        </div>
      </div>
    );
  }

  if (typeof window === "undefined") return null;

  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  const L = require("leaflet");
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-[#1A4D2E]/20">
      <MapContainer center={coordinates} zoom={15} style={{ height: "400px", width: "100%" }} scrollWheelZoom zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>
            <div className="text-center">
              <strong>{businessName}</strong>
              <br />
              <span className="text-sm text-gray-600">{location}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div className="bg-[#0D601E] text-white text-center py-2 text-sm font-semibold">
        📍 {location}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MiSolicitudDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("pitzbol_token");
        const res = await fetch(`${API_BASE}/business/by-id/${id}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("No se pudo cargar la solicitud.");
          return;
        }
        const json = await res.json();
        if (json.success && json.business) {
          setData(json.business);
        } else {
          setError("Solicitud no encontrada.");
        }
      } catch {
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-5xl text-[#0D601E]"
        >
          <FiClock />
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4">No encontrado</h2>
          <p className="text-[#1A4D2E]/70 mb-6">{error || "Solicitud no encontrada."}</p>
          <button
            onClick={() => router.push("/negocio/mis-solicitudes")}
            className="inline-block bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Ver mis solicitudes
          </button>
        </motion.div>
      </div>
    );
  }

  const business = data.business || {};
  const status: string = data.estado || data.status || business.status || "pendiente";
  const isRejected = status === "rechazado" || status === "REJECTED" || !!data.rejectedAt || !!data.rejectionReason;
  const cfg = isRejected
    ? statusConfig["rechazado"]
    : (statusConfig[status] || statusConfig["pendiente"]);

  const logo: string = business.logo || "";
  const images: string[] = Array.isArray(business.images) ? business.images.filter(Boolean) : [];
  const rejectionReason = data.rejectionReason || data.archivedReason || null;
  const rejectionDate = data.rejectedAt || data.archivedAt || null;
  const email = data.email || business.email || "";
  const scheduleLines = Object.entries(business.schedule || {})
    .filter(([, day]: any) => day?.enabled)
    .map(([day, hours]: any) => `${day}: ${hours?.open || "--:--"} - ${hours?.close || "--:--"}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] px-4 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Volver */}
        <button
          onClick={() => router.push("/negocio/mis-solicitudes")}
          className="inline-flex items-center gap-2 text-[#0D601E] hover:text-[#094d18] font-semibold mb-6 transition-colors"
        >
          <FiArrowLeft size={20} /> Mis Solicitudes
        </button>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-lg overflow-hidden border border-[#1A4D2E]/10"
        >
          {/* Header con Estatus */}
          <div className={`border-b-4 p-8 md:p-12 text-center ${cfg.bgColor}`}>
            <div className="flex justify-center mb-4">{cfg.icon}</div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A4D2E] mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              {business.name || "Sin nombre"}
            </h1>
            <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm mb-4 ${cfg.color} bg-white/40`}>
              {cfg.label}
            </div>
            <p className="text-[#1A4D2E]/70 max-w-2xl mx-auto">{cfg.description}</p>
          </div>

          {/* Contenido */}
          <div className="p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 mb-12">

              {/* Columna izquierda — Logo + meta */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl p-8 flex items-center justify-center min-h-[250px]">
                  {logo ? (
                    <img src={logo} alt={business.name} className="max-h-full max-w-full object-contain rounded-2xl" />
                  ) : (
                    <div className="text-center text-[#769C7B]">
                      <FiImage size={60} className="mx-auto mb-2 opacity-30" />
                      <p>Sin logo disponible</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {business.category && (
                    <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                      <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Categoría</p>
                      <p className="text-lg font-bold text-[#1A4D2E]">{business.category}</p>
                    </div>
                  )}
                  {business.createdAt && (
                    <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                      <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Fecha de Solicitud</p>
                      <p className="text-lg font-bold text-[#1A4D2E]">
                        {new Date(business.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Columna derecha — Contacto */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-2xl font-black text-[#1A4D2E] mb-2">Información de Contacto</h2>

                {business.phone && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                        <FiPhone className="text-[#0D601E]" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Teléfono</p>
                        <p className="text-lg font-bold text-[#1A4D2E]">{business.phone}</p>
                        <a href={`tel:${business.phone}`} className="text-xs text-[#0D601E] font-semibold mt-2 hover:underline">Llamar</a>
                      </div>
                    </div>
                  </div>
                )}

                {business.location && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                        <FiMapPin className="text-[#0D601E]" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Ubicación</p>
                        <p className="text-lg font-bold text-[#1A4D2E]">{business.location}</p>
                        {business.cp && <p className="text-sm text-[#769C7B] mt-1">CP: {business.cp}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {business.website && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                        <FiGlobe className="text-[#0D601E]" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Sitio Web</p>
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[#0D601E] hover:underline break-all">
                          {business.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {business.rfc && (
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">RFC</p>
                    <p className="text-lg font-bold text-[#1A4D2E] font-mono">{business.rfc}</p>
                  </div>
                )}

                {business.estimatedCost && (
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Costo estimado</p>
                    <p className="text-lg font-bold text-[#1A4D2E]">{business.estimatedCost}</p>
                  </div>
                )}

                {Array.isArray(business.subcategories) && business.subcategories.length > 0 && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-2">Subcategorías</p>
                    <div className="flex flex-wrap gap-2">
                      {business.subcategories.map((sub: string) => (
                        <span key={sub} className="px-3 py-1 rounded-full bg-[#0D601E]/10 text-[#0D601E] text-xs font-bold">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scheduleLines.length > 0 && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-2">Horario</p>
                    <ul className="space-y-1 text-sm text-[#1A4D2E]">
                      {scheduleLines.map((line: string) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {email && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                        <FiMail className="text-[#0D601E]" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Email</p>
                        <a href={`mailto:${email}`} className="text-lg font-bold text-[#0D601E] hover:underline break-all">{email}</a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Descripción */}
            {business.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12 bg-gradient-to-br from-[#F6F0E6]/50 to-[#E8F5E9]/50 rounded-3xl p-8 border border-[#1A4D2E]/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#0D601E]/10 p-2 rounded-lg">
                    <FiFileText className="text-[#0D601E]" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-[#1A4D2E]">Descripción</h3>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap text-[#1A4D2E]">{business.description}</p>
              </motion.div>
            )}



            {/* Galería */}
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-12"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E] mb-6">Galería</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedImage(image)}
                      className="relative rounded-2xl overflow-hidden cursor-pointer group h-48 sm:h-56"
                    >
                      <img
                        src={image}
                        alt={`Galería ${index + 1}`}
                        className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="bg-white/90 rounded-full p-3">
                          <FiImage className="text-[#0D601E]" size={24} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mapa */}
            {business.location && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E] mb-6">Ubicación en el Mapa</h3>
                <LocationMap
                  location={business.location}
                  businessName={business.name || ""}
                  latitud={business.latitud}
                  longitud={business.longitud}
                />
              </motion.div>
            )}

            {/* Acciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => router.push("/negocio/mis-solicitudes")}
                className="flex-1 bg-[#F6F0E6] hover:bg-[#E8F5E9] text-[#1A4D2E] font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowLeft /> Mis Solicitudes
              </button>
              {status === "aprobado" && (
                <button
                  onClick={() => {
                    if (navigator.share)
                      navigator.share({
                        title: business.name,
                        text: `Negocio: ${business.name}`,
                        url: window.location.href,
                      });
                  }}
                  className="flex-1 bg-[#0D601E] hover:bg-[#094d18] text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <FiShare2 /> Compartir
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {isRejected && (
            <motion.aside
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="w-full xl:w-[380px] shrink-0 origin-right sticky top-20 md:top-24 lg:top-28 self-start"
            >
              <div className="bg-white border border-[#E5DACA] rounded-3xl shadow-[0_10px_32px_rgba(26,77,46,0.12)] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FiAlertCircle className="text-[#769C7B]" size={18} />
                    <h3 className="text-sm font-black text-[#1A4D2E] uppercase tracking-widest">Detalle del rechazo</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#F6F0E6] rounded-2xl p-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#769C7B] mb-1">Motivo</p>
                      <p className="text-sm text-[#1A4D2E] leading-relaxed">{rejectionReason || "No se especificó un motivo."}</p>
                    </div>
                    {rejectionDate && (
                      <div className="bg-[#F6F0E6] rounded-2xl p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#769C7B] mb-1">Fecha</p>
                        <p className="text-sm font-semibold text-[#1A4D2E]">
                          {new Date(rejectionDate).toLocaleString("es-MX", {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
            </motion.aside>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              <img src={selectedImage} alt="Imagen ampliada" className="w-full h-full object-contain rounded-2xl" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

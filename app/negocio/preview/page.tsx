"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin, FiPhone, FiGlobe, FiFileText, FiImage, FiClock,
  FiCheckCircle, FiAlertCircle, FiArrowLeft, FiShare2, FiEdit, FiMail, FiCreditCard
} from "react-icons/fi";
import WalletModal from "@/app/components/WalletModal";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();

interface BusinessData {
  id: string;
  uid: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "archivado";
  archivedReason?: string;
  archivedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string | null;
  business: {
    name: string;
    category: string;
    phone: string;
    location: string;
    website: string;
    rfc: string;
    cp: string;
    description: string;
    schedule?: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
    estimatedCost?: string;
    subcategories?: string[];
    logo: string;
    images: string[];
    owner: string;
    createdAt: string;
    latitud?: string | null;
    longitud?: string | null;
  };
}

export default function BusinessPreviewPage() {
  const user = usePitzbolUser();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    async function fetchBusiness() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("pitzbol_token");
        const endpoint = businessId
          ? `${BACKEND_URL}/api/business/by-id/${businessId}`
          : `${BACKEND_URL}/api/business/my-business`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("No encontramos ningún negocio registrado para tu cuenta.");
          } else {
            setError("Error al cargar los detalles del negocio.");
          }
          setBusiness(null);
          return;
        }

        const data = await response.json();
        if (data.success && data.business) {
          console.log("📦 Datos del negocio recibidos:", data.business);
          console.log("📍 Coordenadas en business:", {
            latitud: data.business.business?.latitud,
            longitud: data.business.business?.longitud
          });
          setBusiness(data.business);
        } else {
          setError("No se pudieron cargar los detalles.");
          setBusiness(null);
        }
      } catch (err) {
        console.error("Error fetching business:", err);
        setError("Error de conexión. Intenta más tarde.");
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [user?.uid, businessId]);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4">Inicia sesión</h2>
          <p className="text-[#1A4D2E]/70 mb-6">Debes iniciar sesión para ver los detalles de tu negocio.</p>
          <Link
            href="/"
            className="inline-block bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Volver
          </Link>
        </motion.div>
      </div>
    );

  if (loading)
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

  if (error || !business)
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
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4">No hay negocio</h2>
          <p className="text-[#1A4D2E]/70 mb-6">
            {error || "No encontramos un negocio registrado para tu cuenta."}
          </p>
          <Link
            href="/"
            className="inline-block bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    );

  const statusConfig: {
    [key in "PENDING" | "APPROVED" | "REJECTED" | "archivado"]: {
      label: string;
      color: string;
      bgColor: string;
      icon: React.ReactNode;
      description: string;
    };
  } = {
    PENDING: {
      label: "En revisión",
      color: "text-[#B56A00]",
      bgColor: "bg-[#FFF7E8] border-[#F2C47C]",
      icon: <FiClock className="text-[#B56A00]" size={20} />,
      description: "Tu negocio está siendo revisado por nuestro equipo"
    },
    APPROVED: {
      label: "Aprobado",
      color: "text-[#1F6B3A]",
      bgColor: "bg-[#E9F7EE] border-[#9ED9B2]",
      icon: <FiCheckCircle className="text-[#1F6B3A]" size={20} />,
      description: "¡Tu negocio ha sido aprobado y es visible para usuarios!"
    },
    REJECTED: {
      label: "Rechazado",
      color: "text-[#8B0000]",
      bgColor: "bg-[#FDEAEA] border-[#F2A5A5]",
      icon: <FiAlertCircle className="text-[#8B0000]" size={20} />,
      description: "Tu solicitud fue rechazada. Revisa los comentarios para más detalles."
    },
    archivado: {
      label: "Archivado",
      color: "text-gray-600",
      bgColor: "bg-gray-100 border-gray-300",
      icon: <FiAlertCircle className="text-gray-600" size={20} />,
      description: "Este negocio ha sido archivado"
    }
  };

  const status = business.status as keyof typeof statusConfig;
  const isRejected = status === "REJECTED" || (!!business.rejectedAt || !!business.rejectionReason);
  const config = isRejected
    ? statusConfig.REJECTED
    : (statusConfig[status] || statusConfig.PENDING);
  const rejectionReason = business.rejectionReason || business.archivedReason;
  const rejectionDate = business.rejectedAt || business.archivedAt;

  const scheduleLines = Object.entries(business.business.schedule || {})
    .filter(([, day]) => day?.enabled)
    .map(([day, hours]) => `${day}: ${hours?.open || "--:--"} - ${hours?.close || "--:--"}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Botón Volver */}
        <Link href="/negocio/estatus" className="inline-flex items-center gap-2 text-[#0D601E] hover:text-[#094d18] font-semibold mb-6 transition-colors">
          <FiArrowLeft size={20} /> Volver
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-lg overflow-hidden border border-[#1A4D2E]/10"
        >
          {/* Header con Estatus */}
          <div className={`border-b-4 p-8 md:p-12 text-center ${config.bgColor}`}>
            <div className="flex justify-center mb-4">
              {config.icon}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A4D2E] mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              {business.business.name}
            </h1>
            <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm mb-4 ${config.color} bg-white/40`}>
              {config.label}
            </div>
            <p className="text-[#1A4D2E]/70 max-w-2xl mx-auto">{config.description}</p>
          </div>

          {/* Contenido Principal */}
          <div className="p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Columna Izquierda - Logo y Detalles */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col gap-6"
              >
                {/* Logo */}
                <div className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl p-8 flex items-center justify-center min-h-[250px]">
                  {business.business.logo ? (
                    <img
                      src={business.business.logo}
                      alt={business.business.name}
                      className="max-h-full max-w-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="text-center text-[#769C7B]">
                      <FiImage size={60} className="mx-auto mb-2 opacity-30" />
                      <p>Sin logo disponible</p>
                    </div>
                  )}
                </div>

                {/* Categoría e Información Rápida */}
                <div className="space-y-3">
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Categoría</p>
                    <p className="text-lg font-bold text-[#1A4D2E]">{business.business.category}</p>
                  </div>
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Fecha de Solicitud</p>
                    <p className="text-lg font-bold text-[#1A4D2E]">
                      {new Date(business.business.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Columna Derecha - Detalles de Contacto */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-2xl font-black text-[#1A4D2E] mb-2">Información de Contacto</h2>

                {/* Teléfono */}
                <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                      <FiPhone className="text-[#0D601E]" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Teléfono</p>
                      <p className="text-lg font-bold text-[#1A4D2E]">{business.business.phone}</p>
                      <a
                        href={`tel:${business.business.phone}`}
                        className="text-xs text-[#0D601E] font-semibold mt-2 hover:underline"
                      >
                        Llamar
                      </a>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                      <FiMapPin className="text-[#0D601E]" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Ubicación</p>
                      <p className="text-lg font-bold text-[#1A4D2E]">{business.business.location}</p>
                      <p className="text-sm text-[#769C7B] mt-1">CP: {business.business.cp}</p>
                    </div>
                  </div>
                </div>

                {/* Sitio Web */}
                <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                      <FiGlobe className="text-[#0D601E]" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Sitio Web</p>
                      <a
                        href={business.business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-[#0D601E] hover:underline break-all"
                      >
                        {business.business.website}
                      </a>
                    </div>
                  </div>
                </div>

                {/* RFC */}
                <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                  <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">RFC</p>
                  <p className="text-lg font-bold text-[#1A4D2E] font-mono">{business.business.rfc}</p>
                </div>

                {business.business.estimatedCost && (
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Costo estimado</p>
                    <p className="text-lg font-bold text-[#1A4D2E]">{business.business.estimatedCost}</p>
                  </div>
                )}

                {Array.isArray(business.business.subcategories) && business.business.subcategories.length > 0 && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-2">Subcategorías</p>
                    <div className="flex flex-wrap gap-2">
                      {business.business.subcategories.map((sub) => (
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
                      {scheduleLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Email del negocio */}
                {business.email && (
                  <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                        <FiMail className="text-[#0D601E]" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Email</p>
                        <a
                          href={`mailto:${business.email}`}
                          className="text-lg font-bold text-[#0D601E] hover:underline break-all"
                        >
                          {business.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Descripción */}
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
              <p className={`leading-relaxed whitespace-pre-wrap ${
                business.business.description
                  ? "text-[#1A4D2E]"
                  : "text-[#769C7B] italic"
              }`}>
                {business.business.description || "No hay descripción registrada aún"}
              </p>
            </motion.div>

            {/* Galería de Imágenes */}
            {business.business.images && business.business.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-12"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E] mb-6">Galería</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {business.business.images.map((image, index) => (
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

            {/* Detalles Técnicos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#F6F0E6]/50 rounded-3xl p-6 border border-[#1A4D2E]/10 mb-8"
            >
              <h3 className="text-lg font-black text-[#1A4D2E] mb-4">Información de Registro</h3>
              <div className="grid md:grid-cols-1 gap-4">
                <div>

                {isRejected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-8 bg-[#FDEAEA] border border-[#F2A5A5] rounded-2xl p-6"
                  >
                    <h3 className="text-lg font-black text-[#8B0000] mb-3">Detalle del rechazo</h3>
                    <div className="space-y-3 text-sm text-[#5E1A1A]">
                      <p>
                        <span className="font-bold">Estado actual:</span> Rechazada
                      </p>
                      <p>
                        <span className="font-bold">Motivo:</span> {rejectionReason || "No se especificó un motivo."}
                      </p>
                      <p>
                        <span className="font-bold">Fecha de rechazo:</span>{" "}
                        {rejectionDate
                          ? new Date(rejectionDate).toLocaleString("es-MX", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No disponible"}
                      </p>
                    </div>
                  </motion.div>
                )}
                  <p className="text-xs text-[#769C7B] font-semibold uppercase">Email contacto Negocio</p>
                  <p className="text-sm text-[#1A4D2E] break-all">{business.email}</p>
                </div>
              </div>
            </motion.div>

            {/* Mapa de Ubicación */}
            {business.business.location && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E] mb-6">Ubicación en el Mapa</h3>
                <LocationMap 
                  location={business.business.location} 
                  businessName={business.business.name}
                  latitud={business.business.latitud}
                  longitud={business.business.longitud}
                />
              </motion.div>
            )}

            {/* Botones de Acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-[#F6F0E6] hover:bg-[#E8F5E9] text-[#1A4D2E] font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowLeft /> Atrás
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex-1 bg-white border-2 border-[#0D601E]/20 hover:border-[#0D601E] text-[#1A4D2E] font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <FiCreditCard /> Métodos de Pago
              </button>
              {business.status !== "PENDING" && (
                <button
                  onClick={() => {
                    if (navigator.share)
                      navigator.share({
                        title: business.business.name,
                        text: `Mira mi negocio: ${business.business.name}`,
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

      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {/* Modal de imagen */}
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
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="w-full h-full object-contain rounded-2xl"
              />
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

// Componente de Mapa para mostrar la ubicación
const LocationMap = dynamic(
  () => Promise.resolve(LocationMapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-[#F6F0E6] rounded-3xl flex items-center justify-center border border-[#1A4D2E]/10">
        <p className="text-[#769C7B] font-semibold">Cargando mapa...</p>
      </div>
    ),
  }
);

function LocationMapComponent({ 
  location, 
  businessName,
  latitud,
  longitud 
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
    console.log("🗺️ LocationMap - Datos recibidos:", { latitud, longitud, location });
    
    // Si tenemos latitud y longitud guardadas, usarlas directamente
    if (latitud && longitud) {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      
      console.log("🔢 Parseando coordenadas:", { lat, lon, isNaNLat: isNaN(lat), isNaNLon: isNaN(lon) });
      
      if (!isNaN(lat) && !isNaN(lon)) {
        console.log("✅ Usando coordenadas guardadas:", lat, lon);
        setCoordinates([lat, lon]);
        setError(false);
        setLoading(false);
        return;
      } else {
        console.warn("⚠️ Coordenadas guardadas inválidas");
      }
    } else {
      console.warn("⚠️ No hay coordenadas guardadas, intentando geocodificar");
    }

    // Si no hay coordenadas, intentar geocodificar la dirección
    const geocodeAddress = async () => {
      try {
        console.log("🌍 Geocodificando dirección:", location);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();
        
        console.log("📍 Resultado de geocodificación:", data);
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          console.log("✅ Coordenadas geocodificadas:", lat, lon);
          setCoordinates([lat, lon]);
          setError(false);
        } else {
          console.error("❌ No se encontraron resultados de geocodificación");
          setError(true);
        }
      } catch (err) {
        console.error("❌ Error geocoding address:", err);
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
            No hay coordenadas guardadas para este negocio. Por favor, asegúrate de colocar el marcador en el mapa durante el registro.
          </p>
        </div>
      </div>
    );
  }

  if (typeof window === "undefined") {
    return null;
  }

  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  const L = require("leaflet");

  // Fix para iconos de Leaflet en Next.js
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-[#1A4D2E]/20">
      <MapContainer
        center={coordinates}
        zoom={15}
        style={{ height: "400px", width: "100%" }}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
      >
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

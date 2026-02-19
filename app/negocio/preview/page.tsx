"use client";
import React, { useEffect, useState } from "react";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin, FiPhone, FiGlobe, FiFileText, FiImage, FiClock,
  FiCheckCircle, FiAlertCircle, FiArrowLeft, FiShare2, FiEdit
} from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface BusinessData {
  id: string;
  uid: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "archivado";
  business: {
    name: string;
    category: string;
    phone: string;
    location: string;
    website: string;
    rfc: string;
    cp: string;
    description: string;
    logo: string;
    images: string[];
    owner: string;
    createdAt: string;
  };
}

export default function BusinessPreviewPage() {
  const user = usePitzbolUser();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    async function fetchBusiness() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("pitzbol_token");
        const response = await fetch(`${BACKEND_URL}/api/business/my-business`, {
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
  }, [user?.uid]);

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
  const config = statusConfig[status] || statusConfig.PENDING;

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
              </motion.div>
            </div>

            {/* Descripción */}
            {business.business.description && (
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
                <p className="text-[#1A4D2E] leading-relaxed whitespace-pre-wrap">{business.business.description}</p>
              </motion.div>
            )}

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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#769C7B] font-semibold uppercase">Email</p>
                  <p className="text-sm text-[#1A4D2E] break-all">{business.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#769C7B] font-semibold uppercase">ID del Negocio</p>
                  <p className="text-sm text-[#1A4D2E] font-mono">{business.id}</p>
                </div>
              </div>
            </motion.div>

            {/* Botones de Acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-[#F6F0E6] hover:bg-[#E8F5E9] text-[#1A4D2E] font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowLeft /> Atrás
              </button>
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
            </motion.div>
          </div>
        </motion.div>
      </div>

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

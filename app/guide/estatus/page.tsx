"use client";
import React, { useEffect, useState } from "react";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface GuideRequest {
  uid: string;
  nombre: string;
  email: string;
  status: "pendiente" | "aprobado" | "rechazado";
  createdAt: string;
  updatedAt: string;
  rfc: string;
  codigoPostal: string;
  categorias: string[];
  facePhoto?: string | { url?: string; secure_url?: string };
  validacion_biometrica?: {
    porcentaje: string | number;
    nivel: string;
    mensaje: string;
  };
}

export default function GuideEstatusPage() {
  const user = usePitzbolUser();
  const [guideRequest, setGuideRequest] = useState<GuideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchGuideRequest() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("pitzbol_token");
        if (!token) {
          setError("No estás autenticado. Por favor inicia sesión.");
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/api/guides/my-request`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("No encontramos ninguna solicitud de guía para tu cuenta.");
          } else {
            setError("Error al cargar el estatus de tu solicitud.");
          }
          setGuideRequest(null);
          return;
        }

        const data = await response.json();
        setGuideRequest(data);
      } catch (err) {
        console.error("Error fetching guide request:", err);
        setError("Error de conexión. Intenta más tarde.");
        setGuideRequest(null);
      } finally {
        setLoading(false);
      }
    }

    fetchGuideRequest();
  }, [user]);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8F7] p-4">
        <div className="text-center">
          <p className="text-lg text-[#1A4D2E] mb-4">
            Debes iniciar sesión para ver el estatus de tu solicitud.
          </p>
          <Link href="/" className="text-[#0D601E] underline font-semibold">
            Volver al inicio
          </Link>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8F7]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl text-[#0D601E]"
        >
          <FiClock />
        </motion.div>
      </div>
    );

  if (error || !guideRequest)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8F7] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4">
            No hay solicitud
          </h2>
          <p className="text-[#1A4D2E]/70 mb-6">
            {error || "No encontramos una solicitud de guía para tu cuenta."}
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

  const statusConfig = {
    pendiente: {
      icon: FiClock,
      headerClass: "bg-[#FFF7E8] border-[#F2C47C]",
      badgeClass: "bg-[#FFE3B5] text-[#8B5A00]",
      iconWrapClass: "bg-[#FFEBD1]",
      iconClass: "text-[#B56A00]",
      title: "Tu solicitud está en revisión",
      message:
        "Estamos verificando tus datos e identificación. Este proceso puede tomar hasta 24 horas.",
      badge: "En Revisión",
    },
    aprobado: {
      icon: FiCheckCircle,
      headerClass: "bg-[#E9F7EE] border-[#9ED9B2]",
      badgeClass: "bg-[#CFF0DB] text-[#1F6B3A]",
      iconWrapClass: "bg-[#DDF5E6]",
      iconClass: "text-[#1F6B3A]",
      title: "¡Bienvenido como guía!",
      message:
        "Tu solicitud ha sido aprobada. Ya puedes publicar tours y conectar con turistas.",
      badge: "Aprobado",
    },
    rechazado: {
      icon: FiXCircle,
      headerClass: "bg-[#FDEAEA] border-[#F2A5A5]",
      badgeClass: "bg-[#F7C9C9] text-[#8B0000]",
      iconWrapClass: "bg-[#F9DCDC]",
      iconClass: "text-[#8B0000]",
      title: "Tu solicitud fue rechazada",
      message:
        "Lamentablemente, tu solicitud no cumple con nuestros requisitos. Contacta a soporte para más información.",
      badge: "Rechazado",
    },
  };

  const config = statusConfig[guideRequest.status];
  const Icon = config.icon;

  const facePhotoUrl =
    typeof guideRequest.facePhoto === "string"
      ? guideRequest.facePhoto
      : guideRequest.facePhoto?.url || guideRequest.facePhoto?.secure_url || "";

  return (
    <div className="min-h-screen bg-[#FDFCF9] px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[28px] shadow-xl overflow-hidden border border-[#1A4D2E]/10"
        >
          <div
            className={`border-b-4 p-6 md:p-8 text-center ${config.headerClass}`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${config.iconWrapClass}`}
            >
              <Icon className={config.iconClass} size={40} />
            </div>
            <div
              className={`inline-block px-4 py-2 rounded-full font-bold text-sm mb-4 ${config.badgeClass}`}
            >
              {config.badge}
            </div>
            <h1 className="text-3xl font-bold text-[#1A4D2E] mb-2">
              {config.title}
            </h1>
            <p className="text-[#1A4D2E]/70 text-lg">{config.message}</p>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-black text-[#1A4D2E]">Detalles de tu solicitud</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-sm text-[#1A4D2E]/60 font-semibold mb-1">Nombre</p>
                    <p className="text-base md:text-lg text-[#1A4D2E] font-bold">
                      {guideRequest.nombre}
                    </p>
                  </div>
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-sm text-[#1A4D2E]/60 font-semibold mb-1">Email</p>
                    <p className="text-base md:text-lg text-[#1A4D2E] font-bold break-all">
                      {guideRequest.email}
                    </p>
                  </div>
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-sm text-[#1A4D2E]/60 font-semibold mb-1">RFC</p>
                    <p className="text-base md:text-lg text-[#1A4D2E] font-bold">
                      {guideRequest.rfc}
                    </p>
                  </div>
                  <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                    <p className="text-sm text-[#1A4D2E]/60 font-semibold mb-1">Código Postal</p>
                    <p className="text-base md:text-lg text-[#1A4D2E] font-bold">
                      {guideRequest.codigoPostal}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF7F1] border border-[#1A4D2E]/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center">
                <h3 className="text-sm font-black text-[#1A4D2E] uppercase tracking-widest mb-3">
                  Validación Facial
                </h3>
                {facePhotoUrl ? (
                  <img
                    src={facePhotoUrl}
                    alt="Rostro para validación"
                    className="w-40 h-56 md:w-44 md:h-60 object-cover rounded-2xl border-2 border-[#1A4D2E]/20 shadow-md"
                  />
                ) : (
                  <div className="w-40 h-56 md:w-44 md:h-60 rounded-2xl border-2 border-dashed border-[#1A4D2E]/20 flex items-center justify-center text-xs text-[#1A4D2E]/60">
                    Sin imagen disponible
                  </div>
                )}
                <p className="mt-3 text-[11px] text-[#1A4D2E]/70 italic">
                  Imagen capturada para verificar tu identidad.
                </p>
              </div>
            </div>

            {guideRequest.categorias && guideRequest.categorias.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#1A4D2E] mb-3">
                  Tus especialidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guideRequest.categorias.map((cat, idx) => (
                    <span
                      key={idx}
                      className="bg-[#0D601E] text-white px-3 py-1.5 rounded-full text-sm font-semibold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm text-[#1A4D2E]/70">
                <div>
                  <p className="font-semibold text-[#1A4D2E]">
                    Solicitud enviada
                  </p>
                  <p>
                    {new Date(guideRequest.createdAt).toLocaleDateString(
                      "es-MX",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#1A4D2E]">
                    Última actualización
                  </p>
                  <p>
                    {new Date(guideRequest.updatedAt).toLocaleDateString(
                      "es-MX",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F6F0E6]/60 p-6 flex flex-col md:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex-1 text-center bg-white text-[#1A4D2E] px-6 py-2.5 rounded-full font-semibold border border-[#1A4D2E]/15 hover:bg-[#FDFCF9] transition-colors"
            >
              Volver al inicio
            </Link>
            {guideRequest.status === "pendiente" && (
              <Link
                href="/perfil"
                className="flex-1 text-center bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
              >
                Ver mi perfil
              </Link>
            )}
            {guideRequest.status === "aprobado" && (
              <Link
                href="/tours"
                className="flex-1 text-center bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
              >
                Publicar un tour
              </Link>
            )}
            {guideRequest.status === "rechazado" && (
              <Link
                href="/soporte"
                className="flex-1 text-center bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
              >
                Contactar soporte
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
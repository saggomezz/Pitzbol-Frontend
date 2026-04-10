"use client";
import React, { useEffect, useState } from "react";
import { usePitzbolUser } from "../../lib/usePitzbolUser";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock, FiAlertCircle } from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();

export default function EstatusNegocioPage() {
  const user = usePitzbolUser();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    async function fetchBusiness() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("pitzbol_token");
        const response = await fetch(`/api/business/my-business`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("No encontramos ningún negocio registrado para tu cuenta.");
          } else {
            setError("Error al cargar el negocio.");
          }
          setBusiness(null);
          return;
        }

        const data = await response.json();
        if (data.success && data.business) {
          setBusiness(data.business);
        } else {
          setError("No se pudo cargar el negocio.");
          setBusiness(null);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Error de conexión.");
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();

    const handleBusinessStatusChanged = (event: any) => {
      const { businessId, status } = event.detail || {};
      console.log(`[estatus] Business status changed: ${businessId} -> ${status}`);
      fetchBusiness();
    };

    window.addEventListener("businessStatusChanged", handleBusinessStatusChanged as EventListener);

    return () => {
      window.removeEventListener("businessStatusChanged", handleBusinessStatusChanged as EventListener);
    };
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
          <p className="text-[#1A4D2E]/70 mb-6">Debes iniciar sesión para ver el estatus de tu negocio.</p>
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
          <div className="flex flex-col gap-3">
            <Link
              href="/negocio"
              className="bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors text-center"
            >
              Publicar negocio
            </Link>
            <Link
              href="/"
              className="text-[#0D601E] px-6 py-2.5 rounded-full font-semibold hover:underline transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </motion.div>
      </div>
    );

  const rejectionReason = business.rejectionReason || business.archivedReason;
  const rejectionDate = business.rejectedAt || business.archivedAt;
  const isRejected = business.status === "REJECTED" || !!rejectionReason || !!rejectionDate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-lg overflow-hidden border border-[#1A4D2E]/10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              Estatus de tu Negocio
            </h1>
            <p className="text-white/70">Monitorea el progreso de tu solicitud</p>
          </div>

          {/* Contenido */}
          <div className="p-8 md:p-12">
            {/* Tarjeta de Negocio */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Logo */}
                {business.business?.logo && (
                  <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-[#F6F0E6] flex items-center justify-center">
                    <img
                      src={business.business.logo}
                      alt={business.business.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-black text-[#1A4D2E] mb-2">
                    {business.business?.name || "Sin nombre"}
                  </h2>
                  <p className="text-[#769C7B] text-sm md:text-base mb-4">
                    {business.business?.category || "Categoría no especificada"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className={`px-4 py-2 rounded-full font-bold text-xs uppercase ${
                        business.status === "PENDING"
                        ? "bg-[#FFF7E8] text-[#B56A00]"
                          : business.status === "APPROVED"
                        ? "bg-[#E9F7EE] text-[#1F6B3A]"
                        : "bg-[#FDEAEA] text-[#8B0000]"
                    }`}>
                        {business.status === "PENDING"
                        ? "En revisión"
                          : business.status === "APPROVED"
                        ? "Aprobado"
                        : "Rechazado"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

              {isRejected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-8 bg-[#FDEAEA] border border-[#F2A5A5] rounded-2xl p-6"
                >
                  <p className="text-sm font-semibold text-[#8B0000] mb-2">Solicitud rechazada</p>
                  <p className="text-sm text-[#5E1A1A]">
                    <span className="font-bold">Motivo:</span> {rejectionReason || "No se especificó un motivo."}
                  </p>
                  <p className="text-sm text-[#5E1A1A] mt-1">
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
                </motion.div>
              )}

            {/* Descripción */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 bg-[#F6F0E6]/50 rounded-2xl p-6 border border-[#1A4D2E]/10"
            >
              <p className="text-sm text-[#769C7B] font-semibold uppercase mb-2">Descripción</p>
              <p className={`leading-relaxed ${
                business.business?.description
                  ? "text-[#1A4D2E]"
                  : "text-[#769C7B] italic"
              }`}>
                {business.business?.description || "No hay descripción registrada aún"}
              </p>
            </motion.div>

            {/* Galería rápida */}
            {business.business?.images && business.business.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <p className="text-sm text-[#769C7B] font-semibold uppercase mb-3">Imágenes</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {business.business.images.slice(0, 3).map((img: string, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden h-24 md:h-32 bg-[#F6F0E6]">
                      <img src={img} alt={`Imagen ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Botón Ver Detalles */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3"
            >
              <Link
                href={business?.id ? `/negocio/preview?id=${business.id}` : "/negocio/preview"}
                className="flex-1 bg-[#0D601E] hover:bg-[#094d18] text-white font-bold py-3 px-6 rounded-full transition-colors text-center flex items-center justify-center gap-2"
              >
                Ver detalles completos <FiArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

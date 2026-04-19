"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, FiUsers,
  FiCheckCircle,
} from "react-icons/fi";
import { FaBus, FaMapMarkedAlt, FaWhatsapp } from "react-icons/fa";

interface Tour {
  id: string;
  titulo: string;
  descripcion: string;
  destino: string;
  fotoPrincipal: string;
  duracion: string;
  precio: string;
  idiomas: string[];
  queIncluye: string[];
  puntoRecogida: string;
  capacidad: string;
  tipoVehiculo: string[];
  disponibilidad: string;
  empresaId: string;
  empresaNombre: string;
  empresaLogo: string;
  createdAt: string;
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tours/${id}`)
      .then(r => r.json())
      .then(data => { if (data.success && data.tour) setTour(data.tour); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF7]">
        <FaBus className="text-gray-200 text-5xl" />
        <p className="text-gray-500">Tour no encontrado.</p>
        <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-16">
      {/* Hero image */}
      <div className="relative h-64 md:h-96 overflow-hidden bg-[#1A4D2E]">
        {tour.fotoPrincipal ? (
          <Image src={tour.fotoPrincipal} alt={tour.titulo} fill className="object-cover opacity-80" priority />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FaMapMarkedAlt className="text-white/20 text-8xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/25 px-3 py-1.5 rounded-full transition-colors"
        >
          <FiArrowLeft size={14} /> Volver
        </button>

        <div className="absolute bottom-5 left-0 right-0 px-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
              <FiMapPin size={10} /> {tour.destino}
            </span>
          </div>
          <h1 className="text-white font-black text-2xl md:text-3xl leading-tight drop-shadow-lg">
            {tour.titulo}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Resumen rápido */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { icon: <FiClock className="text-[#0D601E]" />, label: "Duración", value: tour.duracion },
            { icon: <FiDollarSign className="text-[#0D601E]" />, label: "Precio", value: tour.precio },
            { icon: <FiUsers className="text-[#0D601E]" />, label: "Capacidad", value: tour.capacidad || "—" },
            { icon: <FiMapPin className="text-[#0D601E]" />, label: "Recogida", value: tour.puntoRecogida || "A consultar" },
          ].filter(i => i.value).map(({ icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-[#0D601E]/10 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
              <p className="text-xs font-bold text-[#1A4D2E] mt-0.5 leading-tight">{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Descripción */}
        {tour.descripcion && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-2">Descripción</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{tour.descripcion}</p>
          </motion.div>
        )}

        {/* ¿Qué incluye? */}
        {tour.queIncluye?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">¿Qué incluye?</h2>
            <ul className="space-y-2">
              {tour.queIncluye.map(q => (
                <li key={q} className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={14} /> {q}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Detalles adicionales */}
        {(tour.idiomas?.length > 0 || tour.tipoVehiculo?.length > 0 || tour.disponibilidad) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10 space-y-4"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide">Detalles</h2>

            {tour.idiomas?.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Idiomas</p>
                <div className="flex flex-wrap gap-2">
                  {tour.idiomas.map(i => (
                    <span key={i} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {tour.tipoVehiculo?.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Transporte</p>
                <div className="flex flex-wrap gap-2">
                  {tour.tipoVehiculo.map(v => (
                    <span key={v} className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {tour.disponibilidad && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Disponibilidad</p>
                <p className="text-sm text-gray-700">{tour.disponibilidad}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Empresa */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Empresa organizadora</h2>
          <Link
            href={`/empresa/transportes/${tour.empresaId}`}
            className="flex items-center gap-3 group"
          >
            {tour.empresaLogo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                <Image src={tour.empresaLogo} alt={tour.empresaNombre} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                <FaBus className="text-[#1A4D2E] text-lg" />
              </div>
            )}
            <div>
              <p className="font-bold text-[#1A4D2E] text-sm group-hover:underline">{tour.empresaNombre}</p>
              <p className="text-[11px] text-gray-400">Ver perfil de la empresa →</p>
            </div>
          </Link>
        </motion.div>

        {/* CTA contacto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] rounded-2xl p-5 text-white text-center shadow-lg"
        >
          <p className="font-bold text-base mb-1">¿Te interesa este tour?</p>
          <p className="text-white/70 text-xs mb-4">Contacta directamente a la empresa para reservar y obtener más información.</p>
          <Link
            href={`/empresa/transportes/${tour.empresaId}`}
            className="inline-flex items-center gap-2 bg-white text-[#1A4D2E] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#F6F9F6] transition-colors shadow"
          >
            Ver empresa y contactar
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

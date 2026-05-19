"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, FiUsers,
  FiCheckCircle, FiCalendar, FiUser,
} from "react-icons/fi";
import { FaBus, FaMapMarkedAlt, FaWhatsapp } from "react-icons/fa";
import { usePitzbolUser } from "@/lib/usePitzbolUser";

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
  const user = usePitzbolUser();
  const [paqueteFecha, setPaqueteFecha] = useState("");
  const [paqueteHoraInicio, setPaqueteHoraInicio] = useState("09:00");
  const [paqueteNumPersonas, setPaqueteNumPersonas] = useState(1);
  const [paqueteSubmitting, setPaqueteSubmitting] = useState(false);

  const parsePrecioPaquete = (precio: string) => {
    const cleaned = precio.replace(/[^0-9.,]/g, "").replace(/,/g, "");
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? value : 0;
  };

  const parseCapacidadPaquete = (capacidad: string) => {
    const cleaned = capacidad.replace(/[^0-9]/g, "");
    const value = Number.parseInt(cleaned, 10);
    return Number.isFinite(value) ? value : 0;
  };

  const handleReservePaquete = async () => {
    if (!tour) return;

    if (!user) {
      alert("Debes iniciar sesion para reservar un paquete");
      router.push("/");
      return;
    }

    if (!tour.empresaId) {
      alert("No se pudo identificar al guia de este paquete");
      return;
    }

    if (!paqueteFecha) {
      alert("Por favor selecciona una fecha");
      return;
    }

    if (!paqueteHoraInicio) {
      alert("Por favor selecciona una hora de inicio");
      return;
    }

    if (!paqueteNumPersonas || paqueteNumPersonas < 1) {
      alert("El numero de personas debe ser al menos 1");
      return;
    }

    const maxPersonas = parseCapacidadPaquete(tour.capacidad || "");
    if (maxPersonas && paqueteNumPersonas > maxPersonas) {
      alert(`El maximo de personas para este paquete es ${maxPersonas}`);
      return;
    }

    const fechaSeleccionada = new Date(paqueteFecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      alert("No puedes reservar para fechas pasadas");
      return;
    }

    const total = parsePrecioPaquete(tour.precio || "");
    if (!total || total <= 0) {
      alert("No se pudo calcular el precio del paquete");
      return;
    }

    const duracion: "medio" | "completo" = /medio/i.test(tour.duracion || "") ? "medio" : "completo";

    setPaqueteSubmitting(true);

    try {
      const reserva = {
        guideId: tour.empresaId,
        guideName: tour.empresaNombre,
        touristId: user.uid,
        touristName: user.nombre || "Turista",
        fecha: paqueteFecha,
        duracion,
        horaInicio: paqueteHoraInicio,
        numPersonas: paqueteNumPersonas,
        notas: `Paquete: ${tour.titulo} · ID: ${tour.id}`.trim(),
        total,
        status: "pendiente",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reserva),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/tours/pago/${data.bookingId}`);
      } else {
        alert("Error al crear la reserva: " + (data.message || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al crear reserva de paquete:", error);
      alert("Error al crear la reserva");
    } finally {
      setPaqueteSubmitting(false);
    }
  };

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

        {/* Guia */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Perfil del guia</h2>
          <Link
            href={`/perfil/${tour.empresaId}`}
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
              <p className="text-[11px] text-gray-400">Ver perfil del guia →</p>
            </div>
          </Link>
        </motion.div>

        {/* Reserva */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <p className="font-bold text-[#1A4D2E] text-base mb-1">Reserva tu paquete</p>
          <p className="text-gray-500 text-xs mb-4">Selecciona dia, hora y numero de personas.</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1A4D2E] mb-1">
                    <FiCalendar size={14} /> Dia
                  </label>
                  <input
                    type="date"
                    value={paqueteFecha}
                    onChange={(e) => setPaqueteFecha(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-[#1A4D2E]/20 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                    style={{ colorScheme: "light" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1A4D2E] mb-1">
                    <FiClock size={14} /> Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={paqueteHoraInicio}
                    onChange={(e) => setPaqueteHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-[#1A4D2E]/20 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1A4D2E] mb-1">
                    <FiUser size={14} /> Personas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={parseCapacidadPaquete(tour.capacidad || "") || undefined}
                    value={paqueteNumPersonas}
                    onChange={(e) => setPaqueteNumPersonas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#1A4D2E]/20 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                    placeholder="Personas"
                  />
                  {parseCapacidadPaquete(tour.capacidad || "") > 0 && (
                    <span className="mt-1 block text-[10px] text-gray-500">Maximo {parseCapacidadPaquete(tour.capacidad || "")} personas</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleReservePaquete}
                disabled={paqueteSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1A4D2E] text-white hover:bg-[#0D601E] transition-colors disabled:opacity-60"
              >
                {paqueteSubmitting ? "Procesando..." : "Reservar"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

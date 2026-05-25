"use client";

import { usePitzbolUser } from "@/lib/usePitzbolUser";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";
import {
    FiArrowLeft,
    FiCalendar,
    FiCheckCircle,
    FiClock, FiDollarSign,
    FiGlobe,
    FiMapPin,
    FiStar,
    FiUser,
    FiUsers,
} from "react-icons/fi";

const BACKEND = '/api';

interface Tour {
  id: string;
  titulo: string;
  descripcion: string;
  destino: string;
  fotoPrincipal: string;
  fotos?: string[];
  duracion: string;
  precio: string;
  idiomas: string[];
  queIncluye: string[];
  puntoRecogida: string;
  capacidad?: string;
  tipoVehiculo?: string[];
  disponibilidad: string;
  // Guía individual
  guiaId?: string;
  guiaNombre?: string;
  guiaFoto?: string;
  // Empresa/negocio (legacy)
  empresaId?: string;
  empresaNombre?: string;
  empresaLogo?: string;
  tipoGuia?: string;
}

// Parsea "Lun, Mié, Vie · 09:00 – 17:00" → { horaInicio, horaFin, dias }
function parseDisponibilidad(disp: string) {
  if (!disp) return null;
  const match = disp.match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);
  if (!match) return null;
  const diasPart = disp.split("·")[0]?.trim() || "";
  return {
    horaInicio: match[1],
    horaFin: match[2],
    dias: diasPart,
  };
}

// Genera opciones de hora dentro del rango disponible (cada 30 min)
function getHorasDisponibles(horaInicio: string, horaFin: string): string[] {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

  const start = toMins(horaInicio);
  const end = toMins(horaFin);
  const result: string[] = [];
  for (let m = start; m <= end - 30; m += 30) {
    result.push(toTime(m));
  }
  return result;
}

function parsePrecio(precio: string): number {
  const v = parseFloat(precio.replace(/[^0-9.]/g, ""));
  return isFinite(v) ? v : 0;
}

function parseCapacidad(cap?: string): number {
  if (!cap) return 0;
  const v = parseInt(cap.replace(/[^0-9]/g, ""), 10);
  return isFinite(v) ? v : 0;
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = usePitzbolUser();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [numPersonas, setNumPersonas] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ocupacion, setOcupacion] = useState<{ personasOcupadas: number; disponibles: number } | null>(null);
  const [loadingOcupacion, setLoadingOcupacion] = useState(false);

  const dispoInfo = useMemo(() => tour ? parseDisponibilidad(tour.disponibilidad) : null, [tour]);
  const horasDisponibles = useMemo(
    () => dispoInfo ? getHorasDisponibles(dispoInfo.horaInicio, dispoInfo.horaFin) : [],
    [dispoInfo]
  );

  // Guía: individual tiene guiaId, empresa tiene empresaId
  const guiaId = tour?.guiaId || tour?.empresaId || "";
  const guiaNombre = tour?.guiaNombre || tour?.empresaNombre || "Guía";
  const guiaFoto = tour?.guiaFoto || tour?.empresaLogo || "";

  const maxPersonas = parseCapacidad(tour?.capacidad);
  const precioNum = parsePrecio(tour?.precio || "");
  const totalPrecio = precioNum * numPersonas;

  useEffect(() => {
    if (!id) return;
    fetch(`${BACKEND}/tours/${id}`)
      .then(r => r.json())
      .then(data => { if (data.success && data.tour) setTour(data.tour); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Set primera hora disponible cuando cambia la disponibilidad
  useEffect(() => {
    if (horasDisponibles.length > 0 && !horaInicio) {
      setHoraInicio(horasDisponibles[0]);
    }
  }, [horasDisponibles]);

  // Consultar ocupación del paquete cuando se selecciona una fecha
  useEffect(() => {
    if (!id || !fecha || !maxPersonas) { setOcupacion(null); return; }
    setLoadingOcupacion(true);
    fetch(`${BACKEND}/paquetes/${id}/ocupacion?fecha=${fecha}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setOcupacion({ personasOcupadas: data.personasOcupadas, disponibles: data.disponibles });
      })
      .catch(() => {})
      .finally(() => setLoadingOcupacion(false));
  }, [id, fecha, maxPersonas]);

  const handleReservar = async () => {
    setError("");
    if (!user) { setError("Debes iniciar sesión para reservar."); return; }
    if (!guiaId) { setError("No se encontró al guía de este paquete."); return; }
    if (!fecha) { setError("Selecciona una fecha."); return; }
    if (!horaInicio) { setError("Selecciona una hora de inicio."); return; }
    if (numPersonas < 1) { setError("Mínimo 1 persona."); return; }
    if (ocupacion !== null && numPersonas > ocupacion.disponibles) {
      setError(`Solo quedan ${ocupacion.disponibles} plazas disponibles para esta fecha.`);
      return;
    }
    if (!ocupacion && maxPersonas && numPersonas > maxPersonas) { setError(`Máximo ${maxPersonas} personas.`); return; }
    if (precioNum <= 0) { setError("No se pudo calcular el precio."); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("pitzbol_token");
      const reserva = {
        guideId: guiaId,
        guideName: guiaNombre,
        touristId: user.uid,
        touristName: `${user.nombre || "Turista"} ${(user as any).apellido || ""}`.trim(),
        fecha,
        horaInicio,
        numPersonas,
        duracion: /medio/i.test(tour?.duracion || "") ? "medio" : "completo",
        notas: `Paquete: ${tour?.titulo} · ID: ${tour?.id}`,
        total: totalPrecio,
        status: "pendiente",
        createdAt: new Date().toISOString(),
        paqueteId: tour?.id,
        paqueteTitulo: tour?.titulo,
      };

      const res = await fetch(`${BACKEND}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(reserva),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/tours/pago/${data.bookingId}`);
      } else if (data.code === "TOUR_FULL") {
        const disponibles = data.disponibles ?? 0;
        setError(disponibles > 0
          ? `Solo quedan ${disponibles} plazas disponibles para esta fecha.`
          : "No quedan plazas disponibles para esta fecha.");
        setOcupacion({ personasOcupadas: data.capacidad - disponibles, disponibles });
      } else {
        setError(data.message || "Error al crear la reserva.");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="text-gray-500 font-medium">Paquete no encontrado.</p>
        <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
      </div>
    );
  }

  const allFotos = [tour.fotoPrincipal, ...(tour.fotos || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-20">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-56 md:h-80 overflow-hidden bg-[#1A4D2E]">
        {allFotos[0] ? (
          <Image src={allFotos[0]} alt={tour.titulo} fill className="object-cover opacity-80" priority />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FaMapMarkedAlt className="text-white/20 text-8xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <FiArrowLeft size={14} /> Volver
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full mb-2">
            <FiMapPin size={10} /> {tour.destino}
          </span>
          <h1 className="text-white font-black text-2xl md:text-3xl leading-tight drop-shadow-lg">{tour.titulo}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Chips de info ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {tour.duracion && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#E0F2F1] text-[#1A4D2E] px-3 py-1.5 rounded-full shadow-sm">
              <FiClock size={12} /> {tour.duracion}
            </span>
          )}
          {tour.precio && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-[#E8F5E9] border border-[#81C784] text-[#0D601E] px-3 py-1.5 rounded-full shadow-sm">
              <FiDollarSign size={12} /> {tour.precio} por persona
            </span>
          )}
          {maxPersonas > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#E0F2F1] text-[#1A4D2E] px-3 py-1.5 rounded-full shadow-sm">
              <FiUsers size={12} /> Máx. {maxPersonas} personas
            </span>
          )}
          {tour.idiomas && tour.idiomas.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#E0F2F1] text-[#1A4D2E] px-3 py-1.5 rounded-full shadow-sm">
              <FiGlobe size={12} /> {tour.idiomas.join(" · ")}
            </span>
          )}
        </div>

        {/* ── Descripción ───────────────────────────────────────────────── */}
        {tour.descripcion && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-2">Descripción</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{tour.descripcion}</p>
          </div>
        )}

        {/* ── Incluye + Transporte ──────────────────────────────────────── */}
        {(tour.queIncluye?.length || tour.tipoVehiculo?.length || tour.puntoRecogida) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            {tour.queIncluye && tour.queIncluye.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-3">Incluye</h2>
                <div className="grid grid-cols-2 gap-2">
                  {tour.queIncluye.map(q => (
                    <div key={q} className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={13} /> {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tour.tipoVehiculo && tour.tipoVehiculo.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-2">Transporte</h2>
                <div className="flex flex-wrap gap-2">
                  {tour.tipoVehiculo.map(v => (
                    <span key={v} className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}
            {tour.puntoRecogida && (
              <div>
                <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-1">Punto de encuentro</h2>
                <p className="text-sm text-gray-600 flex items-start gap-1.5"><FiMapPin size={13} className="text-[#0D601E] mt-0.5 flex-shrink-0" />{tour.puntoRecogida}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Disponibilidad ────────────────────────────────────────────── */}
        {tour.disponibilidad && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-2">Disponibilidad</h2>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <FiClock size={13} className="text-[#0D601E]" /> {tour.disponibilidad}
            </p>
          </div>
        )}

        {/* ── Guía ─────────────────────────────────────────────────────── */}
        {guiaId && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-bold text-[#1A4D2E] uppercase tracking-widest mb-3">Tu guía</h2>
            <Link href={`/perfil/${guiaId}`} className="flex items-center gap-3 group">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-[#E8F5E9]">
                {guiaFoto ? (
                  <Image src={guiaFoto} alt={guiaNombre} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiUser className="text-[#1A4D2E] text-xl" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A4D2E] text-sm group-hover:underline truncate">{guiaNombre}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1"><FiStar size={10} className="text-amber-400" /> Ver perfil completo</p>
              </div>
              <span className="text-[#0D601E] text-xs font-medium">→</span>
            </Link>
          </div>
        )}



      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiX,
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { getBackendOrigin } from "@/lib/backendUrl";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const BACKEND_URL = getBackendOrigin();

interface GuideInfo {
  uid: string;
  nombre: string;
  fotoPerfil?: string;
  tarifa: number;
  tarifaCompleta?: number;
}

interface PaqueteInfo {
  id: string;
  titulo: string;
  descripcion?: string;
  duracion?: string;
  precio: number | string;
  destino?: string;
  fotos?: string[];
  capacidad?: number | string;
  disponibilidad?: string;
  horaInicio?: string;
}

export default function BookTourPage() {
  const params = useParams();
  const router = useRouter();
  const user = usePitzbolUser();
  const guideId = params?.uid as string;

  const [guide, setGuide] = useState<GuideInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Paquetes del guía
  const [paquetes, setPaquetes] = useState<PaqueteInfo[]>([]);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<PaqueteInfo | null>(null);
  const [loadingPaquetes, setLoadingPaquetes] = useState(false);

  // Datos del formulario
  const [fecha, setFecha] = useState("");
  const [duracion, setDuracion] = useState<"medio" | "completo">("medio");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [numPersonas, setNumPersonas] = useState(1);
  const [notas, setNotas] = useState("");

  // Esperar a que el hook cargue el usuario de localStorage antes de verificar
  useEffect(() => {
    const stored = localStorage.getItem("pitzbol_user");
    if (!stored) {
      alert("Debes iniciar sesión para reservar un tour");
      router.push("/");
    }
    setUserChecked(true);
  }, [router]);

  useEffect(() => {
    if (!userChecked || !user) return;

    const fetchGuideInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/guides/profile/${guideId}`);
        const data = await response.json();

        if (data.success) {
          setGuide(data.guide);
          // Cargar paquetes del guía
          setLoadingPaquetes(true);
          try {
            const paqRes = await fetch(`/api/tours/guia/${guideId}`);
            const paqData = await paqRes.json();
            if (paqData.success) {
              setPaquetes(paqData.tours || []);
            }
          } catch {
            // Si falla, simplemente no mostrar paquetes
          } finally {
            setLoadingPaquetes(false);
          }
        } else {
          alert("No se pudo cargar la información del guía");
          router.push("/tours");
        }
      } catch (error) {
        console.error("Error al cargar información del guía:", error);
        alert("Error al cargar información del guía");
        router.push("/tours");
      } finally {
        setLoading(false);
      }
    };

    if (guideId) {
      fetchGuideInfo();
    }
  }, [guideId, user, userChecked, router]);

  const parsePrecio = (precio: number | string): number => {
    if (typeof precio === "number") return precio;
    const cleaned = String(precio).replace(/[$\s,]/g, "").replace(/MXN/gi, "").trim();
    return parseFloat(cleaned) || 0;
  };

  const calcularTotal = () => {
    if (paqueteSeleccionado) {
      return parsePrecio(paqueteSeleccionado.precio) * numPersonas;
    }
    if (!guide) return 0;
    // Tarifa del guía es POR HORA. Multiplicar por horas y personas.
    // medio día = 4 h, día completo = 8 h
    const horas = duracion === "completo" ? 8 : 4;
    const tarifaBase = duracion === "completo" && guide.tarifaCompleta
      ? Number(guide.tarifaCompleta) || 0
      : Number(guide.tarifa) || 0;
    return tarifaBase * horas * numPersonas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !guide) return;

    // Validaciones
    if (!fecha) {
      alert("Por favor selecciona una fecha");
      return;
    }

    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      alert("No puedes reservar para fechas pasadas");
      return;
    }

    setSubmitting(true);

    try {
      const reserva: Record<string, unknown> = {
        guideId: guide.uid,
        guideName: guide.nombre,
        touristId: user.uid,
        touristName: user.nombre || "Turista",
        fecha,
        duracion: paqueteSeleccionado ? "completo" : duracion,
        horaInicio: paqueteSeleccionado
          ? (paqueteSeleccionado.horaInicio ||
             paqueteSeleccionado.disponibilidad?.match(/\u00b7\s*(\d{1,2}:\d{2})/)?.[1] ||
             "09:00")
          : horaInicio,
        numPersonas,
        notas,
        total: calcularTotal(),
        status: "pendiente",
        createdAt: new Date().toISOString(),
      };

      if (paqueteSeleccionado) {
        reserva.paqueteId = paqueteSeleccionado.id;
        reserva.paqueteTitulo = paqueteSeleccionado.titulo;
      }

      const response = await fetchWithAuth(`/api/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reserva),
      });

      const data = await response.json();

      if (data.success) {
        // Redirigir al pago
        router.push(`/tours/pago/${data.bookingId}`);
      } else if (response.status === 409 && data.code === 'TOUR_FULL') {
        const disponibles = data.disponibles ?? 0;
        setBookingError(
          disponibles === 0
            ? `Este tour está completo para la fecha seleccionada. Por favor elige otra fecha.`
            : `Capacidad insuficiente. Solo quedan ${disponibles} plaza${disponibles !== 1 ? 's' : ''} disponible${disponibles !== 1 ? 's' : ''}. Reduce el número de personas.`
        );
      } else if (response.status === 409) {
        setBookingError('El guía ya tiene una reserva en esa fecha y hora. Por favor elige otra fecha u horario.');
      } else {
        setBookingError(data.message || 'Error al crear la reserva. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      setBookingError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Guía no encontrado</h2>
          <button
            onClick={() => router.push("/tours")}
            className="bg-[#1A4D2E] text-white px-6 py-3 rounded-xl font-bold"
          >
            Volver a Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8 overflow-hidden"
        >
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A4D2E] mb-2 leading-tight wrap-break-word">
              Reservar Tour con {guide.nombre}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Completa la información para tu reserva
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de paquete */}
            {(loadingPaquetes || paquetes.length > 0) && (
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <FiPackage size={20} />
                  Selecciona un Paquete
                </label>

                {loadingPaquetes ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1A4D2E] border-t-transparent"></div>
                    Cargando paquetes...
                  </div>
                ) : (
                  <>
                    {paqueteSeleccionado ? (
                      <div className="border-2 border-[#1A4D2E] bg-[#F6F0E6] rounded-2xl p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A4D2E] text-base wrap-break-word">{paqueteSeleccionado.titulo}</p>
                            {paqueteSeleccionado.destino && (
                              <p className="text-sm text-gray-600 mt-0.5 wrap-break-word">{paqueteSeleccionado.destino}</p>
                            )}
                            {paqueteSeleccionado.descripcion && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2 wrap-break-word">{paqueteSeleccionado.descripcion}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2">
                              {paqueteSeleccionado.disponibilidad && (
                                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#1A4D2E]/20 text-[#1A4D2E] px-2 py-1 rounded-lg">
                                  <FiClock size={12} /> {paqueteSeleccionado.disponibilidad}
                                </span>
                              )}
                              {paqueteSeleccionado.duracion && (
                                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#1A4D2E]/20 text-[#1A4D2E] px-2 py-1 rounded-lg">
                                  {paqueteSeleccionado.duracion}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#1A4D2E]/20 text-[#1A4D2E] px-2 py-1 rounded-lg font-semibold">
                                ${parsePrecio(paqueteSeleccionado.precio).toLocaleString("es-MX")} MXN / persona
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setPaqueteSeleccionado(null); setBookingError(null); }}
                            className="self-end text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0 sm:self-start"
                            aria-label="Quitar paquete"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {paquetes.map((paq) => (
                          <button
                            key={paq.id}
                            type="button"
                            onClick={() => { setPaqueteSeleccionado(paq); setBookingError(null); }}
                            className="text-left w-full border-2 border-gray-200 hover:border-[#1A4D2E] hover:bg-[#F6F0E6]/50 rounded-xl p-4 transition-all overflow-hidden"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm wrap-break-word">{paq.titulo}</p>
                                {paq.destino && <p className="text-xs text-gray-500 mt-0.5 truncate">{paq.destino}</p>}
                                {paq.descripcion && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{paq.descripcion}</p>}
                              </div>
                              <div className="shrink-0 text-left sm:text-right">
                                <p className="font-bold text-[#1A4D2E] text-sm">${parsePrecio(paq.precio).toLocaleString("es-MX")}</p>
                                <p className="text-[10px] text-gray-400">por persona</p>
                                {paq.duracion && <p className="text-[10px] text-gray-500 mt-0.5">{paq.duracion}</p>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiCalendar size={20} />
                Fecha del Tour
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); setBookingError(null); }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                style={{ colorScheme: "light" }}
                required
              />
            </div>

            {/* Número de personas */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiUsers size={20} />
                Número de Personas
              </label>
              <input
                type="number"
                value={numPersonas}
                onChange={(e) => setNumPersonas(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                style={{ colorScheme: "light" }}
                required
              />
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiUser size={20} />
                Notas Adicionales (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Menciona preferencias, necesidades especiales, etc."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent resize-none"
                style={{ colorScheme: "light" }}
              />
            </div>

            {/* Resumen */}
            <div className="bg-linear-to-br from-[#F6F0E6] to-white p-6 rounded-2xl border-2 border-[#1A4D2E]">
              <h3 className="text-xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                <FiDollarSign size={24} />
                Resumen de Reserva
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Guía:</span>
                  <span className="font-semibold">{guide.nombre}</span>
                </div>
                {paqueteSeleccionado && (
                  <div className="flex justify-between text-gray-700">
                    <span>Paquete:</span>
                    <span className="font-semibold text-right max-w-[60%]">{paqueteSeleccionado.titulo}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Personas:</span>
                  <span className="font-semibold">{numPersonas}</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#1A4D2E]">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total:</span>
                  <span className="text-3xl font-bold text-[#1A4D2E]">
                    ${calcularTotal().toLocaleString("es-MX")} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Info importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-blue-600 mt-1 shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Podrás pagar con la tarjeta guardada en tu billetera</li>
                  <li>El guía recibirá tu solicitud y la confirmará</li>
                  <li>Puedes cancelar hasta 24 horas antes sin cargo</li>
                </ul>
              </div>
            </div>

            {/* Error de reserva */}
            {bookingError && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">No se pudo crear la reserva</p>
                  <p className="text-sm text-red-700 mt-0.5">{bookingError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingError(null)}
                  className="text-red-400 hover:text-red-600 shrink-0"
                  aria-label="Cerrar"
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/perfil/${guideId}`)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-bold transition-all duration-300"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-linear-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={20} />
                    Continuar al Pago
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

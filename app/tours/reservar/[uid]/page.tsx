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
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface GuideInfo {
  uid: string;
  nombre: string;
  fotoPerfil?: string;
  tarifa: number;
  tarifaCompleta?: number;
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

  const calcularTotal = () => {
    if (!guide) return 0;
    
    if (duracion === "completo" && guide.tarifaCompleta) {
      return guide.tarifaCompleta;
    }
    
    // Para medio día, calcular 4 horas
    return guide.tarifa * 4;
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
      const reserva = {
        guideId: guide.uid,
        guideName: guide.nombre,
        touristId: user.uid,
        touristName: user.nombre || "Turista",
        fecha,
        duracion,
        horaInicio,
        numPersonas,
        notas,
        total: calcularTotal(),
        status: "pendiente",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/bookings/create`, {
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
      } else {
        alert("Error al crear la reserva: " + (data.message || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      alert("Error al crear la reserva");
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1A4D2E] mb-2">
              Reservar Tour con {guide.nombre}
            </h1>
            <p className="text-gray-600">
              Completa la información para tu reserva
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiCalendar size={20} />
                Fecha del Tour
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
                required
              />
            </div>

            {/* Duración */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiClock size={20} />
                Duración
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDuracion("medio")}
                  className={`p-4 border-2 rounded-xl font-semibold transition-all ${
                    duracion === "medio"
                      ? "border-[#1A4D2E] bg-[#F6F0E6] text-[#1A4D2E]"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <p className="text-lg">Medio Día</p>
                  <p className="text-sm text-gray-600">4 horas</p>
                  <p className="text-xl font-bold mt-2">
                    ${(guide.tarifa * 4).toLocaleString("es-MX")} MXN
                  </p>
                </button>

                {guide.tarifaCompleta && (
                  <button
                    type="button"
                    onClick={() => setDuracion("completo")}
                    className={`p-4 border-2 rounded-xl font-semibold transition-all ${
                      duracion === "completo"
                        ? "border-[#1A4D2E] bg-[#F6F0E6] text-[#1A4D2E]"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <p className="text-lg">Día Completo</p>
                    <p className="text-sm text-gray-600">8 horas</p>
                    <p className="text-xl font-bold mt-2">
                      ${guide.tarifaCompleta.toLocaleString("es-MX")} MXN
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* Hora de inicio */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiClock size={20} />
                Hora de Inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent resize-none"
              />
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-br from-[#F6F0E6] to-white p-6 rounded-2xl border-2 border-[#1A4D2E]">
              <h3 className="text-xl font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                <FiDollarSign size={24} />
                Resumen de Reserva
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Guía:</span>
                  <span className="font-semibold">{guide.nombre}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Duración:</span>
                  <span className="font-semibold">
                    {duracion === "medio" ? "Medio Día (4h)" : "Día Completo (8h)"}
                  </span>
                </div>
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
              <FiAlertCircle className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Podrás pagar con la tarjeta guardada en tu billetera</li>
                  <li>El guía recibirá tu solicitud y la confirmará</li>
                  <li>Puedes cancelar hasta 24 horas antes sin cargo</li>
                </ul>
              </div>
            </div>

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
                className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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

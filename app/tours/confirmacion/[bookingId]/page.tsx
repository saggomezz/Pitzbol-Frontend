"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiMessageSquare,
} from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface BookingData {
  id: string;
  guideId: string;
  guideName: string;
  touristId: string;
  touristName: string;
  fecha: string;
  duracion: "medio" | "completo";
  horaInicio: string;
  numPersonas: number;
  notas?: string;
  total: number;
  status: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();

        if (data.success) {
          setBooking(data.booking);
        }
      } catch (error) {
        console.error("Error al cargar reserva:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Reserva no encontrada
          </h2>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header con animación de éxito */}
          <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheckCircle className="text-green-500" size={56} />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-3">¡Reserva Confirmada!</h1>
            <p className="text-lg text-white/90">
              Tu tour ha sido reservado exitosamente
            </p>
          </div>

          {/* Detalles de la reserva */}
          <div className="p-8">
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Detalles de tu Reserva
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-[#1A4D2E]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tu Guía</p>
                    <p className="text-lg font-bold text-gray-800">{booking.guideName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="text-[#1A4D2E]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha</p>
                    <p className="text-lg font-bold text-gray-800">
                      {new Date(booking.fecha).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center flex-shrink-0">
                    <FiClock className="text-[#1A4D2E]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Horario</p>
                    <p className="text-lg font-bold text-gray-800">
                      {booking.horaInicio} -{" "}
                      {booking.duracion === "medio" ? "Medio Día (4 horas)" : "Día Completo (8 horas)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-[#1A4D2E]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Personas</p>
                    <p className="text-lg font-bold text-gray-800">{booking.numPersonas}</p>
                  </div>
                </div>

                {booking.notas && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center flex-shrink-0">
                      <FiMessageSquare className="text-[#1A4D2E]" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Notas</p>
                      <p className="text-gray-700">{booking.notas}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total pagado */}
            <div className="bg-gradient-to-br from-[#F6F0E6] to-white p-6 rounded-2xl border-2 border-[#1A4D2E] mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Total Pagado</span>
                <span className="text-3xl font-bold text-[#1A4D2E]">
                  ${booking.total.toLocaleString("es-MX")} MXN
                </span>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-2">¿Qué sigue?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <span>El guía ha recibido tu solicitud y la confirmará pronto</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <span>Recibirás una notificación cuando el guía confirme</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <span>Puedes contactar al guía en cualquier momento por chat</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <span>Puedes cancelar hasta 24 horas antes sin cargo</span>
                </li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/perfil")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-bold transition-all duration-300"
              >
                Ver Mis Reservas
              </button>
              <button
                onClick={() => router.push("/tours")}
                className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explorar Más Tours
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

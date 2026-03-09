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
  FiDollarSign,
  FiLoader,
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
        const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`);
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

  const isPending = booking.status === "pendiente";
  const isConfirmed = booking.status === "confirmado";
  const isPaid = booking.status === "pagado";
  const isCompleted = booking.status === "completado";
  const isCanceled = booking.status === "cancelado";

  const getHeaderContent = () => {
    if (isPending) {
      return {
        icon: <FiClock className="text-yellow-500" size={56} />,
        title: "Solicitud Enviada",
        subtitle: "Tu solicitud fue enviada al guía. Espera su confirmación.",
        bgClass: "bg-gradient-to-r from-[#1A4D2E] to-[#0D601E]",
      };
    }
    if (isConfirmed) {
      return {
        icon: <FiCheckCircle className="text-blue-500" size={56} />,
        title: "¡Reserva Confirmada!",
        subtitle: "El guía aceptó tu solicitud. Procede al pago para asegurar tu lugar.",
        bgClass: "bg-gradient-to-r from-blue-600 to-blue-800",
      };
    }
    if (isPaid || isCompleted) {
      return {
        icon: <FiCheckCircle className="text-green-500" size={56} />,
        title: isPaid ? "¡Pago Exitoso!" : "¡Tour Completado!",
        subtitle: isPaid
          ? "Tu reserva está pagada y confirmada."
          : "Esperamos que hayas disfrutado tu experiencia.",
        bgClass: "bg-gradient-to-r from-[#1A4D2E] to-[#0D601E]",
      };
    }
    return {
      icon: <FiCheckCircle className="text-red-400" size={56} />,
      title: "Reserva Cancelada",
      subtitle: "Esta reserva fue cancelada.",
      bgClass: "bg-gradient-to-r from-gray-600 to-gray-800",
    };
  };

  const header = getHeaderContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header dinámico según estado */}
          <div className={`${header.bgClass} p-8 text-white text-center`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              {header.icon}
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-3">{header.title}</h1>
            <p className="text-lg text-white/90">
              {header.subtitle}
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

            {/* Total */}
            <div className="bg-gradient-to-br from-[#F6F0E6] to-white p-6 rounded-2xl border-2 border-[#1A4D2E] mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">
                  {isPaid || isCompleted ? "Total Pagado" : "Total Estimado"}
                </span>
                <span className="text-3xl font-bold text-[#1A4D2E]">
                  ${booking.total.toLocaleString("es-MX")} MXN
                </span>
              </div>
            </div>

            {/* Información según estado */}
            {isPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-yellow-900 mb-2">Tu solicitud está en espera</h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <FiClock className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>El guía revisará tu solicitud y la confirmará pronto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiClock className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>Recibirás una notificación cuando el guía responda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiClock className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>Una vez confirmada, podrás proceder al pago</span>
                  </li>
                </ul>
              </div>
            )}

            {isConfirmed && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">¡El guía aceptó tu solicitud!</h3>
                <p className="text-sm text-blue-800">
                  Procede al pago para asegurar tu lugar. Tu reserva se mantendrá confirmada
                  hasta que completes el pago.
                </p>
              </div>
            )}

            {(isPaid || isCompleted) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-green-900 mb-2">¿Qué sigue?</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>Tu reserva está confirmada y pagada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>Puedes contactar al guía en cualquier momento por chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                    <span>Puedes cancelar hasta 24 horas antes sin cargo</span>
                  </li>
                </ul>
              </div>
            )}

            {isCanceled && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-red-900 mb-2">Reserva cancelada</h3>
                <p className="text-sm text-red-800">
                  Esta reserva fue cancelada. Puedes buscar otro guía disponible.
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isConfirmed && (
                <button
                  onClick={() => router.push(`/tours/pago/${bookingId}`)}
                  className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FiDollarSign size={20} />
                  Proceder al Pago
                </button>
              )}
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

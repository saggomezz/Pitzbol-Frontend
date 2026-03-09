"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiCreditCard,
  FiCalendar,
  FiClock,
  FiUser,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { loadStripe } from "@stripe/stripe-js";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

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

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export default function TourPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const user = usePitzbolUser();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check localStorage directly to avoid race condition with usePitzbolUser hook
    const storedUser = localStorage.getItem("pitzbol_user");
    if (!storedUser) {
      alert("Debes iniciar sesión");
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener datos de la reserva
        const bookingResponse = await fetch(
          `${BACKEND_URL}/api/bookings/${bookingId}`
        );
        const bookingData = await bookingResponse.json();

        if (!bookingData.success) {
          throw new Error("No se pudo cargar la reserva");
        }

        setBooking(bookingData.booking);

        // Obtener tarjetas guardadas del usuario
        // Aquí deberías hacer una llamada al endpoint que devuelve las tarjetas guardadas
        // Por ahora, simulamos que hay tarjetas guardadas
        const cardsResponse = await fetch(
          `${BACKEND_URL}/api/payments/cards/${parsedUser.uid}`
        );
        
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          if (cardsData.success && cardsData.cards.length > 0) {
            setSavedCards(cardsData.cards);
            setSelectedCard(cardsData.cards[0].id);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar información de pago");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchData();
    }
  }, [bookingId, router]);

  const handlePayment = async () => {
    if (!selectedCard || !booking) {
      setError("Por favor selecciona una tarjeta");
      return;
    }

    const token = localStorage.getItem("pitzbol_token");
    if (!token) {
      setError("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Crear payment intent
      const paymentResponse = await fetch(
        `${BACKEND_URL}/api/payments/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: booking.total * 100, // Convertir a centavos
            currency: "mxn",
            customerId: user?.uid,
            paymentMethodId: selectedCard,
            bookingId: booking.id,
            userId: user?.uid,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Error al procesar el pago");
      }

      // Actualizar estado de la reserva
      await fetch(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "pagado",
          paymentId: paymentData.paymentIntentId,
        }),
      });

      setSuccess(true);

      // Redirigir a página de confirmación después de 2 segundos
      setTimeout(() => {
        router.push(`/tours/confirmacion/${bookingId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error al procesar pago:", error);
      setError(error.message || "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Pago Exitoso!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu reserva ha sido confirmada. El guía recibirá la notificación.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1A4D2E] border-t-transparent mx-auto"></div>
        </motion.div>
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
          <h1 className="text-3xl font-bold text-[#1A4D2E] mb-8">
            Confirmar Pago
          </h1>

          {/* Resumen de la reserva */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Resumen de Reserva
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center gap-2">
                  <FiUser size={18} />
                  <span>Guía:</span>
                </div>
                <span className="font-semibold">{booking.guideName}</span>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center gap-2">
                  <FiCalendar size={18} />
                  <span>Fecha:</span>
                </div>
                <span className="font-semibold">
                  {new Date(booking.fecha).toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center gap-2">
                  <FiClock size={18} />
                  <span>Horario:</span>
                </div>
                <span className="font-semibold">
                  {booking.horaInicio} -{" "}
                  {booking.duracion === "medio" ? "Medio Día (4h)" : "Día Completo (8h)"}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center gap-2">
                  <FiUser size={18} />
                  <span>Personas:</span>
                </div>
                <span className="font-semibold">{booking.numPersonas}</span>
              </div>

              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiDollarSign size={24} className="text-[#1A4D2E]" />
                    <span className="text-xl font-bold text-gray-800">Total:</span>
                  </div>
                  <span className="text-3xl font-bold text-[#1A4D2E]">
                    ${booking.total.toLocaleString("es-MX")} MXN
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiCreditCard size={24} />
              Método de Pago
            </h2>

            {savedCards.length > 0 ? (
              <div className="space-y-3">
                {savedCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card.id)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      selectedCard === card.id
                        ? "border-[#1A4D2E] bg-[#F6F0E6]"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FiCreditCard size={24} className="text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-800 capitalize">
                            {card.brand} •••• {card.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vence {card.exp_month}/{card.exp_year}
                          </p>
                        </div>
                      </div>
                      {selectedCard === card.id && (
                        <FiCheckCircle className="text-[#1A4D2E]" size={24} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-yellow-800 font-semibold mb-2">
                    No tienes tarjetas guardadas
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    Debes agregar una tarjeta en tu billetera antes de continuar.
                  </p>
                  <button
                    onClick={() => router.push("/perfil")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Ir a Mi Billetera
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/tours/reservar/${booking.guideId}`)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-bold transition-all duration-300"
              disabled={processing}
            >
              Atrás
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || !selectedCard || savedCards.length === 0}
              className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

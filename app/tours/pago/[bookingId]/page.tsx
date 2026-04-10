"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiCreditCard,
  FiCalendar,
  FiClock,
  FiUser,
  FiDollarSign,
  FiAlertCircle,
  FiPlus,
  FiLock,
  FiArrowLeft,
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();
const STRIPE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

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
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/* ─── Inline Add Card Form ─── */
function InlineAddCardForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setCardError(null);

    try {
      const setupRes = await fetchWithAuth(`${BACKEND_URL}/api/perfil/setup-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!setupRes.ok) {
        const errData = await setupRes.json().catch(() => null);
        throw new Error(
          errData?.error || `Error al crear setup intent (${setupRes.status})`
        );
      }

      const { clientSecret } = await setupRes.json();

      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) {
        setCardError(result.error.message || "Error al procesar tarjeta");
        return;
      }

      if (
        result.setupIntent?.status === "succeeded" &&
        result.setupIntent?.payment_method
      ) {
        const paymentMethodId =
          typeof result.setupIntent.payment_method === "string"
            ? result.setupIntent.payment_method
            : (result.setupIntent.payment_method as { id: string }).id;

        const saveRes = await fetchWithAuth(`${BACKEND_URL}/api/perfil/save-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethodId }),
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json().catch(() => null);
          throw new Error(errData?.error || "Error al guardar tarjeta");
        }

        onSuccess();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar tarjeta";
      setCardError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border-2 border-gray-200 focus-within:border-[#1A4D2E] rounded-xl p-4 transition-all">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1A4D2E",
                fontWeight: "500",
                "::placeholder": { color: "#aaa" },
              },
              invalid: { color: "#FA755A" },
            },
          }}
        />
      </div>

      {cardError && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <FiAlertCircle size={14} />
          {cardError}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FiLock size={12} />
        Protegido por Stripe · Encriptación 256 bits
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 bg-[#1A4D2E] hover:bg-[#0D601E] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiCreditCard size={16} />
          )}
          {loading ? "Guardando..." : "Guardar tarjeta"}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Payment Page ─── */
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
  const [showAddCard, setShowAddCard] = useState(false);

  const fetchCards = async () => {
    if (!user) return;
    try {
      const cardsResponse = await fetchWithAuth(
        `${BACKEND_URL}/api/perfil/wallet`
      );
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        if (cardsData.cards?.length > 0) {
          setSavedCards(cardsData.cards);
          const defaultCard = cardsData.cards.find((c: SavedCard) => c.isDefault);
          if (!selectedCard) setSelectedCard((defaultCard || cardsData.cards[0]).stripePaymentMethodId);
        }
      }
    } catch {
      /* silently fail — cards section will show empty state */
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("pitzbol_user");
    if (!stored) {
      alert("Debes iniciar sesión");
      router.push("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const bookingResponse = await fetchWithAuth(
          `${BACKEND_URL}/api/bookings/${bookingId}`
        );
        const bookingData = await bookingResponse.json();

        if (!bookingData.success) {
          throw new Error("No se pudo cargar la reserva");
        }

        setBooking(bookingData.booking);
        await fetchCards();
      } catch {
        setError("Error al cargar información de pago");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchData();
  }, [bookingId, user]);

  const handlePayment = async () => {
    if (!selectedCard || !booking) {
      setError("Por favor selecciona una tarjeta");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Crear Payment Intent (sin confirmar)
      const paymentResponse = await fetchWithAuth(
        `${BACKEND_URL}/api/payments/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            userId: user?.uid,
            amount: booking.total,
            currency: "mxn",
            paymentMethodId: selectedCard,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Error al crear el pago");
      }

      // 2. Confirmar pago con tarjeta guardada
      const confirmResponse = await fetchWithAuth(
        `${BACKEND_URL}/api/payments/confirm-with-saved-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentData.paymentIntentId,
            paymentMethodId: selectedCard,
            userId: user?.uid,
          }),
        }
      );

      const confirmData = await confirmResponse.json();

      if (!confirmData.success) {
        throw new Error(confirmData.message || "Error al confirmar el pago");
      }

      setSuccess(true);
      setTimeout(() => router.push(`/tours/confirmacion/${bookingId}`), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar el pago";
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-[#1A4D2E]" />
      </div>
    );
  }

  /* ── Booking not found ── */
  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reserva no encontrada
          </h2>
          <button
            onClick={() => router.push("/tours")}
            className="bg-[#1A4D2E] text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            Volver a Tours
          </button>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle className="text-green-600" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Pago Exitoso!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Tu reserva ha sido confirmada. El guía recibirá la notificación.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-3 border-gray-200 border-t-[#1A4D2E] mx-auto" />
        </motion.div>
      </div>
    );
  }

  /* ── Main Payment View ── */
  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push(`/tours/reservar/${booking.guideId}`)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Confirmar Pago
            </h1>
            <p className="text-sm text-gray-400">
              Reserva con {booking.guideName}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Booking Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Resumen de Reserva
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <FiUser size={15} /> Guía
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {booking.guideName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <FiCalendar size={15} /> Fecha
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {new Date(booking.fecha).toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <FiClock size={15} /> Horario
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {booking.horaInicio} ·{" "}
                {booking.duracion === "medio"
                  ? "Medio Día (4h)"
                  : "Día Completo (8h)"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <FiUser size={15} /> Personas
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {booking.numPersonas}
              </span>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold text-gray-800">
                <FiDollarSign size={18} className="text-[#1A4D2E]" /> Total
              </span>
              <span className="text-2xl font-bold text-[#1A4D2E]">
                ${booking.total.toLocaleString("es-MX")} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FiCreditCard size={16} /> Método de Pago
            </h2>
            {savedCards.length > 0 && !showAddCard && (
              <button
                onClick={() => setShowAddCard(true)}
                className="text-xs font-semibold text-[#1A4D2E] hover:text-[#0D601E] flex items-center gap-1 transition-colors"
              >
                <FiPlus size={14} /> Agregar tarjeta
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showAddCard ? (
              <motion.div
                key="add"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <InlineAddCardForm
                      onSuccess={() => {
                        setShowAddCard(false);
                        fetchCards();
                      }}
                      onCancel={() => setShowAddCard(false)}
                    />
                  </Elements>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Falta configurar la clave pública de Stripe
                    (NEXT_PUBLIC_STRIPE_PUBLIC_KEY o NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
                  </div>
                )}
              </motion.div>
            ) : savedCards.length > 0 ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {savedCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card.stripePaymentMethodId)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      selectedCard === card.stripePaymentMethodId
                        ? "border-[#1A4D2E] bg-green-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedCard === card.stripePaymentMethodId
                              ? "bg-[#1A4D2E] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <FiCreditCard size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800 capitalize">
                            {card.brand} •••• {card.last4}
                          </p>
                          <p className="text-xs text-gray-400">
                            Vence {String(card.expMonth).padStart(2, "0")}/
                            {card.expYear}
                          </p>
                        </div>
                      </div>
                      {selectedCard === card.stripePaymentMethodId && (
                        <FiCheckCircle className="text-[#1A4D2E]" size={20} />
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <FiAlertCircle
                    className="text-yellow-600 mt-0.5 shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-yellow-800 font-semibold text-sm mb-1">
                      No tienes tarjetas guardadas
                    </p>
                    <p className="text-xs text-yellow-700">
                      Agrega una tarjeta para completar tu pago.
                    </p>
                  </div>
                </div>

                <Elements stripe={stripePromise}>
                  <InlineAddCardForm
                    onSuccess={() => {
                      setShowAddCard(false);
                      fetchCards();
                    }}
                    onCancel={() => router.push("/perfil")}
                  />
                </Elements>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <FiAlertCircle
              className="text-red-600 mt-0.5 shrink-0"
              size={18}
            />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/tours/reservar/${booking.guideId}`)}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-4 px-6 rounded-xl font-semibold text-sm transition-all"
            disabled={processing}
          >
            Atrás
          </button>
          <button
            onClick={handlePayment}
            disabled={processing || !selectedCard || savedCards.length === 0}
            className="flex-1 bg-[#1A4D2E] hover:bg-[#0D601E] text-white py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                Pagar ${booking.total.toLocaleString("es-MX")} MXN
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

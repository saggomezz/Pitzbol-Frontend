"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  FiX, FiCreditCard, FiLock, FiCheckCircle, FiChevronLeft, FiPlus, FiTrash2, FiStar
} from "react-icons/fi";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const STRIPE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

interface Card {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const WalletModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0); // 0: ver tarjetas, 1: agregar tarjeta
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsFinishing(false);
      loadCards();
    }
  }, [isOpen]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      const token = localStorage.getItem("pitzbol_token");

      console.log('📋 [WalletModal] Cargando tarjetas...');
      console.log(`   - UID local: ${userLocal.uid}`);
      console.log(`   - Token disponible: ${!!token}`);
      console.log(`   - Backend URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);

      if (!token) {
        console.warn('⚠️ [WalletModal] Sin token - usuario no autenticado');
        setCards([]);
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/perfil/wallet`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`   - Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [WalletModal] Tarjetas cargadas: ${data.cards?.length || 0}`);
        setCards(data.cards || []);
      } else {
        try {
          const errorData = await response.json();
          console.error('❌ [WalletModal] Error al cargar tarjetas:', response.status, errorData);
        } catch (parseError) {
          console.error('❌ [WalletModal] Error al cargar tarjetas (response no es JSON):', response.status, response.statusText);
        }
        setCards([]);
      }
    } catch (error) {
      console.error("❌ [WalletModal] Error cargando tarjetas:", error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarjeta?")) return;

    try {
      const token = localStorage.getItem("pitzbol_token");
      
      if (!token) {
        showMessage("❌ No estás autenticado", "error");
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/perfil/card/${cardId}`,
        {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        showMessage("✅ Tarjeta eliminada exitosamente", "success");
        loadCards();
      } else {
        try {
          const errorData = await response.json();
          showMessage(errorData.error || "❌ Error al eliminar tarjeta", "error");
        } catch {
          showMessage("❌ Error al eliminar tarjeta", "error");
        }
      }
    } catch (error) {
      showMessage("❌ Error de conexión", "error");
    }
  };

  const setAsDefault = async (cardId: string) => {
    try {
      const token = localStorage.getItem("pitzbol_token");
      
      if (!token) {
        showMessage("❌ No estás autenticado", "error");
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/perfil/card/${cardId}/default`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        showMessage("✅ Tarjeta establecida como predeterminada", "success");
        loadCards();
      } else {
        try {
          const errorData = await response.json();
          showMessage(errorData.error || "❌ Error al actualizar tarjeta", "error");
        } catch {
          showMessage("❌ Error al actualizar tarjeta", "error");
        }
      }
    } catch (error) {
      showMessage("❌ Error de conexión", "error");
    }
  };

  const handleBack = () => {
    setStep(0);
    loadCards();
    setMessage("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header Mejorado */}
          <div className="sticky top-0 bg-gradient-to-r from-[#0D601E] via-[#1A4D2E] to-[#0D601E] text-white p-8 rounded-t-[40px] z-10">
            <div className="flex items-center justify-between mb-4">
              {step === 1 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <FiChevronLeft size={24} />
                </motion.button>
              )}
              <div className="flex-1">
                <motion.h2 
                  key={step}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black" 
                  style={{ fontFamily: "'Jockey One', sans-serif" }}
                >
                  {step === 0 ? "MI BILLETERA" : "NUEVA TARJETA"}
                </motion.h2>
                <p className="text-white/70 text-sm font-semibold mt-1">
                  {step === 0 ? "Gestiona tus métodos de pago" : "Agrega tu tarjeta de forma segura"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
              >
                <FiX size={24} />
              </motion.button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">
            {/* Mensajes mejorados */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${
                    messageType === "success"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className={`text-2xl ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
                    {messageType === "success" ? "✅" : "❌"}
                  </div>
                  <p className={`text-sm font-semibold flex-1 ${
                    messageType === "success" ? "text-green-800" : "text-red-800"
                  }`}>
                    {message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 0: Ver Tarjetas */}
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {loading ? (
                  <div className="flex justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full"
                    />
                  </div>
                ) : cards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 bg-gradient-to-br from-[#F6F0E6] to-white rounded-3xl border-2 border-dashed border-[#0D601E]/20"
                  >
                    <div className="w-20 h-20 bg-[#0D601E]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiCreditCard size={40} className="text-[#0D601E]" />
                    </div>
                    <p className="text-[#1A4D2E] font-black text-lg mb-2">Sin tarjetas registradas</p>
                    <p className="text-[#769C7B] text-sm">
                      Agrega tu primera tarjeta para comenzar a pagar
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {cards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-6 rounded-3xl border-2 transition-all backdrop-blur-sm ${
                          card.isDefault
                            ? "bg-gradient-to-br from-[#0D601E]/15 to-[#1A4D2E]/10 border-[#0D601E] shadow-lg shadow-[#0D601E]/20"
                            : "bg-white border-gray-200 hover:border-[#0D601E] hover:shadow-lg"
                        }`}
                      >
                        {/* Tarjeta visual */}
                        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-2">Número de tarjeta</p>
                            <p className="text-xl font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                          </div>
                          <div className="text-3xl capitalize font-black text-gray-400">
                            {card.brand === 'visa' ? '💳' : card.brand === 'mastercard' ? '🏧' : '💰'}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-black text-[#1A4D2E] capitalize text-sm">
                                {card.brand}
                              </span>
                              {card.isDefault && (
                                <motion.span
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="text-xs bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white px-3 py-1 rounded-full font-bold flex items-center gap-1"
                                >
                                  <FiStar size={12} fill="currentColor" />
                                  Predeterminada
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs text-[#769C7B] font-semibold">
                              Vence: {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                            </p>
                            {!card.isDefault && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAsDefault(card.id)}
                                className="mt-3 text-xs font-bold text-[#0D601E] hover:text-[#1A4D2E] flex items-center gap-1 transition-colors"
                              >
                                <FiStar size={14} />
                                Usar como predeterminada
                              </motion.button>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteCard(card.id)}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <FiTrash2 size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Botón agregar tarjeta mejorado */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="w-full py-4 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#094d18] hover:to-[#153623] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <FiPlus size={18} />
                  </motion.div>
                  Agregar nueva tarjeta
                </motion.button>
              </motion.div>
            )}

            {/* Step 1: Agregar Tarjeta */}
            {step === 1 && (
              stripePromise ? (
                <Elements stripe={stripePromise}>
                  <AddCardForm onSuccess={() => {
                    showMessage("✅ Tarjeta agregada exitosamente", "success");
                    setTimeout(() => handleBack(), 1500);
                  }} />
                </Elements>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Falta configurar la clave pública de Stripe
                  (NEXT_PUBLIC_STRIPE_PUBLIC_KEY o NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente para el formulario de agregar tarjeta
const AddCardForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    try {
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      const token = localStorage.getItem("pitzbol_token");

      console.log('🔐 [AddCardForm] Iniciando proceso de guardar tarjeta');
      console.log(`   - UID local: ${userLocal.uid}`);
      console.log(`   - Token disponible: ${!!token}`);
      console.log(`   - Token (primeros 30 chars): ${token ? token.substring(0, 30) + '...' : 'NO DISPONIBLE'}`);

      if (!token) {
        setMessage("❌ No estás autenticado. Por favor, inicia sesión nuevamente.");
        setMessageType("error");
        console.error('❌ [AddCardForm] Token no disponible en localStorage');
        return;
      }

      if (!userLocal.uid) {
        setMessage("❌ No se encontró información del usuario. Por favor, inicia sesión nuevamente.");
        setMessageType("error");
        console.error('❌ [AddCardForm] UID no disponible en localStorage');
        return;
      }

      // Crear setup intent para guardar la tarjeta
      console.log('📋 [AddCardForm] Crear setup intent...');
      const setupRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/perfil/setup-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid: userLocal.uid }),
        }
      );

      console.log(`   - Setup intent response status: ${setupRes.status}`);

      if (!setupRes.ok) {
        try {
          const errorData = await setupRes.json();
          console.error('❌ [AddCardForm] Error en setup intent:', errorData);
          throw new Error(errorData.error || "Error al crear setup intent");
        } catch (parseError) {
          console.error('❌ [AddCardForm] Error en setup intent (response no JSON):', setupRes.status);
          throw new Error(`Error al crear setup intent (${setupRes.status})`);
        }
      }

      const { clientSecret } = await setupRes.json();
      console.log(`✅ [AddCardForm] Setup intent creado: ${clientSecret ? 'OK' : 'FALLO'}`);

      // Confirmar setup con Stripe
      console.log('💳 [AddCardForm] Confirmar tarjeta con Stripe...');
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      console.log(`   - Setup status: ${result.setupIntent?.status}`);
      console.log(`   - Error: ${result.error?.message || 'NINGUNO'}`);

      if (result.error) {
        const errorMessage = result.error?.message || "Error al procesar tarjeta";
        setMessage(errorMessage);
        setMessageType("error");
        console.error('❌ [AddCardForm] Error en confirmación de Stripe:', errorMessage);
      } else if (result.setupIntent?.status === "succeeded" && result.setupIntent?.payment_method) {
        console.log(`✅ [AddCardForm] Tarjeta confirmada con éxito en Stripe`);
        
        // Guardar la tarjeta en la base de datos
        const paymentMethodId = typeof result.setupIntent.payment_method === 'string' 
          ? result.setupIntent.payment_method 
          : (result.setupIntent.payment_method as any).id;

        console.log(`💾 [AddCardForm] Guardar tarjeta en base de datos...`);
        console.log(`   - Payment Method ID: ${paymentMethodId}`);
        console.log(`   - Token (primeros 30 chars): ${token.substring(0, 30) + '...'}`);

        const saveCardRes = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/perfil/save-card`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              paymentMethodId,
              uid: userLocal.uid
            }),
          }
        );

        console.log(`   - Save card response status: ${saveCardRes.status}`);

        if (saveCardRes.ok) {
          const cardData = await saveCardRes.json();
          console.log(`✅ [AddCardForm] Tarjeta guardada exitosamente:`, cardData);
          
          setMessage("✅ Tarjeta guardada exitosamente");
          setMessageType("success");
          onSuccess();
        } else {
          try {
            const errorData = await saveCardRes.json();
            console.error('❌ [AddCardForm] Error al guardar tarjeta en BD:', errorData);
            setMessage(errorData.error || "Error al guardar tarjeta en base de datos");
          } catch (parseError) {
            console.error('❌ [AddCardForm] Error al guardar tarjeta (response no JSON):', saveCardRes.status);
            setMessage(`Error al guardar tarjeta (${saveCardRes.status})`);
          }
          setMessageType("error");
        }
      }
    } catch (error: any) {
      console.error('❌ [AddCardForm] Error general:', error);
      setMessage(error.message || "Error al procesar tarjeta");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Mensaje mejorado */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${
            messageType === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className={`text-2xl ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
            {messageType === "success" ? "✅" : "❌"}
          </div>
          <p className={`text-sm font-semibold ${
            messageType === "success" ? "text-green-800" : "text-red-800"
          }`}>
            {message}
          </p>
        </motion.div>
      )}

      {/* Elemento de tarjeta mejorado */}
      <div>
        <label className="text-xs font-black uppercase text-[#1A4D2E] tracking-wider mb-3 block">
          Información de la tarjeta
        </label>
        <motion.div 
          whileFocus={{ scale: 1.02 }}
          className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 focus-within:border-[#0D601E] focus-within:from-[#F6F0E6] focus-within:to-white rounded-2xl p-5 transition-all shadow-sm focus-within:shadow-lg"
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1A4D2E",
                  fontWeight: "600",
                  "::placeholder": { color: "#B2C7B5" },
                  fontFamily: "system-ui",
                },
                invalid: {
                  color: "#FA755A",
                },
              },
            }}
          />
        </motion.div>
      </div>

      {/* Info de seguridad mejorada */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
      >
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <FiLock size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-900">Pago seguro garantizado</p>
          <p className="text-xs text-blue-700">Protegido por Stripe con encriptación de 256 bits</p>
        </div>
      </motion.div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-4 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#094d18] hover:to-[#153623] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Procesando...
            </>
          ) : (
            <>
              <FiLock size={18} />
              Guardar tarjeta de forma segura
            </>
          )}
        </motion.button>
      </div>

      {/* Texto de confianza */}
      <p className="text-center text-xs text-[#769C7B] font-semibold">
        Tu información de tarjeta nunca se guarda en nuestros servidores
      </p>
    </motion.form>
  );
};

export default WalletModal;

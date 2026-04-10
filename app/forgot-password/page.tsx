"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowRight, FiMail, FiRefreshCw, FiUnlock } from "react-icons/fi";
import axios from "axios";
import { getBackendOrigin } from "@/lib/backendUrl";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Segundos para reenvío

  // Lógica del contador para el reenvío
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSend = async (isResend = false) => {
    // 1. Bloqueo por seguridad (cooldown)
    if (cooldown > 0 && isResend) return;
    
    setIsError(false);
    setMessage(""); // Limpiamos mensajes previos

    // 2. Validación básica de email
    if (!email || !email.includes("@")) {
      setMessage("Introduce un correo electrónico válido");
      setIsError(true);
      return;
    }

    try {
      // 3. LLAMADA AL BACKEND
      // Nota: Asegúrate de que el puerto 3001 sea el de tu servidor Express
      const API_BASE = getBackendOrigin();
      const response = await axios.post(
        `${API_BASE}/api/auth/recover-password`,
        { email },
        { withCredentials: true }
      );

      // 4. Manejo de respuesta exitosa
      // El backend ahora genera el link y Nodemailer envía el correo
      if (response.status === 200) {
        setMessage(isResend 
          ? "¡Enviado de nuevo! Revisa tu bandeja de entrada." 
          : "¡Listo! Te enviamos un correo con las instrucciones."
        );
        setIsError(false);
        setCooldown(60); // Activamos el contador de 60 segundos
      }
    } catch (error: any) {
      // 5. Manejo de errores detallado
      console.error("❌ Error en la conexión con Pitzbol Auth:", error);
      
      setIsError(true);
      
      if (error.response) {
        // El servidor respondió con un error (400, 404, 500)
        setMessage(error.response.data.msg || "Error en el servidor de correos.");
      } else if (error.request) {
        // La petición se hizo pero el backend no respondió (servidor apagado)
        setMessage("No se pudo conectar con el servidor. ¿Está encendido el backend?");
      } else {
        setMessage("Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <main className="flex-1 flex flex-col bottom-9 relative items-center justify-center p-4 sm:p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-16 rounded-[40px] md:rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full z-10"
        >
          <div className="bg-[#F6F0E6] w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUnlock className="text-[#1A4D2E] text-[30px] md:text-[40px]" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Recuperar Contraseña
          </h2>
          
          <p className="text-[#769C7B] text-xs md:text-sm leading-relaxed mb-8 md:mb-10 font-medium px-2">
            Ingresa tu correo electrónico para enviarte un enlace de recuperación y volver a disfrutar de <span className="text-[#F00808] font-bold">PITZBOL</span>.
          </p>

          <div className="space-y-4">
            <div className="relative mb-2">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]">
                <FiMail size={18} />
              </span>
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full pl-14 pr-6 py-3.5 md:py-4 bg-[#FDFCF9] border border-[#F6F0E6] rounded-full outline-none text-[#1A4D2E] font-medium transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 text-[14px] placeholder:text-[#769C7B]/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              onClick={() => handleSend(false)}
              className="w-full bg-[#0D601E] text-white py-3.5 md:py-4 rounded-full font-bold tracking-[0.1em] text-[13px] md:text-[14px] shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Enviar enlace <FiArrowRight size={16} />
            </button>

            {/* BOTÓN DE REENVIAR (Aparece después del primer intento) */}
            {message && !isError && (
              <button 
                onClick={() => handleSend(true)}
                disabled={cooldown > 0}
                className={`flex items-center justify-center gap-2 mx-auto text-[11px] font-bold uppercase tracking-widest transition-colors ${cooldown > 0 ? "text-gray-300 cursor-not-allowed" : "text-[#769C7B] hover:text-[#F00808]"}`}
              >
                <FiRefreshCw className={cooldown > 0 ? "" : "animate-spin-slow"} />
                {cooldown > 0 ? `Reenviar en ${cooldown}s` : "No recibí nada, reenviar código"}
              </button>
            )}

            {message && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-[11px] md:text-[12px] font-bold tracking-tight mt-2 px-4 ${isError ? "text-[#F00808]" : "text-[#0D601E]"}`}
              >
                {message}
              </motion.p>
            )}

            <Link href="/" className="block py-4 text-[#769C7B] font-bold text-[12px] md:text-[14px] hover:text-[#1A4D2E] transition-colors tracking-wide">
              Volver a la página principal
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
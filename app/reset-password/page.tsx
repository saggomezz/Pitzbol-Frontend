"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordReset, getAuth } from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";
import { FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { motion } from "framer-motion";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, msg: string }>({ type: null, msg: "" });
  
  const oobCode = searchParams.get("oobCode");

  const handleReset = async () => {
    if (!oobCode) {
      setStatus({ type: 'error', msg: "El código de recuperación es inválido o ha expirado." });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', msg: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: "Las contraseñas no coinciden. Por favor verifica." });
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus({ type: 'success', msg: "¡Contraseña actualizada! Redirigiendo..." });
      setTimeout(() => router.push("/"), 3000);
    } catch (error) {
      setStatus({ type: 'error', msg: "Error al actualizar. Intenta solicitar un nuevo enlace." });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-[#F6F0E6] text-center"
      >
        <h2 className="text-3xl font-black text-[#1A4D2E] uppercase mb-6" style={{ fontFamily: "'Jockey One', sans-serif" }}>
          Nueva <span className="text-[#F00808]">Contraseña</span>
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Escribe tu nueva clave"
              className="w-full pl-12 pr-12 py-3.5 bg-[#FDFCF9] border border-[#F6F0E6] rounded-full outline-none text-[#1A4D2E] focus:border-[#0D601E]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#769C7B] hover:text-[#0D601E] transition-colors"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="relative">
            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirma tu nueva clave"
              className="w-full pl-12 pr-12 py-3.5 bg-[#FDFCF9] border border-[#F6F0E6] rounded-full outline-none text-[#1A4D2E] focus:border-[#0D601E]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#769C7B] hover:text-[#0D601E] transition-colors"
            >
              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"
          >
            Actualizar contraseña
          </button>

          {status.type && (
            <div className={`flex items-center justify-center gap-2 text-[11px] font-bold uppercase mt-4 ${status.type === 'error' ? "text-[#F00808]" : "text-[#0D601E]"}`}>
              {status.type === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
              {status.msg}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
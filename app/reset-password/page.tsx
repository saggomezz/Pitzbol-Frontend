"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";


export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
import { motion } from "framer-motion";



function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, msg: string }>({ type: null, msg: "" });

  const oobCode = searchParams.get("oobCode");

  const isStrongPassword = (value: string) =>
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  const getPasswordCriteria = (value: string) => [
    { label: "10+ caracteres", met: value.length >= 10 },
    { label: "Mayúscula (A-Z)", met: /[A-Z]/.test(value) },
    { label: "Minúscula (a-z)", met: /[a-z]/.test(value) },
    { label: "Número (0-9)", met: /[0-9]/.test(value) },
    { label: "Símbolo (!@#$...)", met: /[^A-Za-z0-9]/.test(value) },
  ];

  const handleReset = async () => {
    if (!oobCode) {
      setStatus({ type: 'error', msg: "El código de recuperación es inválido o ha expirado." });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setStatus({ type: 'error', msg: "Usa una contraseña fuerte: 10+ caracteres, mayúscula, minúscula, número y símbolo." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: "Las contraseñas no coinciden. Por favor verifica." });
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA9gGWAse4hO2Kq3mbkUY-pN7EoiJLSatw";
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oobCode, newPassword }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const code: string = (err as any)?.error?.message || "UNKNOWN";
        console.error("Firebase resetPassword error:", code, err);
        if (code.includes("EXPIRED_OOB_CODE")) {
          setStatus({ type: 'error', msg: "El enlace expiró. Solicita uno nuevo desde ¿Olvidaste tu contraseña?" });
        } else if (code.includes("INVALID_OOB_CODE")) {
          setStatus({ type: 'error', msg: "El enlace ya fue usado o es inválido. Solicita uno nuevo." });
        } else if (code.includes("WEAK_PASSWORD")) {
          setStatus({ type: 'error', msg: "La contraseña es muy débil. Usa una contraseña fuerte con 10+ caracteres, mayúscula, minúscula, número y símbolo." });
        } else {
          setStatus({ type: 'error', msg: `Error (${code}). Solicita un nuevo enlace.` });
        }
        return;
      }

      // Contraseña actualizada correctamente en Firebase
      localStorage.removeItem("pitzbol_user");
      localStorage.removeItem("pitzbol_token");
      setStatus({ type: 'success', msg: "¡Contraseña actualizada! Redirigiendo al inicio de sesión..." });
      setTimeout(() => router.push("/"), 3000);
    } catch {
      setStatus({ type: 'error', msg: "Error de conexión. Inténtalo de nuevo." });
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
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#769C7B] hover:text-[#0D601E] transition-colors"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          {/* Indicador de fortaleza en tiempo real */}
          {newPassword.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-2 py-3 bg-[#F7F9F4] rounded-2xl border border-[#E0EDE0]">
              {getPasswordCriteria(newPassword).map(({ label, met }) => (
                <div key={label} className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${met ? 'text-[#0D601E]' : 'text-gray-400'}`}>
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${met ? 'bg-[#0D601E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {met ? '✓' : '·'}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[#769C7B] font-medium px-2 leading-relaxed">
              La nueva contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.
            </p>
          )}

          <div className="relative">
            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirma tu nueva clave"
              className="w-full pl-12 pr-12 py-3.5 bg-[#FDFCF9] border border-[#F6F0E6] rounded-full outline-none text-[#1A4D2E] focus:border-[#0D601E]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
            disabled={!isStrongPassword(newPassword) || newPassword !== confirmPassword}
            className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
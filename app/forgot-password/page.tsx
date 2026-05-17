"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiArrowLeft, FiCheck, FiRefreshCw } from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";

const API_BASE = getBackendOrigin();

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Introduce un correo electrónico válido.");
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      // Siempre mostramos éxito para no revelar si el email existe
      setSent(true);
      startCooldown();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      startCooldown();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-16 rounded-[40px] md:rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full z-10"
        >
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheck size={36} className="text-[#1A4D2E]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                  ¡Revisa tu correo!
                </h2>
                <p className="text-[#769C7B] text-sm leading-relaxed mb-8 font-medium px-2">
                  Si <strong>{email}</strong> tiene una cuenta en{" "}
                  <span className="text-[#F00808] font-bold">PITZBOL</span>, recibirás un enlace de recuperación en los próximos minutos.
                </p>
                <p className="text-xs text-gray-400 mb-6">¿No ves el correo? Revisa tu carpeta de spam.</p>

                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="flex items-center justify-center gap-2 mx-auto text-[11px] font-bold uppercase tracking-widest transition-colors mb-6 disabled:text-gray-300 enabled:text-[#769C7B] enabled:hover:text-[#F00808]"
                >
                  <FiRefreshCw size={12} />
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : "No recibí nada, reenviar"}
                </button>

                <Link href="/" className="block py-2 text-[#769C7B] font-bold text-sm hover:text-[#1A4D2E] transition-colors">
                  Volver a la página principal
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#F6F0E6] w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiMail className="text-[#1A4D2E] text-[30px] md:text-[40px]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                  Recuperar Contraseña
                </h2>
                <p className="text-[#769C7B] text-xs md:text-sm leading-relaxed mb-8 md:mb-10 font-medium px-2">
                  Ingresa tu correo y te enviamos un enlace para recuperar el acceso a{" "}
                  <span className="text-[#F00808] font-bold">PITZBOL</span>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <FiMail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full pl-14 pr-6 py-3.5 md:py-4 bg-[#FDFCF9] border border-[#F6F0E6] rounded-full outline-none text-[#1A4D2E] font-medium transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 text-[14px] placeholder:text-[#769C7B]/60"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-[#F00808] text-xs font-bold px-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0D601E] text-white py-3.5 md:py-4 rounded-full font-bold tracking-[0.1em] text-[13px] md:text-[14px] shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : "Enviar enlace de recuperación"
                    }
                  </button>

                  <Link href="/" className="block py-3 text-[#769C7B] font-bold text-[12px] md:text-[14px] hover:text-[#1A4D2E] transition-colors tracking-wide">
                    Volver a la página principal
                  </Link>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

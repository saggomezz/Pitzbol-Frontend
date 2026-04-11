"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // No mostrar si el usuario ya la descartó recientemente (7 días)
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Detectar iOS (Safari no soporta beforeinstallprompt)
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isiOS) {
      setIsIOS(true);
      // Mostrar después de 3 segundos en iOS
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: capturar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar después de 3 segundos
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("pwa_install_dismissed", String(Date.now()));
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md"
        >
          <div className="rounded-2xl bg-white border border-[#1A4D2E]/15 shadow-xl p-4">
            <div className="flex items-start gap-3">
              {/* Icono de la app */}
              <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[#F6F0E6] flex items-center justify-center">
                <img
                  src="/icon-192x192.png"
                  alt="Pitzbol"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Instalar Pitzbol</p>
                {isIOS ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toca{" "}
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 inline text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </span>{" "}
                    y luego &quot;Agregar a pantalla de inicio&quot;
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Agrega un acceso directo a tu pantalla de inicio
                  </p>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Botón de instalar (solo Android/Chrome) */}
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="mt-3 w-full py-2.5 rounded-xl bg-[#1A4D2E] text-white text-sm font-semibold hover:bg-[#0D601E] active:scale-[0.98] transition-all"
              >
                Instalar app
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

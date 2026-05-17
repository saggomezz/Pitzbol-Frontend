"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/app/context/PWAInstallContext";

export default function InstallPWAPrompt() {
  const { showBanner, isIOS, deferredPrompt, install, dismiss } = usePWAInstall();
  const [neverShow, setNeverShow] = useState(false);

  const handleDismiss = () => dismiss(neverShow);

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
                onClick={install}
                className="mt-3 w-full py-2.5 rounded-xl bg-[#1A4D2E] text-white text-sm font-semibold hover:bg-[#0D601E] active:scale-[0.98] transition-all"
              >
                Instalar app
              </button>
            )}

            {/* Checkbox "No volver a mostrar" */}
            <label className="mt-3 flex items-center gap-2 cursor-pointer select-none group">
              <div
                onClick={() => setNeverShow((v) => !v)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                  neverShow
                    ? "bg-[#1A4D2E] border-[#1A4D2E]"
                    : "bg-white border-gray-300 group-hover:border-[#1A4D2E]"
                }`}
              >
                {neverShow && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={neverShow}
                onChange={(e) => setNeverShow(e.target.checked)}
                className="sr-only"
              />
              <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                No volver a mostrar
              </span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

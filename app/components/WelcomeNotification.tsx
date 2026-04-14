"use client";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useEffect, useState } from "react";

interface WelcomeNotificationProps {
  userName?: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function WelcomeNotification({
  userName = "Usuario",
  isVisible,
  onClose,
  duration = 5000,
  isNew = false,
}: WelcomeNotificationProps & { isNew?: boolean }) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="relative bg-[#FAFAF8] rounded-2xl shadow-lg border border-[#1A4D2E]/12 overflow-hidden flex items-center gap-4 px-5 py-3.5 min-w-[280px] max-w-sm">
            {/* Acento verde izquierdo */}
            <div className="absolute left-0 inset-y-0 w-1 bg-[#0D601E] rounded-l-2xl" />

            {/* Texto */}
            <div className="flex-1 pl-1">
              <p className="text-sm text-[#1A4D2E]">
                {isNew ? "¡Bienvenido!" : "¡Bienvenido de nuevo!"}{" "}
                <span className="text-[#0D601E]">{userName}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isNew ? "Tu cuenta fue creada exitosamente." : "Nos alegra verte de nuevo."}
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => { setShow(false); onClose(); }}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
            >
              <FiX size={15} />
            </button>

            {/* Barra de progreso */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D601E]/30 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

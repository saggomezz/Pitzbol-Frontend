"use client";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";
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
}: WelcomeNotificationProps) {
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
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="relative bg-gradient-to-r from-[#0D601E] to-[#0a4620] rounded-xl shadow-2xl overflow-hidden border-2 border-green-400 max-w-md">
            {/* Efecto de fondo animado */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-400 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
            </div>

            {/* Contenido */}
            <div className="relative p-6 flex items-center gap-4">
              {/* Icono de éxito */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="flex-shrink-0 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center"
              >
                <FiCheck size={24} className="text-[#0D601E] font-bold" />
              </motion.div>

              {/* Texto */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1"
              >
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-jockey)' }}>
                  ¡Bienvenido de nuevo!
                </h3>
                <p className="text-green-100 text-sm">Nos alegra verte, <span className="font-semibold">{userName}</span></p>
              </motion.div>

              {/* Botón cerrar */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  setShow(false);
                  onClose();
                }}
                className="flex-shrink-0 p-2 text-green-100 hover:text-white hover:bg-[#0a4620] rounded-lg transition-colors"
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* Barra de progreso */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-1 bg-green-400 origin-left"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

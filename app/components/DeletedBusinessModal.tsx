"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertCircle } from "react-icons/fi";

interface DeletedBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    titulo: string;
    mensaje: string;
    fecha: string;
    reason?: string;
  } | null;
  businessName?: string;
}

export default function DeletedBusinessModal({
  isOpen,
  onClose,
  notification,
  businessName,
}: DeletedBusinessModalProps) {
  if (!notification) return null;

  // Extraer el nombre del negocio del mensaje como fallback
  const businessNameMatch = notification.mensaje.match(/"([^"]+)"/);
  const fallbackBusinessName = businessNameMatch ? businessNameMatch[1] : "Sin nombre";
  const resolvedBusinessName = (businessName || fallbackBusinessName).trim() || "Sin nombre";

  // Priorizar el motivo explícito y usar el texto solo como fallback.
  const reasonMatch = notification.mensaje.match(/por el administrador\.(.+)/);
  const parsedReason = reasonMatch ? reasonMatch[1].trim() : "";
  const reason = (notification.reason || parsedReason).trim();

  // Formatear la fecha
  const formattedDate = new Date(notification.fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center">
          {/* Backdrop oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative z-[230] w-full max-w-md rounded-xl bg-white p-8 shadow-2xl"
          >
            {/* Botón de cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Cerrar"
            >
              <FiX size={20} />
            </button>

            {/* Icono de alerta */}
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <FiAlertCircle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Título */}
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              {notification.titulo}
            </h2>

            {/* Nombre del negocio */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-600">Negocio eliminado:</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{resolvedBusinessName}</p>
            </div>

            {/* Motivo de eliminación */}
            {reason && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">Motivo:</p>
                <p className="mt-2 text-base text-red-800">{reason}</p>
              </div>
            )}

            {/* Fecha de eliminación */}
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600">
                Eliminado el {formattedDate}
              </p>
            </div>

            {/* Información adicional */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                Si consideras que esto fue un error o deseas más información sobre la eliminación de tu negocio, 
                te recomendamos contactar al equipo de soporte.
              </p>
            </div>

            {/* Botón de cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

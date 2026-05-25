"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertTriangle } from "react-icons/fi";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  title = "Confirmar acción",
  description = "¿Estás seguro?",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !loading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-[#FFF4F4] p-2">
                <FiAlertTriangle className="text-[#B91C1C]" size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-[#1A4D2E]">{title}</h3>
                <p className="mt-2 text-sm text-[#475569]">{description}</p>
              </div>
              <button
                onClick={() => !loading && onClose()}
                className="text-[#6B7280] hover:text-[#111827]"
                aria-label="Cerrar"
                disabled={loading}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 rounded-full bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Procesando..." : confirmLabel}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-bold text-[#1A4D2E] hover:bg-[#F7F9F6] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

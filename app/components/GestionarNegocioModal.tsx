"use client";

import React from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";

interface GestionarNegocioModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accion: "aprobar" | "rechazar";
  loading?: boolean;
  message?: string;
  motivoRechazo?: string;
  onMotivoRechazoChange?: (value: string) => void;
}

const GestionarNegocioModal: React.FC<GestionarNegocioModalProps> = ({
  open,
  onClose,
  onConfirm,
  accion,
  loading = false,
  message,
  motivoRechazo = "",
  onMotivoRechazoChange,
}) => {
  if (!open) return null;

  const isAprobar = accion === "aprobar";
  const icon = isAprobar ? (
    <FaCheckCircle className="text-[#0D601E] text-4xl mb-3 animate-pulse" />
  ) : (
    <FaTimesCircle className="text-[#8B0000] text-4xl mb-3 animate-pulse" />
  );

  const titulo = isAprobar ? "Aprobar negocio" : "Rechazar negocio";
  const colorBg = isAprobar ? "bg-[#E9F7EE] border-t-8 border-[#0D601E]" : "bg-[#FDEAEA] border-t-8 border-[#8B0000]";
  const colorBtn = isAprobar ? "bg-[#0D601E] hover:bg-[#094d18]" : "bg-[#8B0000] hover:bg-[#6B0000]";
  const textColor = isAprobar ? "text-[#0D601E]" : "text-[#8B0000]";

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ 
        zIndex: 999999,
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
        className={`${colorBg} rounded-2xl shadow-2xl p-6 w-full max-w-sm relative`}
        style={{ zIndex: 1000000 }}
      >
        <div className="flex flex-col items-center mb-3">
          {icon}
          <h2 className={`text-2xl font-extrabold ${textColor} text-center`} style={{ fontFamily: "'Jockey One', sans-serif" }}>
            {titulo}
          </h2>
        </div>
        <p className={`mb-5 text-center text-sm font-medium leading-relaxed ${isAprobar ? "text-[#0D601E]" : "text-[#8B0000]"} opacity-75`}>
          {message ||
            (isAprobar
              ? "¿Estás seguro de que deseas aprobar este negocio?"
              : "¿Estás seguro de que deseas rechazar este negocio?")}
        </p>
        {!isAprobar && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#8B0000] mb-2">
              Motivo del rechazo (opcional)
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => onMotivoRechazoChange?.(e.target.value)}
              placeholder="Ejemplo: faltan documentos o la informacion esta incompleta"
              disabled={loading}
              className="w-full rounded-xl border border-[#F2A5A5] bg-white p-3 text-sm text-[#8B0000] placeholder:text-[#8B0000]/50 focus:outline-none focus:ring-2 focus:ring-[#F2A5A5] disabled:opacity-60"
              rows={4}
            />
          </div>
        )}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-full ${colorBtn} text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
          >
            {loading ? "Procesando..." : titulo}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GestionarNegocioModal;

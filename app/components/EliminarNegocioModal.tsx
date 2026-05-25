"use client";

import React, { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

interface EliminarNegocioModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

const EliminarNegocioModal: React.FC<EliminarNegocioModalProps> = ({ open, onClose, onConfirm }) => {
  const [motivo, setMotivo] = useState("");

  const handleConfirm = () => {
    onConfirm(motivo.trim());
    setMotivo("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border-t-8 border-red-600 animate-fadeIn">
        <div className="flex flex-col items-center mb-4">
          <FaExclamationTriangle className="text-red-600 text-5xl mb-2 animate-pulse" />
          <h2 className="text-2xl font-extrabold mb-2 text-red-700 text-center">Eliminar negocio</h2>
        </div>
        <p className="mb-2 text-gray-700 text-center">Puedes indicar la razón por la que este negocio será eliminado (opcional):</p>
        <textarea
          className="w-full border-2 border-red-200 rounded p-2 mb-2 min-h-[80px] focus:border-red-400 focus:outline-none transition"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo de eliminación (opcional)..."
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Cancelar</button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition">Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default EliminarNegocioModal;

"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAward, FiUser, FiShield } from "react-icons/fi";

interface HistorialItem {
  id: string;
  uid_usuario: string;
  nombre_usuario: string;
  accion: "aceptada" | "rechazada";
  admin_uid: string;
  admin_nombre: string;
  fecha: string;
  mensaje: string;
}

export default function AdminHistorialSolicitudesModal({ open, onClose, token }: { open: boolean; onClose: () => void; token: string }) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/historial-solicitudes`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setHistorial(data.historial);
          else setError("No se pudo cargar el historial");
        })
        .catch(() => setError("Error de conexión"))
        .finally(() => setLoading(false));
    }
  }, [open, token]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black bg-opacity-40 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto border-4 border-[#0D601E]/10 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[#0D601E] hover:text-[#F00808] text-2xl"><FiX /></button>
            <h2 className="text-3xl font-black text-[#1A4D2E] mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>Historial de Solicitudes</h2>
            <p className="text-[#769C7B] mb-6">Movimientos recientes de solicitudes de guía</p>
            {loading ? (
              <div className="text-center py-8 text-[#0D601E] font-bold">Cargando...</div>
            ) : error ? (
              <div className="text-center text-red-600 font-bold">{error}</div>
            ) : historial.length === 0 ? (
              <div className="text-center text-gray-500">No hay movimientos registrados.</div>
            ) : (
              <ul className="space-y-5">
                {historial.map(item => (
                  <li key={item.id} className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center gap-2 border-l-8 border-[#0D601E]/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiUser className="text-[#0D601E]" />
                        <span className="font-bold text-[#1A4D2E]">{item.nombre_usuario}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold uppercase ${item.accion === "aceptada" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {item.accion === "aceptada" ? "Aceptada" : "Rechazada"}
                        </span>
                      </div>
                      <div className="text-xs text-[#769C7B] mb-1">{new Date(item.fecha).toLocaleString()}</div>
                      <div className="text-sm text-[#1A4D2E]">{item.mensaje}</div>
                    </div>
                    <div className="flex flex-col items-end min-w-[120px]">
                      <span className="flex items-center gap-1 text-xs text-[#0D601E] font-bold"><FiShield /> Admin</span>
                      <span className="text-xs text-[#1A4D2E]">{item.admin_nombre}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

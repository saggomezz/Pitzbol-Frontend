import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SolicitudHistorial {
  id: string;
  nombre: string;
  accion: "aceptada" | "rechazada";
  fecha: string;
  mensaje: string;
}

const getHistorialSolicitudes = (): SolicitudHistorial[] => {
  try {
    const raw = localStorage.getItem("pitzbol_historial_solicitudes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const agregarHistorialSolicitud = (solicitud: SolicitudHistorial) => {
  const historial = getHistorialSolicitudes();
  historial.unshift(solicitud); // más reciente primero
  localStorage.setItem("pitzbol_historial_solicitudes", JSON.stringify(historial));
};

export default function HistorialSolicitudesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [historial, setHistorial] = useState<SolicitudHistorial[]>([]);

  useEffect(() => {
    if (open) {
      setHistorial(getHistorialSolicitudes());
    }
  }, [open]);

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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#1A4D2E]">Historial de Solicitudes</h2>
            {historial.length === 0 ? (
              <p className="text-gray-500">No hay acciones registradas.</p>
            ) : (
              <ul className="space-y-4">
                {historial.map((sol, idx) => (
                  <li key={sol.id + sol.fecha + idx} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0D601E]">{sol.nombre}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${sol.accion === "aceptada" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{sol.accion === "aceptada" ? "Aceptada" : "Rechazada"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{new Date(sol.fecha).toLocaleString()}</div>
                    <div className="text-sm">{sol.mensaje}</div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={onClose} className="mt-6 px-4 py-2 bg-[#0D601E] text-white rounded-lg font-bold hover:bg-[#1A4D2E]">Cerrar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

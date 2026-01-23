"use client";
import { useEffect, useState } from "react";
import { FiPhone, FiArrowLeft, FiUser, FiCalendar, FiMessageSquare, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type CallRequest = {
  id: string;
  name: string;
  phone: string;
  reason: string;
  timestamp: string;
  status?: string;
  leido?: boolean;
};

export default function AdminLlamadas() {
  const [llamadas, setLlamadas] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLlamada, setSelectedLlamada] = useState<CallRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Verificar que sea admin
    const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    if (!user.uid || user.role !== "admin") {
      window.location.href = "/";
      return;
    }
    fetchLlamadas();
  }, []);

  const fetchLlamadas = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const token = localStorage.getItem("pitzbol_token");
      
      const response = await fetch(`${API_BASE}/api/support/call-requests`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setLlamadas(data);
      }
    } catch (error) {
      console.error("Error al cargar solicitudes de llamadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLlamada) return;

    setDeleting(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const token = localStorage.getItem("pitzbol_token");

      console.log("🗑️ Eliminando solicitud:", selectedLlamada.id);

      const response = await fetch(`${API_BASE}/api/support/call-requests/${selectedLlamada.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (response.ok) {
        console.log("✅ Solicitud eliminada exitosamente");
        // Remover de la lista local
        setLlamadas(prev => prev.filter(l => l.id !== selectedLlamada.id));
        setSelectedLlamada(null);
        setShowDeleteConfirm(false);
      } else {
        console.error("❌ Error del servidor:", response.status, data);
        alert(data.msg || "Error al eliminar la solicitud");
      }
    } catch (error) {
      console.error("❌ Error al eliminar solicitud:", error);
      alert("Error de conexión al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFCF9]">
        <p className="text-gray-400 italic">Cargando solicitudes de llamadas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <header className="px-8 py-10 max-w-7xl mx-auto flex items-center gap-4">
        <button
          onClick={() => (window.location.href = "/admin")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-medium text-gray-800">Solicitudes de Llamada</h1>
          <p className="text-gray-400 text-sm">
            {llamadas.length} {llamadas.length === 1 ? "solicitud" : "solicitudes"} pendientes
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pb-20">
        {llamadas.length === 0 ? (
          <div className="bg-white rounded-[35px] border border-gray-100 p-20 text-center">
            <FiPhone className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 italic">No hay solicitudes de llamada pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {llamadas.map((call) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedLlamada(call)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FiPhone className="text-[#0D601E]" />
                      <h3 className="font-medium text-gray-800">{call.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{call.phone}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{call.reason}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {new Date(call.timestamp).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedLlamada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLlamada(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-medium text-gray-800">Solicitud de Llamada</h2>
                <button
                  onClick={() => setSelectedLlamada(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiAlertCircle size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Nombre</p>
                    <p className="font-medium text-gray-800">{selectedLlamada.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiPhone className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Teléfono</p>
                    <p className="font-medium text-gray-800 text-lg">{selectedLlamada.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiCalendar className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Fecha de solicitud</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedLlamada.timestamp).toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Motivo</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedLlamada.reason}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <a
                  href={`tel:${selectedLlamada.phone}`}
                  className="flex-1 py-4 px-6 bg-[#0D601E] text-white rounded-full hover:bg-[#0a4d18] transition-colors text-center flex items-center justify-center gap-2"
                >
                  <FiPhone />
                  Llamar ahora
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-4 px-6 border border-red-200 text-red-600 rounded-full hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>

              {/* Confirmación de eliminación */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="bg-white rounded-2xl p-6 max-w-md w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        ¿Eliminar solicitud?
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Esta acción no se puede deshacer. La solicitud de llamada de {selectedLlamada.name} será eliminada permanentemente.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                          className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleting ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

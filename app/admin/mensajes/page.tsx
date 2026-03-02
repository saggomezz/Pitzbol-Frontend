"use client";
import { useEffect, useState } from "react";
import { FiMail, FiArrowLeft, FiPhone, FiUser, FiMessageSquare, FiCalendar, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type ContactForm = {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  timestamp: string;
  status?: string;
  leido?: boolean;
};

export default function AdminMensajes() {
  const [mensajes, setMensajes] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMensaje, setSelectedMensaje] = useState<ContactForm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Verificar que sea admin
    const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    if (!user.uid || user.role !== "admin") {
      window.location.href = "/";
      return;
    }
    fetchMensajes();
  }, []);

  const fetchMensajes = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const token = localStorage.getItem("pitzbol_token");
      
      const response = await fetch(`${API_BASE}/api/support/contact-forms`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setMensajes(data);
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMensaje) return;

    setDeleting(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const token = localStorage.getItem("pitzbol_token");

      console.log("🗑️ Eliminando mensaje:", selectedMensaje.id);

      const response = await fetch(`${API_BASE}/api/support/contact-forms/${selectedMensaje.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (response.ok) {
        console.log("✅ Mensaje eliminado exitosamente");
        // Remover de la lista local
        setMensajes(prev => prev.filter(m => m.id !== selectedMensaje.id));
        setSelectedMensaje(null);
        setShowDeleteConfirm(false);
      } else {
        console.error("❌ Error del servidor:", response.status, data);
        alert(data.msg || "Error al eliminar el mensaje");
      }
    } catch (error) {
      console.error("❌ Error al eliminar mensaje:", error);
      alert("Error de conexión al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFCF9]">
        <p className="text-gray-400 italic">Cargando mensajes...</p>
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
          <h1 className="text-2xl font-medium text-gray-800">Mensajes de Contacto</h1>
          <p className="text-gray-400 text-sm">
            {mensajes.length} {mensajes.length === 1 ? "mensaje" : "mensajes"} recibidos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pb-20">
        {mensajes.length === 0 ? (
          <div className="bg-white rounded-[35px] border border-gray-100 p-20 text-center">
            <FiMail className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 italic">No hay mensajes de contacto.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mensajes.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedMensaje(msg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{msg.name}</h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                        {msg.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{msg.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{msg.message}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleDateString("es-MX", {
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
        {selectedMensaje && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMensaje(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-medium text-gray-800">Detalle del Mensaje</h2>
                <button
                  onClick={() => setSelectedMensaje(null)}
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
                    <p className="font-medium text-gray-800">{selectedMensaje.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-800">{selectedMensaje.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiPhone className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Teléfono</p>
                    <p className="font-medium text-gray-800">{selectedMensaje.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiMessageSquare className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Categoría</p>
                    <p className="font-medium text-gray-800">{selectedMensaje.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiCalendar className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Fecha</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedMensaje.timestamp).toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Asunto</p>
                  <p className="font-medium text-gray-800 mb-4">{selectedMensaje.subject}</p>
                  
                  <p className="text-xs text-gray-400 mb-2">Mensaje</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedMensaje.message}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <a
                  href={`mailto:${selectedMensaje.email}`}
                  className="flex-1 py-3 px-6 bg-[#0D601E] text-white rounded-full hover:bg-[#0a4d18] transition-colors text-center"
                >
                  Responder por Email
                </a>
                <a
                  href={`tel:${selectedMensaje.phone}`}
                  className="py-3 px-6 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <FiPhone className="inline" />
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-3 px-6 border border-red-200 text-red-600 rounded-full hover:bg-red-50 transition-colors"
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
                        ¿Eliminar mensaje?
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Esta acción no se puede deshacer. El mensaje de {selectedMensaje.name} será eliminado permanentemente.
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

"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../../lib/fetchWithAuth";
import { FiMail, FiArrowLeft, FiPhone, FiUser, FiMessageSquare, FiCalendar, FiSend, FiCheckCircle, FiClock, FiTrash2, FiX, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type Reply = {
  message: string;
  timestamp: string;
  sentBy: string;
};

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
  replies?: Reply[];
  lastReplyAt?: string;
};

type FilterStatus = "all" | "nuevo" | "respondido";

export default function AdminMensajes() {
  const [mensajes, setMensajes] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMensaje, setSelectedMensaje] = useState<ContactForm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
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
      const response = await fetchWithAuth(`${API_BASE}/api/support/contact-forms`);
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

  const handleReply = async () => {
    if (!selectedMensaje || !replyText.trim()) return;

    setSending(true);
    setSendSuccess(false);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetchWithAuth(
        `${API_BASE}/api/support/contact-forms/${selectedMensaje.id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyMessage: replyText.trim() }),
        }
      );

      if (response.ok) {
        setSendSuccess(true);
        const newReply: Reply = {
          message: replyText.trim(),
          timestamp: new Date().toISOString(),
          sentBy: "admin",
        };

        // Update local state
        const updatedMensaje = {
          ...selectedMensaje,
          status: "respondido",
          replies: [...(selectedMensaje.replies || []), newReply],
          lastReplyAt: newReply.timestamp,
        };
        setSelectedMensaje(updatedMensaje);
        setMensajes((prev) =>
          prev.map((m) => (m.id === selectedMensaje.id ? updatedMensaje : m))
        );
        setReplyText("");
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.msg || "Error al enviar respuesta");
      }
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      alert("Error de conexión al enviar respuesta");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMensaje) return;

    setDeleting(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetchWithAuth(
        `${API_BASE}/api/support/contact-forms/${selectedMensaje.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setMensajes((prev) => prev.filter((m) => m.id !== selectedMensaje.id));
        setSelectedMensaje(null);
        setShowDeleteConfirm(false);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.msg || "Error al eliminar el mensaje");
      }
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      alert("Error de conexión al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const filteredMensajes = mensajes.filter((m) => {
    if (filter === "all") return true;
    return (m.status || "nuevo") === filter;
  });

  const newCount = mensajes.filter((m) => (m.status || "nuevo") === "nuevo").length;
  const repliedCount = mensajes.filter((m) => m.status === "respondido").length;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-50 text-blue-700",
      tecnico: "bg-purple-50 text-purple-700",
      cuenta: "bg-amber-50 text-amber-700",
      negocio: "bg-emerald-50 text-emerald-700",
      sugerencia: "bg-pink-50 text-pink-700",
      otro: "bg-gray-50 text-gray-700",
    };
    return colors[category] || "bg-gray-50 text-gray-700";
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1A4D2E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = "/admin")}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Soporte - Mensajes</h1>
              <p className="text-sm text-gray-400">
                {mensajes.length} mensajes · {newCount} nuevos · {repliedCount} respondidos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {([
              { key: "all" as FilterStatus, label: "Todos", count: mensajes.length },
              { key: "nuevo" as FilterStatus, label: "Nuevos", count: newCount },
              { key: "respondido" as FilterStatus, label: "Respondidos", count: repliedCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f.key
                    ? "bg-white text-[#1A4D2E] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {filteredMensajes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center">
            <FiMail className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400">
              {filter === "all" ? "No hay mensajes de contacto" : `No hay mensajes ${filter === "nuevo" ? "nuevos" : "respondidos"}`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMensajes.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 hover:border-[#1A4D2E]/20 hover:shadow-lg transition-all p-5 cursor-pointer group"
                onClick={() => {
                  setSelectedMensaje(msg);
                  setReplyText("");
                  setSendSuccess(false);
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <FiUser className="text-gray-400" size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm">{msg.name}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${getCategoryColor(msg.category)}`}>
                        {msg.category}
                      </span>
                      {(msg.status || "nuevo") === "respondido" ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <FiCheckCircle size={10} /> Respondido
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 flex items-center gap-1">
                          <FiClock size={10} /> Nuevo
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-0.5">{msg.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{msg.message}</p>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      {new Date(msg.timestamp).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail / Reply Panel */}
      <AnimatePresence>
        {selectedMensaje && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMensaje(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Ticket de Soporte</h2>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedMensaje.timestamp).toLocaleString("es-MX")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                    title="Eliminar"
                  >
                    <FiTrash2 size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedMensaje(null)}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <FiUser className="text-gray-400 shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Nombre</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{selectedMensaje.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <FiMail className="text-gray-400 shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{selectedMensaje.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <FiPhone className="text-gray-400 shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Teléfono</p>
                      <p className="text-sm font-medium text-gray-800">{selectedMensaje.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <FiMessageSquare className="text-gray-400 shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Categoría</p>
                      <p className="text-sm font-medium text-gray-800">{selectedMensaje.category}</p>
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Asunto</p>
                  <p className="text-sm font-semibold text-gray-800 mb-3">{selectedMensaje.subject}</p>
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Mensaje</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMensaje.message}</p>
                </div>

                {/* Previous Replies */}
                {selectedMensaje.replies && selectedMensaje.replies.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 font-bold uppercase">Respuestas enviadas</p>
                    {selectedMensaje.replies.map((reply, idx) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-bold">
                            Admin
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(reply.timestamp).toLocaleString("es-MX")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Success message */}
                <AnimatePresence>
                  {sendSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2"
                    >
                      <FiCheckCircle className="text-emerald-600 shrink-0" size={18} />
                      <p className="text-sm font-semibold text-emerald-700">Respuesta enviada exitosamente por email</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply Area */}
              <div className="border-t border-gray-100 p-6 shrink-0 bg-gray-50/50">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2">
                  Responder a {selectedMensaje.name}
                </p>
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta... Se enviará por email al usuario."
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 focus:border-[#1A4D2E] resize-none bg-white"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="self-end px-5 py-3 bg-[#1A4D2E] hover:bg-[#0D601E] text-white rounded-2xl font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSend size={16} />
                    )}
                    Enviar
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`mailto:${selectedMensaje.email}`}
                    className="text-xs text-gray-400 hover:text-[#1A4D2E] flex items-center gap-1 transition-colors"
                  >
                    <FiMail size={12} /> Abrir en email
                  </a>
                  <span className="text-gray-200">·</span>
                  <a
                    href={`tel:${selectedMensaje.phone}`}
                    className="text-xs text-gray-400 hover:text-[#1A4D2E] flex items-center gap-1 transition-colors"
                  >
                    <FiPhone size={12} /> Llamar
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      ¿Eliminar mensaje?
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Esta acción no se puede deshacer. El mensaje de {selectedMensaje.name} será eliminado permanentemente.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
                      >
                        {deleting ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

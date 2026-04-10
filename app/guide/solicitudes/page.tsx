"use client";
import React, { useEffect, useState } from "react";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiFileText,
  FiRefreshCw,
  FiFilter,
  FiCreditCard,
} from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";
import WalletModal from "@/app/components/WalletModal";

const BACKEND_URL = getBackendOrigin();

interface BookingRequest {
  id: string;
  guideId: string;
  guideName: string;
  touristId: string;
  touristName: string;
  fecha: string;
  duracion: "medio" | "completo";
  horaInicio: string;
  numPersonas: number;
  notas?: string;
  total: number;
  status: string;
  createdAt: string | { _seconds: number; _nanoseconds: number };
}

type FilterStatus = "all" | "pendiente" | "confirmado" | "pagado" | "completado" | "cancelado";

const FILTER_CONFIG: Record<FilterStatus, { label: string; color: string; activeColor: string; icon?: React.ReactNode }> = {
  all: { label: "Todas", color: "bg-white text-gray-700 border-gray-300", activeColor: "bg-[#1A4D2E] text-white border-[#1A4D2E]" },
  import { getBackendOrigin } from "@/lib/backendUrl";
  pendiente: { label: "Pendientes", color: "bg-white text-yellow-700 border-yellow-200", activeColor: "bg-yellow-500 text-white border-yellow-500" },
  confirmado: { label: "Confirmados", color: "bg-white text-blue-700 border-blue-200", activeColor: "bg-blue-500 text-white border-blue-500" },
  const BACKEND_URL = getBackendOrigin();
  completado: { label: "Completados", color: "bg-white text-emerald-700 border-emerald-200", activeColor: "bg-emerald-600 text-white border-emerald-600" },
  cancelado: { label: "Cancelados", color: "bg-white text-red-700 border-red-200", activeColor: "bg-red-500 text-white border-red-500" },
};

export default function GuideSolicitudesPage() {
  const user = usePitzbolUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("pitzbol_token");
      if (!token) {
        setError("No estás autenticado. Por favor inicia sesión.");
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/bookings/guide/${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status} al cargar las solicitudes`);
      }

      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.message || "Error al cargar solicitudes");
      }
    } catch (err) {
      console.error("Error fetching guide bookings:", err);
      setError("Error de conexión. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.role !== "guia" && user.guide_status !== "aprobado") {
      router.push("/");
      return;
    }

    fetchBookings();
  }, [user, router]);

  const handleAction = async (bookingId: string, action: "confirmar" | "rechazar") => {
    if (!user) return;

    const token = localStorage.getItem("pitzbol_token");
    if (!token) {
      setError("Sesión expirada. Inicia sesión de nuevo.");
      return;
    }

    setProcessingId(bookingId);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/bookings/${bookingId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            guideId: user.uid,
            action,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: action === "confirmar" ? "confirmado" : "cancelado" }
              : b
          )
        );
      } else {
        setError(data.message || "Error al procesar la solicitud");
      }
    } catch (err) {
      console.error("Error processing booking action:", err);
      setError("Error de conexión. Intenta más tarde.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (rawDate: string | { _seconds: number; _nanoseconds: number }) => {
    try {
      let date: Date;
      if (typeof rawDate === "object" && "_seconds" in rawDate) {
        date = new Date(rawDate._seconds * 1000);
      } else {
        date = new Date(rawDate as string);
      }
      return date.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(rawDate);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      pendiente: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pendiente", icon: <FiClock size={13} /> },
      confirmado: { bg: "bg-blue-50", text: "text-blue-700", label: "Confirmado", icon: <FiCheckCircle size={13} /> },
      pagado: { bg: "bg-green-50", text: "text-green-700", label: "Pagado", icon: <FiDollarSign size={13} /> },
      completado: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completado", icon: <FiCheckCircle size={13} /> },
      cancelado: { bg: "bg-red-50", text: "text-red-700", label: "Cancelado", icon: <FiXCircle size={13} /> },
    };
    const config = configs[status] || { bg: "bg-gray-50", text: "text-gray-700", label: status, icon: null };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => filter === "all" || b.status === filter);

  const statusCounts = {
    all: bookings.length,
    pendiente: bookings.filter((b) => b.status === "pendiente").length,
    confirmado: bookings.filter((b) => b.status === "confirmado").length,
    pagado: bookings.filter((b) => b.status === "pagado").length,
    completado: bookings.filter((b) => b.status === "completado").length,
    cancelado: bookings.filter((b) => b.status === "cancelado").length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Solicitudes de Tour
            </h1>
            <p className="text-sm text-gray-400">
              {bookings.length} solicitudes · {statusCounts.pendiente} pendientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <FiCreditCard size={16} />
              Billetera
            </button>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pendiente}</p>
            <p className="text-xs text-gray-400 font-medium">Pendientes</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.confirmado}</p>
            <p className="text-xs text-gray-400 font-medium">Confirmados</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-green-600">{statusCounts.pagado}</p>
            <p className="text-xs text-gray-400 font-medium">Pagados</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.completado}</p>
            <p className="text-xs text-gray-400 font-medium">Completados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FiFilter className="text-gray-400 shrink-0" size={16} />
          {(Object.keys(FILTER_CONFIG) as FilterStatus[]).map((statusFilter) => {
            const config = FILTER_CONFIG[statusFilter];
            const isActive = filter === statusFilter;
            const count = statusCounts[statusFilter];

            return (
              <button
                key={statusFilter}
                onClick={() => setFilter(statusFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive ? config.activeColor : config.color
                } hover:shadow-sm`}
              >
                {config.label}
                {count > 0 && (
                  <span className={`ml-1.5 ${isActive ? "opacity-80" : ""}`}>({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FiAlertCircle className="text-red-600 mt-1 shrink-0" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-[#1A4D2E] rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Cargando solicitudes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl border border-gray-100 p-16 text-center"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiFileText className="text-gray-300" size={32} />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {filter === "all" ? "No tienes solicitudes aún" : `No hay solicitudes "${FILTER_CONFIG[filter].label.toLowerCase()}"`}
            </h2>
            <p className="text-sm text-gray-400">
              Cuando los turistas reserven un tour contigo, aparecerán aquí.
            </p>
          </motion.div>
        )}

        {/* Bookings List */}
        <AnimatePresence>
          <div className="space-y-3">
            {!loading &&
              filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                          <FiUser className="text-gray-400" size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {booking.touristName}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <FiCalendar size={13} />
                          <p className="text-[10px] font-bold uppercase">Fecha</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-800">
                          {formatDate(booking.fecha)}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <FiClock size={13} />
                          <p className="text-[10px] font-bold uppercase">Horario</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-800">
                          {booking.horaInicio} · {booking.duracion === "medio" ? "4h" : "8h"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <FiUsers size={13} />
                          <p className="text-[10px] font-bold uppercase">Personas</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-800">
                          {booking.numPersonas}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <FiDollarSign size={13} />
                          <p className="text-[10px] font-bold uppercase">Total</p>
                        </div>
                        <p className="font-bold text-sm text-[#1A4D2E]">
                          ${booking.total?.toLocaleString("es-MX")} MXN
                        </p>
                      </div>
                    </div>

                    {/* Notas */}
                    {booking.notas && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Notas del turista</p>
                        <p className="text-sm text-gray-700">{booking.notas}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {booking.status === "pendiente" && (
                      <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleAction(booking.id, "rechazar")}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                        >
                          <FiXCircle size={16} />
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, "confirmar")}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#1A4D2E] hover:bg-[#0D601E] text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {processingId === booking.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <FiCheckCircle size={16} />
                          )}
                          Confirmar
                        </button>
                      </div>
                    )}

                    {/* Confirmed message */}
                    {booking.status === "confirmado" && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                          <FiCheckCircle size={14} />
                          Confirmado — esperando pago del turista
                        </p>
                      </div>
                    )}

                    {/* Paid message */}
                    {booking.status === "pagado" && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-green-600 bg-green-50 rounded-xl p-3 flex items-center gap-2">
                          <FiDollarSign size={14} />
                          Pagado — tour listo para realizarse
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </AnimatePresence>
      </main>

      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
}

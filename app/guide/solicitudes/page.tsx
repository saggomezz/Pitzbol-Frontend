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
} from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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

export default function GuideSolicitudesPage() {
  const user = usePitzbolUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

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
        // Actualizar el estado local
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
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      pendiente: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendiente" },
      confirmado: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmado" },
      pagado: { bg: "bg-green-100", text: "text-green-800", label: "Pagado" },
      completado: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completado" },
      cancelado: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
    };
    const config = configs[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => filter === "all" || b.status === filter);

  const pendingCount = bookings.filter((b) => b.status === "pendiente").length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1A4D2E]">
                Solicitudes de Tour
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las reservas de tus turistas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm">
                  {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-semibold transition-all"
              >
                <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["all", "pendiente", "confirmado", "pagado", "completado", "cancelado"] as FilterStatus[]).map(
            (statusFilter) => (
              <button
                key={statusFilter}
                onClick={() => setFilter(statusFilter)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === statusFilter
                    ? "bg-[#1A4D2E] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {statusFilter === "all" ? "Todas" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                {statusFilter === "all" && ` (${bookings.length})`}
                {statusFilter === "pendiente" && ` (${bookings.filter((b) => b.status === "pendiente").length})`}
              </button>
            )
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1A4D2E] border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl shadow-lg p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiFileText className="text-gray-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {filter === "all" ? "No tienes solicitudes aún" : `No hay solicitudes con estado "${filter}"`}
            </h2>
            <p className="text-gray-600">
              Cuando los turistas reserven un tour contigo, aparecerán aquí.
            </p>
          </motion.div>
        )}

        {/* Bookings List */}
        <AnimatePresence>
          <div className="space-y-4">
            {!loading &&
              filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    {/* Top row: tourist name + status */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#F6F0E6] rounded-full flex items-center justify-center">
                          <FiUser className="text-[#1A4D2E]" size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {booking.touristName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Solicitud recibida el{" "}
                            {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiCalendar size={18} className="text-[#1A4D2E]" />
                        <div>
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="font-semibold text-sm">
                            {formatDate(booking.fecha)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <FiClock size={18} className="text-[#1A4D2E]" />
                        <div>
                          <p className="text-xs text-gray-500">Horario</p>
                          <p className="font-semibold text-sm">
                            {booking.horaInicio} -{" "}
                            {booking.duracion === "medio" ? "4h" : "8h"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <FiUsers size={18} className="text-[#1A4D2E]" />
                        <div>
                          <p className="text-xs text-gray-500">Personas</p>
                          <p className="font-semibold text-sm">
                            {booking.numPersonas}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <FiDollarSign size={18} className="text-[#1A4D2E]" />
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-semibold text-sm">
                            ${booking.total?.toLocaleString("es-MX")} MXN
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    {booking.notas && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-gray-500 mb-1">Notas del turista:</p>
                        <p className="text-sm text-gray-700">{booking.notas}</p>
                      </div>
                    )}

                    {/* Action buttons - only for pending bookings */}
                    {booking.status === "pendiente" && (
                      <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleAction(booking.id, "rechazar")}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50"
                        >
                          <FiXCircle size={18} />
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, "confirmar")}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] hover:from-[#1A4D2E] hover:to-[#0D601E] text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {processingId === booking.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          ) : (
                            <FiCheckCircle size={18} />
                          )}
                          Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}

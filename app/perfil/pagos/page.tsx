"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiInbox,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();

type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

interface PaymentRecord {
  id: string;
  bookingId?: string;
  userId?: string;
  guideId?: string | null;
  guideName?: string | null;
  touristName?: string | null;
  amount: number;
  currency?: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  status: PaymentStatus | string;
  errorMessage?: string;
  createdAt?: any;
  updatedAt?: any;
}

type Tab = "made" | "received";

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp (serialized as { _seconds, _nanoseconds })
  if (typeof value === "object") {
    const seconds =
      value._seconds ?? value.seconds ?? value.toMillis?.() / 1000;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }
  }
  if (value instanceof Date) return value;
  return null;
}

function formatDateTime(value: any): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number, currency = "mxn"): string {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: (currency || "mxn").toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)} ${currency?.toUpperCase() ?? ""}`.trim();
  }
}

function statusMeta(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "succeeded")
    return {
      label: "Pagado",
      color: "bg-green-100 text-green-800 border-green-200",
      Icon: FiCheckCircle,
    };
  if (s === "processing")
    return {
      label: "Procesando",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      Icon: FiRefreshCw,
    };
  if (s === "pending")
    return {
      label: "Pendiente",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      Icon: FiClock,
    };
  if (s === "failed")
    return {
      label: "Fallido",
      color: "bg-red-100 text-red-700 border-red-200",
      Icon: FiXCircle,
    };
  if (s === "canceled")
    return {
      label: "Cancelado",
      color: "bg-gray-100 text-gray-700 border-gray-200",
      Icon: FiXCircle,
    };
  return {
    label: status || "—",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    Icon: FiClock,
  };
}

export default function MisPagosPage() {
  const user = usePitzbolUser();
  const router = useRouter();
  const [authResolved, setAuthResolved] = useState(false);

  const [madePayments, setMadePayments] = useState<PaymentRecord[]>([]);
  const [receivedPayments, setReceivedPayments] = useState<PaymentRecord[]>([]);
  const [loadingMade, setLoadingMade] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuide = user?.role === "guia" || user?.role === "guide";
  const [activeTab, setActiveTab] = useState<Tab>("made");

  // Esperar a que se resuelva el usuario desde localStorage antes de redirigir
  useEffect(() => {
    const timer = setTimeout(() => setAuthResolved(true), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, user, router]);

  const fetchPayments = useMemo(
    () => async () => {
      if (!user?.uid) return;
      setError(null);
      setLoadingMade(true);
      try {
        const res = await fetchWithAuth(
          `${BACKEND_URL}/api/payments/history/${user.uid}`,
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        setMadePayments(Array.isArray(data.payments) ? data.payments : []);
      } catch (e: any) {
        console.error("Error cargando pagos realizados:", e);
        setError(e?.message || "No se pudieron cargar los pagos");
        setMadePayments([]);
      } finally {
        setLoadingMade(false);
      }

      if (isGuide) {
        setLoadingReceived(true);
        try {
          const res = await fetchWithAuth(
            `${BACKEND_URL}/api/payments/received/${user.uid}`,
          );
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || `HTTP ${res.status}`);
          }
          setReceivedPayments(
            Array.isArray(data.payments) ? data.payments : [],
          );
        } catch (e: any) {
          console.error("Error cargando ingresos:", e);
          setReceivedPayments([]);
        } finally {
          setLoadingReceived(false);
        }
      }
    },
    [user?.uid, isGuide],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Default a "received" para guías cuando tenga ingresos
  useEffect(() => {
    if (isGuide && receivedPayments.length > 0 && madePayments.length === 0) {
      setActiveTab("received");
    }
  }, [isGuide, receivedPayments.length, madePayments.length]);

  const visiblePayments =
    activeTab === "received" ? receivedPayments : madePayments;
  const isLoading = activeTab === "received" ? loadingReceived : loadingMade;

  const totalSucceeded = visiblePayments
    .filter(p => (p.status || "").toLowerCase() === "succeeded")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[#1A4D2E] hover:text-[#0D601E] mb-4"
        >
          <FiArrowLeft /> Volver
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A4D2E] flex items-center gap-2">
              <FiCreditCard className="text-[#0D601E]" /> Mis Pagos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Historial de pagos realizados
              {isGuide ? " e ingresos recibidos por tus tours" : ""}.
            </p>
          </div>
          <button
            onClick={fetchPayments}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-[#769C7B]/40 text-[#1A4D2E] hover:bg-[#F1F7EF] transition"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        {isGuide && (
          <div className="inline-flex bg-white p-1 rounded-full border border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("made")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === "made"
                  ? "bg-[#0D601E] text-white"
                  : "text-[#1A4D2E] hover:bg-gray-50"
              }`}
            >
              Pagos realizados
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === "received"
                  ? "bg-[#0D601E] text-white"
                  : "text-[#1A4D2E] hover:bg-gray-50"
              }`}
            >
              Ingresos recibidos
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Total {activeTab === "received" ? "recibido" : "pagado"}
            </p>
            <p className="text-xl font-bold text-[#1A4D2E] mt-1 flex items-center gap-1">
              <FiDollarSign /> {formatAmount(totalSucceeded, "mxn")}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Transacciones
            </p>
            <p className="text-xl font-bold text-[#1A4D2E] mt-1">
              {visiblePayments.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Confirmadas
            </p>
            <p className="text-xl font-bold text-[#1A4D2E] mt-1">
              {
                visiblePayments.filter(
                  p => (p.status || "").toLowerCase() === "succeeded",
                ).length
              }
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : visiblePayments.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center">
            <FiInbox className="mx-auto text-4xl text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-[#1A4D2E]">
              Aún no hay pagos
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "received"
                ? "Cuando alguien complete un pago por tus tours aparecerá aquí."
                : "Tus pagos realizados aparecerán aquí en cuanto reserves un tour."}
            </p>
            {activeTab !== "received" && (
              <Link
                href="/tours"
                className="inline-block mt-4 px-5 py-2 rounded-full bg-[#0D601E] text-white text-sm font-semibold hover:bg-[#094d18] transition"
              >
                Explorar tours
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {visiblePayments.map(p => {
              const meta = statusMeta(p.status);
              const counterpart =
                activeTab === "received" ? p.touristName : p.guideName;
              return (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${meta.color}`}
                        >
                          <meta.Icon className="text-sm" /> {meta.label}
                        </span>
                        {p.currency && (
                          <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                            {p.currency}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-lg font-bold text-[#1A4D2E]">
                        {formatAmount(Number(p.amount) || 0, p.currency)}
                      </p>
                      {counterpart && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activeTab === "received" ? "Turista: " : "Guía: "}
                          <span className="font-semibold text-[#1A4D2E]">
                            {counterpart}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(p.createdAt)}
                      </p>
                      {p.errorMessage && (
                        <p className="text-xs text-red-600 mt-2">
                          {p.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                      {p.bookingId && (
                        <Link
                          href={`/tours/confirmacion/${p.bookingId}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-[#F1F7EF] text-[#1A4D2E] hover:bg-[#E1EEDE] transition"
                        >
                          Ver reserva
                        </Link>
                      )}
                      {p.paymentIntentId && (
                        <span
                          className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]"
                          title={p.paymentIntentId}
                        >
                          {p.paymentIntentId}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { FaArrowLeft, FaCheckCircle, FaClock, FaHourglassHalf } from "react-icons/fa";
import { getBackendOrigin } from "@/lib/backendUrl";

type GuideHistoryRecord = {
  uid: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  status?: string;
  createdAt?: string;
  approvedAt?: string;
};

type TimelineItem = {
  id: string;
  uid: string;
  nombreCompleto: string;
  correo: string;
  estado: "pendiente" | "aprobado";
  fecha: string;
};

const toDateIso = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "object") {
    const dateObj = value as { seconds?: number; _seconds?: number; toDate?: () => Date };
    if (typeof dateObj.toDate === "function") {
      const d = dateObj.toDate();
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (typeof dateObj.seconds === "number") return new Date(dateObj.seconds * 1000).toISOString();
    if (typeof dateObj._seconds === "number") return new Date(dateObj._seconds * 1000).toISOString();
  }
  return null;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

export default function AdminHistorialGuiasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState<GuideHistoryRecord[]>([]);
  const [aprobados, setAprobados] = useState<GuideHistoryRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const API_BASE = getBackendOrigin();
        const headers = { "Content-Type": "application/json" };

        const [resPendientes, resAprobados] = await Promise.all([
          fetchWithAuth(`${API_BASE}/api/admin/guias/pendientes`, { headers }),
          fetchWithAuth(`${API_BASE}/api/admin/guias/aprobados`, { headers }),
        ]);

        const dataPendientes = await resPendientes.json().catch(() => ({}));
        const dataAprobados = await resAprobados.json().catch(() => ({}));

        setPendientes(Array.isArray(dataPendientes.guias) ? dataPendientes.guias : []);
        setAprobados(Array.isArray(dataAprobados.guias) ? dataAprobados.guias : []);
      } catch (error) {
        setPendientes([]);
        setAprobados([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const timeline = useMemo<TimelineItem[]>(() => {
    const pendingItems = pendientes.map((g) => {
      const fecha = toDateIso(g.createdAt) || new Date().toISOString();
      const nombreCompleto = `${g.nombre || ""} ${g.apellido || ""}`.trim() || "Guia sin nombre";
      return {
        id: `pendiente-${g.uid}`,
        uid: g.uid,
        nombreCompleto,
        correo: g.correo || "Sin correo",
        estado: "pendiente" as const,
        fecha,
      };
    });

    const approvedItems = aprobados.map((g) => {
      const fecha = toDateIso(g.approvedAt) || toDateIso(g.createdAt) || new Date().toISOString();
      const nombreCompleto = `${g.nombre || ""} ${g.apellido || ""}`.trim() || "Guia sin nombre";
      return {
        id: `aprobado-${g.uid}`,
        uid: g.uid,
        nombreCompleto,
        correo: g.correo || "Sin correo",
        estado: "aprobado" as const,
        fecha,
      };
    });

    return [...pendingItems, ...approvedItems].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [pendientes, aprobados]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A4D2E]">Historial de solicitudes de guias</h1>
            <p className="text-sm text-gray-600 mt-1">Linea de tiempo de solicitudes pendientes y guias aprobados.</p>
          </div>
          <button
            onClick={() => router.push("/admin/guias")}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0D601E]/20 bg-white px-5 py-3 font-bold text-[#0D601E] shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <FaArrowLeft /> Volver a Gestionar Guías
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-[#0D601E]/15 shadow">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Pendientes</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{pendientes.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 border border-[#0D601E]/15 shadow">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Aprobados</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{aprobados.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow border border-gray-100">
            Cargando historial de solicitudes de guias...
          </div>
        ) : timeline.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow border border-gray-100">
            No hay solicitudes de guias registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#1A4D2E]">{item.nombreCompleto}</p>
                    <p className="text-sm text-gray-500">{item.correo}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                        item.estado === "aprobado"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.estado === "aprobado" ? <FaCheckCircle /> : <FaHourglassHalf />}
                      {item.estado === "aprobado" ? "Aprobado" : "Pendiente"}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                      <FaClock /> {formatDate(item.fecha)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

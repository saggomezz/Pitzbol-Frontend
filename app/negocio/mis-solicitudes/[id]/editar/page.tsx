"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiPhone,
  FiGlobe,
  FiFileText,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { MdBusiness, MdCategory } from "react-icons/md";
import { fetchWithAuth } from "../../../../../lib/fetchWithAuth";
import AdminEditableField from "../../../../components/AdminEditableField";

const API_BASE = "/api";

const CATEGORY_OPTIONS = [
  { value: "Restaurante / Bar", label: "Restaurante / Bar" },
  { value: "Cafetería / Desayunos", label: "Cafetería / Desayunos" },
  { value: "Hotelería / Hostal / Airbnb", label: "Hotelería / Hostal / Airbnb" },
  { value: "Transporte / Traslados", label: "Transporte / Traslados" },
  { value: "Renta de Equipo Deportivo", label: "Renta de Equipo Deportivo" },
  { value: "Artesanías / Souvenirs", label: "Artesanías / Souvenirs" },
  { value: "Vida Nocturna / Club", label: "Vida Nocturna / Club" },
];

const COST_OPTIONS = [
  { value: "$100 - $250 MXN", label: "$  Bajo — $100 - $250 MXN" },
  { value: "$250 - $500 MXN", label: "$$  Medio — $250 - $500 MXN" },
  { value: "$500 - $900 MXN", label: "$$$  Alto — $500 - $900 MXN" },
  { value: "$900+ MXN", label: "$$$$  Premium — $900+ MXN" },
];

export default function EditarNegocioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/business/by-id/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setError("No se pudo cargar el negocio.");
          return;
        }
        const json = await res.json();
        if (json.success && json.business) {
          setData(json.business);
        } else {
          setError("Negocio no encontrado.");
        }
      } catch {
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const saveField = async (fields: Record<string, any>) => {
    const res = await fetchWithAuth(`${API_BASE}/business/${id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Error al guardar");
    // Actualizar estado local con los nuevos valores
    setData((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      for (const [k, v] of Object.entries(fields)) {
        if (k === "email") {
          updated.email = v;
        } else if (k.startsWith("business.")) {
          const subKey = k.replace("business.", "");
          updated.business = { ...updated.business, [subKey]: v };
        } else {
          updated.business = { ...updated.business, [k]: v };
        }
      }
      return updated;
    });
    setSuccessMsg("Campo guardado correctamente");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#0D601E] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <FiAlertCircle className="text-red-600 mx-auto mb-4" size={40} />
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-4">No encontrado</h2>
          <p className="text-[#1A4D2E]/70 mb-6">{error}</p>
          <button
            onClick={() => router.push("/negocio/mis-solicitudes")}
            className="bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Mis solicitudes
          </button>
        </motion.div>
      </div>
    );
  }

  const status = data.estado || data.status || "pendiente";
  const canEdit = status === "aprobado" || status === "APPROVED" || status === "pendiente" || status === "PENDING";

  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <FiAlertCircle className="text-amber-500 mx-auto mb-4" size={40} />
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-2">No editable</h2>
          <p className="text-[#1A4D2E]/70 mb-6">Solo puedes editar negocios activos o en revisión.</p>
          <button
            onClick={() => router.back()}
            className="bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

  const b = data.business || {};
  const email = data.email || b.email || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#0D601E] hover:text-[#094d18] font-semibold mb-6 transition-colors"
          >
            <FiArrowLeft size={20} /> Volver
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-4 rounded-2xl shadow-lg">
              <MdBusiness className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1A4D2E]">Editar Negocio</h1>
              <p className="text-gray-600 text-sm mt-1">{b.name || "Sin nombre"}</p>
            </div>
          </div>
        </motion.div>

        {/* Feedback global */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            <FiCheckCircle /> {successMsg}
          </motion.div>
        )}

        {/* Campos editables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border-2 border-[#1A4D2E]/10 shadow-sm p-6 md:p-8 space-y-4"
        >
          <div className="pb-4 border-b border-[#1A4D2E]/10">
            <p className="text-xs uppercase tracking-wide font-bold text-[#769C7B] mb-1">Información del negocio</p>
            <p className="text-sm text-[#4F6757]">Haz clic en el ícono de lápiz para editar cada campo.</p>
          </div>

          <AdminEditableField
            label="Nombre del negocio"
            value={b.name || ""}
            icon={<MdBusiness className="text-[#0D601E]" size={20} />}
            required
            onSave={(v) => saveField({ name: v })}
          />

          <AdminEditableField
            label="Descripción"
            value={b.description || ""}
            icon={<FiFileText className="text-[#0D601E]" size={20} />}
            multiline
            rows={4}
            onSave={(v) => saveField({ description: v })}
          />

          <AdminEditableField
            label="Categoría"
            value={b.category || ""}
            icon={<MdCategory className="text-[#0D601E]" size={20} />}
            options={CATEGORY_OPTIONS}
            onSave={(v) => saveField({ category: v })}
          />

          <AdminEditableField
            label="Teléfono"
            value={b.phone || ""}
            icon={<FiPhone className="text-[#0D601E]" size={20} />}
            inputType="tel"
            onSave={(v) => saveField({ phone: v })}
          />

          <AdminEditableField
            label="Email de contacto"
            value={email}
            icon={<FiMail className="text-[#0D601E]" size={20} />}
            inputType="email"
            onSave={(v) => saveField({ email: v })}
          />

          <AdminEditableField
            label="Sitio web / Redes sociales"
            value={b.website || ""}
            icon={<FiGlobe className="text-[#0D601E]" size={20} />}
            inputType="url"
            placeholder="https://..."
            onSave={(v) => saveField({ website: v })}
          />

          <AdminEditableField
            label="Costo estimado"
            value={b.estimatedCost || ""}
            options={COST_OPTIONS}
            onSave={(v) => saveField({ estimatedCost: v })}
          />
        </motion.div>

        {/* Nota sobre imágenes y ubicación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-[#FFF7E8] border border-[#F2C47C] rounded-2xl p-4 text-sm text-[#B56A00]"
        >
          <strong>Nota:</strong> Para cambiar el logo, las imágenes o la ubicación, contacta al equipo de soporte.
        </motion.div>

        {/* Botón de volver al fondo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-[#0D601E] hover:bg-[#094d18] text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
          >
            <FiArrowLeft /> Listo, volver al negocio
          </button>
        </motion.div>
      </div>
    </div>
  );
}

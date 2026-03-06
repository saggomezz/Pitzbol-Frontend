"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiX,
  FiEdit3,
  FiSave,
  FiMapPin,
  FiStar,
  FiDollarSign,
  FiImage,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
} from "react-icons/fi";
import Image from "next/image";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface GuideData {
  id: string;
  uid: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  nacionalidad: string;
  especialidades: string[];
  rfc: string;
  idiomas: string[];
  codigoPostal: string;
  fotoFrente: string;
  fotoReverso: string;
  fotoRostro: string;
  fotoPerfil: string;
  descripcion: string;
  status: string;
  tarifaMxn: number;
  tarifaDiaCompleto?: number | null;
  validacionBiometrica?: { porcentaje: number; mensaje: string } | null;
  biografia: string;
  calificacion: number;
  resenas: number;
  tours: any[];
  createdAt: string;
  approvedAt: string;
}

type SectionKey = "perfil" | "documentos" | "tours";

export default function AdminGuiaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const guideUid = params.uid as string;

  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    tipo: "exito" | "error";
    mensaje: string;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({
    perfil: true,
    documentos: true,
    tours: true,
  });
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pitzbol_token") || "";
    }
    return "";
  };

  const getAdminUid = () => {
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
        return user.uid || "";
      } catch {
        return "";
      }
    }
    return "";
  };

  const mostrarNotificacion = (tipo: "exito" | "error", mensaje: string) => {
    setNotification({ tipo, mensaje });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchGuide = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${BACKEND_URL}/api/admin/usuarios/${guideUid}/detalle`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (data.success && data.user) {
        const d = data.user.data;
        setGuide({
          id: data.user.docId || guideUid,
          uid: d.uid || guideUid,
          nombre: d["01_nombre"] || d.nombre || "",
          apellido: d["02_apellido"] || d.apellido || "",
          correo: d["04_correo"] || d.email || "",
          telefono: d["06_telefono"] || d.telefono || "",
          nacionalidad: d["05_nacionalidad"] || "",
          especialidades: d["07_especialidades"] || [],
          rfc: d["08_rfc"] || "",
          idiomas: d["09_idiomas"] || [],
          codigoPostal: d["10_cp"] || "",
          fotoFrente: d["11_foto_frente"] || "",
          fotoReverso: d["12_foto_reverso"] || "",
          fotoRostro: d["13_foto_rostro"] || "",
          fotoPerfil: d["14_foto_perfil"]?.url || "",
          descripcion: d["15_descripcion"] || "",
          status: d["16_status"] || d.status || "activo",
          tarifaMxn: d["17_tarifa_mxn"] || 0,
          tarifaDiaCompleto: d["18_tarifa_dia_completo"] || null,
          validacionBiometrica: d["18_validacion_biometrica"] || null,
          biografia: d["19_biografia"] || "",
          calificacion: d.calificacion || 0,
          resenas: d.numeroResenas || 0,
          tours: [],
          createdAt: d.createdAt || "",
          approvedAt: d.approvedAt || "",
        });
      } else {
        setError("Guía no encontrado");
      }
    } catch (err) {
      console.error("Error al cargar guía:", err);
      setError("Error al cargar datos del guía");
    }
    setLoading(false);
  }, [guideUid]);

  useEffect(() => {
    if (guideUid) fetchGuide();
  }, [guideUid, fetchGuide]);

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSave = async (field: string) => {
    if (!guide) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${BACKEND_URL}/api/admin/guias/${guide.uid}/editar`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            adminUid: getAdminUid(),
            [field]: editValue,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        mostrarNotificacion("exito", "Campo actualizado correctamente");
        setEditingField(null);
        fetchGuide();
      } else {
        mostrarNotificacion("error", data.message || "Error al actualizar");
      }
    } catch (err) {
      mostrarNotificacion("error", "Error de conexión al guardar");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!guide) return;
    setDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${BACKEND_URL}/api/admin/usuarios/${guide.uid}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role: "guia" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        mostrarNotificacion("exito", "Guía eliminado correctamente");
        setTimeout(() => router.push("/admin/guias"), 1500);
      } else {
        mostrarNotificacion("error", data.message || "Error al eliminar");
      }
    } catch (err) {
      mostrarNotificacion("error", "Error de conexión al eliminar");
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  const handleApprove = async (accion: "aprobar" | "rechazar") => {
    if (!guide) return;
    setApproving(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${BACKEND_URL}/api/admin/gestionar-guia`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            guiaDocId: guide.id,
            accion,
            adminUid: getAdminUid(),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        mostrarNotificacion(
          "exito",
          accion === "aprobar"
            ? "Guía aprobado correctamente"
            : "Guía rechazado correctamente"
        );
        setTimeout(() => router.push("/admin/guias"), 1500);
      } else {
        mostrarNotificacion("error", data.message || "Error al gestionar guía");
      }
    } catch (err) {
      mostrarNotificacion("error", "Error de conexión");
    }
    setApproving(false);
    setShowApproveModal(false);
  };

  const isPending =
    guide?.status === "en_revision" || guide?.status === "pendiente";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin"></div>
            <FiUser className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Cargando datos del guía...
          </p>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {error || "Guía no encontrado"}
          </h2>
          <button
            onClick={() => router.push("/admin/guias")}
            className="mt-4 px-6 py-3 bg-[#0D601E] text-white rounded-xl font-bold hover:bg-[#0D601E]/90 transition-colors"
          >
            Volver a Guías
          </button>
        </div>
      </div>
    );
  }

  const EditableRow = ({
    label,
    field,
    value,
    icon,
  }: {
    label: string;
    field: string;
    value: string;
    icon: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[#0D601E]">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {editingField === field ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-[#0D601E]/30 rounded-lg text-sm focus:border-[#0D601E] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => handleSave(field)}
                disabled={saving}
                className="p-2 bg-[#0D601E] text-white rounded-lg hover:bg-[#0D601E]/90 transition-colors disabled:opacity-50"
              >
                <FiSave className="text-sm" />
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800 truncate">
              {value || "—"}
            </p>
          )}
        </div>
      </div>
      {editingField !== field && !isPending && (
        <button
          onClick={() => handleEdit(field, value)}
          className="p-2 text-gray-400 hover:text-[#0D601E] hover:bg-[#0D601E]/10 rounded-lg transition-all"
        >
          <FiEdit3 className="text-sm" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-xl font-bold flex items-center gap-3 ${
                notification.tipo === "exito"
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.tipo === "exito" ? (
                <FiCheckCircle className="text-xl" />
              ) : (
                <FiAlertCircle className="text-xl" />
              )}
              {notification.mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/admin/guias")}
            className="flex items-center gap-2 text-[#0D601E] font-bold mb-4 hover:underline"
          >
            <FiArrowLeft /> Volver a Guías
          </button>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-40 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E]">
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  {guide.fotoPerfil ? (
                    <Image
                      src={guide.fotoPerfil}
                      alt={`${guide.nombre} ${guide.apellido}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] flex items-center justify-center text-white text-3xl font-bold">
                      {guide.nombre?.charAt(0).toUpperCase() || "G"}
                    </div>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute top-4 right-4">
                {isPending ? (
                  <span className="bg-amber-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                    <FiClock /> En revisión
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                    <FiCheckCircle /> Aprobado
                  </span>
                )}
              </div>

              {/* Biometric badge */}
              {guide.validacionBiometrica && (
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-2 rounded-full font-bold flex items-center gap-1 shadow-lg ${
                      guide.validacionBiometrica.porcentaje >= 70
                        ? "bg-green-500 text-white"
                        : guide.validacionBiometrica.porcentaje >= 40
                        ? "bg-yellow-500 text-black"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    🔐 Biometría: {guide.validacionBiometrica.porcentaje}%
                  </span>
                </div>
              )}
            </div>

            <div className="pt-16 pb-6 px-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#1A4D2E]">
                    {guide.nombre} {guide.apellido}
                  </h1>
                  <p className="text-gray-500 mt-1">{guide.correo}</p>
                  {guide.calificacion > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <FiStar className="text-amber-400" />
                      <span className="font-bold text-gray-700">
                        {guide.calificacion.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({guide.resenas} reseña
                        {guide.resenas !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2">
                    <FiDollarSign className="text-emerald-600" />
                    <span className="font-bold text-emerald-700">
                      ${guide.tarifaMxn} MXN/hr
                    </span>
                  </div>
                  {guide.tarifaDiaCompleto && (
                    <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2">
                      <FiClock className="text-blue-600" />
                      <span className="font-bold text-blue-700">
                        ${guide.tarifaDiaCompleto} / día
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialties */}
              {guide.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {guide.especialidades.map((esp, i) => (
                    <span
                      key={i}
                      className="bg-[#0D601E]/10 text-[#0D601E] px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              {/* Languages */}
              {guide.idiomas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {guide.idiomas.map((idioma, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      🌐 {idioma}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons for Pending Guides */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 shadow-lg"
          >
            <h3 className="text-lg font-bold text-amber-800 mb-4">
              Esta solicitud está pendiente de aprobación
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowApproveModal(true);
                }}
                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiCheckCircle /> Aprobar Guía
              </button>
              <button
                onClick={() => handleApprove("rechazar")}
                disabled={approving}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiAlertCircle /> Rechazar
              </button>
            </div>
          </motion.div>
        )}

        {/* Collapsible Sections */}

        {/* ===== PERFIL ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
        >
          <button
            onClick={() => toggleSection("perfil")}
            className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-[#0D601E]/5 to-transparent hover:from-[#0D601E]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiUser className="text-[#0D601E] text-xl" />
              <h2 className="text-xl font-bold text-[#1A4D2E]">
                Información del Perfil
              </h2>
            </div>
            {expandedSections.perfil ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.perfil && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <EditableRow
                  label="Nombre"
                  field="nombre"
                  value={guide.nombre}
                  icon={<FiUser />}
                />
                <EditableRow
                  label="Apellido"
                  field="apellido"
                  value={guide.apellido}
                  icon={<FiUser />}
                />
                <EditableRow
                  label="Correo electrónico"
                  field="correo"
                  value={guide.correo}
                  icon={<FiMail />}
                />
                <EditableRow
                  label="Teléfono"
                  field="telefono"
                  value={guide.telefono}
                  icon={<FiPhone />}
                />
                <EditableRow
                  label="Nacionalidad"
                  field="nacionalidad"
                  value={guide.nacionalidad}
                  icon={<FiGlobe />}
                />
                <EditableRow
                  label="RFC"
                  field="rfc"
                  value={guide.rfc}
                  icon={<FiFileText />}
                />
                <EditableRow
                  label="Código Postal"
                  field="codigoPostal"
                  value={guide.codigoPostal}
                  icon={<FiMapPin />}
                />
                <EditableRow
                  label="Tarifa por hora (MXN)"
                  field="tarifaMxn"
                  value={String(guide.tarifaMxn)}
                  icon={<FiDollarSign />}
                />
                <EditableRow
                  label="Tarifa día completo (MXN)"
                  field="tarifaDiaCompleto"
                  value={
                    guide.tarifaDiaCompleto
                      ? String(guide.tarifaDiaCompleto)
                      : ""
                  }
                  icon={<FiDollarSign />}
                />

                {/* Descripción */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Descripción
                  </p>
                  {editingField === "descripcion" ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-[#0D601E]/30 rounded-lg text-sm focus:border-[#0D601E] focus:outline-none min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave("descripcion")}
                          disabled={saving}
                          className="px-4 py-2 bg-[#0D601E] text-white rounded-lg font-bold text-sm hover:bg-[#0D601E]/90 disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700">
                        {guide.descripcion || "Sin descripción"}
                      </p>
                      {!isPending && (
                        <button
                          onClick={() =>
                            handleEdit("descripcion", guide.descripcion)
                          }
                          className="p-2 text-gray-400 hover:text-[#0D601E] hover:bg-[#0D601E]/10 rounded-lg transition-all"
                        >
                          <FiEdit3 className="text-sm" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Biografía */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Biografía
                  </p>
                  {editingField === "biografia" ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-[#0D601E]/30 rounded-lg text-sm focus:border-[#0D601E] focus:outline-none min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave("biografia")}
                          disabled={saving}
                          className="px-4 py-2 bg-[#0D601E] text-white rounded-lg font-bold text-sm hover:bg-[#0D601E]/90 disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700">
                        {guide.biografia || "Sin biografía"}
                      </p>
                      {!isPending && (
                        <button
                          onClick={() =>
                            handleEdit("biografia", guide.biografia)
                          }
                          className="p-2 text-gray-400 hover:text-[#0D601E] hover:bg-[#0D601E]/10 rounded-lg transition-all"
                        >
                          <FiEdit3 className="text-sm" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ===== DOCUMENTOS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
        >
          <button
            onClick={() => toggleSection("documentos")}
            className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-[#0D601E]/5 to-transparent hover:from-[#0D601E]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiImage className="text-[#0D601E] text-xl" />
              <h2 className="text-xl font-bold text-[#1A4D2E]">
                Documentos e Identificación
              </h2>
            </div>
            {expandedSections.documentos ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.documentos && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                {/* Biometric Validation Info */}
                {guide.validacionBiometrica && (
                  <div
                    className={`p-4 rounded-xl mb-6 ${
                      guide.validacionBiometrica.porcentaje >= 70
                        ? "bg-green-50 border-2 border-green-200"
                        : guide.validacionBiometrica.porcentaje >= 40
                        ? "bg-yellow-50 border-2 border-yellow-200"
                        : "bg-red-50 border-2 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🔐</span>
                      <div>
                        <p className="font-bold text-gray-800">
                          Validación Biométrica:{" "}
                          {guide.validacionBiometrica.porcentaje}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {guide.validacionBiometrica.mensaje}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          guide.validacionBiometrica.porcentaje >= 70
                            ? "bg-green-500"
                            : guide.validacionBiometrica.porcentaje >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${guide.validacionBiometrica.porcentaje}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Document Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* INE Frente */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      📄 INE - Frente
                    </p>
                    {guide.fotoFrente ? (
                      <div
                        className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-[#0D601E] transition-colors shadow-md"
                        onClick={() => setViewingImage(guide.fotoFrente)}
                      >
                        <Image
                          src={guide.fotoFrente}
                          alt="INE Frente"
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          No disponible
                        </span>
                      </div>
                    )}
                  </div>

                  {/* INE Reverso */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      📄 INE - Reverso
                    </p>
                    {guide.fotoReverso ? (
                      <div
                        className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-[#0D601E] transition-colors shadow-md"
                        onClick={() => setViewingImage(guide.fotoReverso)}
                      >
                        <Image
                          src={guide.fotoReverso}
                          alt="INE Reverso"
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          No disponible
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Foto Rostro */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      📸 Foto de Validación
                    </p>
                    {guide.fotoRostro ? (
                      <div
                        className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-[#0D601E] transition-colors shadow-md"
                        onClick={() => setViewingImage(guide.fotoRostro)}
                      >
                        <Image
                          src={guide.fotoRostro}
                          alt="Foto Rostro"
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          No disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ===== TOURS ===== */}
        {!isPending && guide.tours && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
          >
            <button
              onClick={() => toggleSection("tours")}
              className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-[#0D601E]/5 to-transparent hover:from-[#0D601E]/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FiMapPin className="text-[#0D601E] text-xl" />
                <h2 className="text-xl font-bold text-[#1A4D2E]">
                  Tours Publicados ({guide.tours.length})
                </h2>
              </div>
              {expandedSections.tours ? (
                <FiChevronUp className="text-gray-500" />
              ) : (
                <FiChevronDown className="text-gray-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.tours && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6"
                >
                  {guide.tours.length === 0 ? (
                    <div className="text-center py-10">
                      <FiMapPin className="text-gray-300 text-4xl mx-auto mb-2" />
                      <p className="text-gray-500">
                        Este guía aún no ha publicado tours
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {guide.tours.map((tour: any) => (
                        <div
                          key={tour.id}
                          className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-[#0D601E]/20 transition-colors"
                        >
                          <h4 className="font-bold text-[#1A4D2E] mb-2">
                            {tour.titulo || "Tour sin nombre"}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {tour.duracion && (
                              <p>
                                <FiClock className="inline mr-1" />
                                {tour.duracion}
                              </p>
                            )}
                            {tour.precio != null && (
                              <p>
                                <FiDollarSign className="inline mr-1" />$
                                {tour.precio} MXN
                              </p>
                            )}
                            {tour.maxPersonas && (
                              <p>
                                <FiUser className="inline mr-1" />
                                Máx. {tour.maxPersonas} personas
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Danger Zone (for approved guides) */}
        {!isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg mb-6 p-6 border-2 border-red-100"
          >
            <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
              <FiTrash2 /> Zona de Peligro
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Eliminar este guía es irreversible. Se eliminará de todas las
              colecciones y de Firebase Auth.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <FiTrash2 /> Eliminar Guía
            </button>
          </motion.div>
        )}

        {/* Image Viewer Modal */}
        <AnimatePresence>
          {viewingImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setViewingImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setViewingImage(null)}
                  className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
                >
                  <FiX size={32} />
                </button>
                <Image
                  src={viewingImage}
                  alt="Documento"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiTrash2 className="text-red,500 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ¿Eliminar a {guide.nombre} {guide.apellido}?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Esta acción es irreversible. Se eliminará al guía de todas
                    las colecciones y de Firebase Authentication.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Approve Confirmation Modal */}
        <AnimatePresence>
          {showApproveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowApproveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-emerald-500 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ¿Aprobar a {guide.nombre} {guide.apellido}?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    El guía será movido a la lista de aprobados, se actualizarán
                    sus permisos y se le enviará un correo de confirmación.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowApproveModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleApprove("aprobar")}
                      disabled={approving}
                      className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {approving ? "Aprobando..." : "Aprobar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiFileText,
  FiImage,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiBriefcase,
  FiX,
  FiChevronRight,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiArchive,
} from "react-icons/fi";
import { gestionarNegocioPendiente } from "@/lib/gestionarNegocioApi";
import dynamic from "next/dynamic";
import GestionarNegocioModal from "@/app/components/GestionarNegocioModal";
import AdminEditableField from "@/app/components/AdminEditableField";
import AdminEditableLogo from "@/app/components/AdminEditableLogo";
import AdminEditableImage from "@/app/components/AdminEditableImage";
import AdminEditableLocation from "@/app/components/AdminEditableLocation";
import AdminImageUploader from "@/app/components/AdminImageUploader";
import "leaflet/dist/leaflet.css";
import { getBackendOrigin } from "@/lib/backendUrl";

const BACKEND_URL = getBackendOrigin();

const businessCategoryOptions = [
  { value: "Restaurante / Bar", label: "Restaurante / Bar" },
  { value: "Cafetería / Desayunos", label: "Cafetería / Desayunos" },
  { value: "Hotelería / Hostal / Airbnb", label: "Hotelería / Hostal / Airbnb" },
  { value: "Transporte / Traslados", label: "Transporte / Traslados" },
  { value: "Renta de Equipo Deportivo", label: "Renta de Equipo Deportivo" },
  { value: "Artesanías / Souvenirs", label: "Artesanías / Souvenirs" },
  { value: "Vida Nocturna / Club", label: "Vida Nocturna / Club" },
];

const COST_OPTIONS: { label: string; value: string; accent: string }[] = [
  { label: "Bajo", value: "$100 - $250 MXN", accent: "$" },
  { label: "Medio", value: "$250 - $500 MXN", accent: "$$" },
  { label: "Alto", value: "$500 - $900 MXN", accent: "$$$" },
  { label: "Premium", value: "$900+ MXN", accent: "$$$$" },
];

type WeekDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

type WeeklySchedule = Record<WeekDayKey, DaySchedule>;

const DAY_LABELS: { key: WeekDayKey; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const DEFAULT_DAY_SCHEDULE: DaySchedule = { enabled: false, open: "09:00", close: "18:00" };

const createDefaultSchedule = (): WeeklySchedule => ({
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: { ...DEFAULT_DAY_SCHEDULE },
  sunday: { ...DEFAULT_DAY_SCHEDULE },
});

const normalizeSchedule = (input: unknown): WeeklySchedule => {
  const base = createDefaultSchedule();
  if (!input || typeof input !== "object") return base;
  const source = input as Record<string, Partial<DaySchedule> | undefined>;

  DAY_LABELS.forEach((day) => {
    const current = source[day.key];
    if (!current) return;
    base[day.key] = {
      enabled: !!current.enabled,
      open: typeof current.open === "string" && current.open ? current.open : base[day.key].open,
      close: typeof current.close === "string" && current.close ? current.close : base[day.key].close,
    };
  });

  return base;
};

const validateEmail = (value: string) => {
  if (!value.trim()) return "El correo electrónico es obligatorio";
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return isValid ? null : "El formato del correo es inválido";
};

const validatePhone = (value: string) => {
  if (!value.trim()) return "El teléfono es obligatorio";
  return /^\d{10}$/.test(value) ? null : "El teléfono debe tener 10 dígitos";
};

const validateURL = (value: string) => {
  if (!value.trim()) return "El sitio web o redes sociales son obligatorios";
  const pattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return pattern.test(value.trim()) ? null : "URL no válida. Ejemplo: https://facebook.com/tunegocio";
};

const validateRFC = (value: string) => {
  if (!value.trim()) return "El RFC es obligatorio";
  return /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i.test(value) ? null : "RFC inválido";
};

const validateCP = (value: string) => {
  if (!value.trim()) return "El código postal es obligatorio";
  return /^\d{5}$/.test(value) ? null : "El código postal debe tener 5 dígitos";
};

const validateBusinessName = (value: string) => {
  if (!value.trim()) return "El nombre del negocio es obligatorio";
  return null;
};

type UniquenessField = "businessName" | "email" | "phone" | "website" | "location" | "rfc" | "cp";

interface OwnerData {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
  fotoPerfil: string | null;
  telefono: string;
}

interface BusinessData {
  id: string;
  uid: string;
  ownerUid?: string | null;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "archivado" | "aprobado" | "ARCHIVED" | "Archivado";
  business: {
    name: string;
    category: string;
    phone: string;
    location: string;
    website: string;
    rfc: string;
    cp: string;
    description: string;
    logo: string;
    images: string[];
    owner: string;
    createdAt: string;
    latitud?: string | null;
    longitud?: string | null;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigoPostal?: string;
    ciudad?: string;
    estado?: string;
    local?: string;
    referencias?: string;
    subcategorias?: string[];
    subcategories?: string[];
    costoEstimado?: string;
    estimatedCost?: string;
    tiempoSugerido?: string | number;
    suggestedStayTime?: string | number;
    horario?: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
    schedule?: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
  };
  archivedReason?: string;
  archivedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string | null;
}

type SectionKey = "solicitante" | "negocio" | "galeria";
type AdditionalSectionKey = "subcategorias" | "costoEstimado" | "tiempoSugerido" | "horario";

export default function AdminViewBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    solicitante: true,
    negocio: true,
    galeria: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAccion, setModalAccion] = useState<"aprobar" | "rechazar">("aprobar");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [resultadoMensaje, setResultadoMensaje] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationDraftCoords, setLocationDraftCoords] = useState<{ latitud: string; longitud: string } | null>(null);
  
  // Nuevos estados para acciones de negocios activos y archivados
  const [modalArchivar, setModalArchivar] = useState(false);
  const [motivoArchivo, setMotivoArchivo] = useState("");
  const [modalEliminar, setModalEliminar] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [subcategoriaInput, setSubcategoriaInput] = useState("");
  const [draftSubcategorias, setDraftSubcategorias] = useState<string[]>([]);
  const [draftCostoEstimado, setDraftCostoEstimado] = useState("");
  const [draftTiempoSugerido, setDraftTiempoSugerido] = useState("");
  const [draftHorario, setDraftHorario] = useState<WeeklySchedule>(createDefaultSchedule());
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [scheduleSelection, setScheduleSelection] = useState<WeekDayKey[]>([]);
  const [bulkOpenTime, setBulkOpenTime] = useState("09:00");
  const [bulkCloseTime, setBulkCloseTime] = useState("18:00");
  const [savingAdditionalInfo, setSavingAdditionalInfo] = useState(false);
  const [additionalInfoError, setAdditionalInfoError] = useState("");
  const [editingAdditional, setEditingAdditional] = useState<Record<AdditionalSectionKey, boolean>>({
    subcategorias: false,
    costoEstimado: false,
    tiempoSugerido: false,
    horario: false,
  });

  const BACKEND_URL = getBackendOrigin();

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (resultadoMensaje) {
      const timer = setTimeout(() => {
        setResultadoMensaje(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resultadoMensaje]);

  useEffect(() => {
    async function fetchBusiness() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("pitzbol_token");
        const response = await fetch(`/api/business/by-id/${businessId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          setError(response.status === 404 ? "Negocio no encontrado." : "Error al cargar los detalles del negocio.");
          setBusiness(null);
          return;
        }

        const data = await response.json();
        if (data.success && data.business) {
          setBusiness(data.business);
          setOwner(data.owner || null);
        } else {
          setError("No se pudieron cargar los detalles.");
          setBusiness(null);
        }
      } catch (err) {
        console.error("Error fetching business:", err);
        setError("Error de conexión. Intenta más tarde.");
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    if (businessId) fetchBusiness();
  }, [businessId]);

  useEffect(() => {
    if (!business) return;
    setLocationDraftCoords({
      latitud: business.business.latitud || "",
      longitud: business.business.longitud || "",
    });
  }, [business]);

  useEffect(() => {
    if (!business) return;

    const currentSubcategorias = Array.isArray(business.business.subcategorias)
      ? business.business.subcategorias
      : Array.isArray(business.business.subcategories)
        ? business.business.subcategories
        : [];
    const currentCostoEstimado = business.business.costoEstimado || business.business.estimatedCost || "";
    const currentTiempoSugerido = business.business.tiempoSugerido ?? business.business.suggestedStayTime ?? "";
    const currentHorario = business.business.horario ?? business.business.schedule;

    setDraftSubcategorias(currentSubcategorias);
    setDraftCostoEstimado(currentCostoEstimado);
    setDraftTiempoSugerido(String(currentTiempoSugerido));
    setDraftHorario(normalizeSchedule(currentHorario));
    setAdditionalInfoError("");
    setSubcategoriaInput("");
  }, [business]);

  const addSubcategory = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;
    if (value.length > 40) {
      setAdditionalInfoError("Cada subcategoría debe tener máximo 40 caracteres");
      return;
    }

    setDraftSubcategorias((prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      if (prev.length >= 10) {
        setAdditionalInfoError("Máximo 10 subcategorías");
        return prev;
      }
      return [...prev, value];
    });
    setSubcategoriaInput("");
    setAdditionalInfoError("");
  };

  const removeSubcategory = (value: string) => {
    setDraftSubcategorias((prev) => prev.filter((item) => item !== value));
    setAdditionalInfoError("");
  };

  const toggleScheduleSelection = (day: WeekDayKey) => {
    setScheduleSelection((prev) =>
      prev.includes(day) ? prev.filter((key) => key !== day) : [...prev, day]
    );
  };

  const applyScheduleToSelection = () => {
    if (!bulkOpenTime || !bulkCloseTime || bulkOpenTime >= bulkCloseTime || scheduleSelection.length === 0) {
      setAdditionalInfoError("Selecciona días y un rango horario válido");
      return;
    }

    setDraftHorario((prev) => {
      const next = { ...prev };
      scheduleSelection.forEach((day) => {
        next[day] = {
          ...next[day],
          enabled: true,
          open: bulkOpenTime,
          close: bulkCloseTime,
        };
      });
      return next;
    });
    setAdditionalInfoError("");
  };

  const disableScheduleDay = (day: WeekDayKey) => {
    setDraftHorario((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: false,
      },
    }));
  };

  useEffect(() => {
    if (!isScheduleEditorOpen) return;

    const enabledDays = DAY_LABELS.filter((day) => draftHorario[day.key].enabled).map((day) => day.key);
    const firstEnabled = enabledDays[0];

    setScheduleSelection(enabledDays.length > 0 ? enabledDays : ["monday", "tuesday", "wednesday", "thursday", "friday"]);
    setBulkOpenTime(firstEnabled ? draftHorario[firstEnabled].open : "09:00");
    setBulkCloseTime(firstEnabled ? draftHorario[firstEnabled].close : "18:00");
  }, [isScheduleEditorOpen, draftHorario]);

  const startAdditionalSectionEdit = (section: AdditionalSectionKey) => {
    if (!business) return;
    setAdditionalInfoError("");

    if (section === "subcategorias") {
      const currentSubcategorias = Array.isArray(business.business.subcategorias)
        ? business.business.subcategorias
        : Array.isArray(business.business.subcategories)
          ? business.business.subcategories
          : [];
      setDraftSubcategorias(currentSubcategorias);
      setSubcategoriaInput("");
    }
    if (section === "costoEstimado") {
      setDraftCostoEstimado(business.business.costoEstimado || business.business.estimatedCost || "");
    }
    if (section === "tiempoSugerido") {
      setDraftTiempoSugerido(String(business.business.tiempoSugerido ?? business.business.suggestedStayTime ?? ""));
    }
    if (section === "horario") {
      setDraftHorario(normalizeSchedule(business.business.horario ?? business.business.schedule));
    }

    setEditingAdditional((prev) => ({ ...prev, [section]: true }));
  };

  const cancelAdditionalSectionEdit = (section: AdditionalSectionKey) => {
    if (!business) return;
    setAdditionalInfoError("");

    if (section === "subcategorias") {
      const currentSubcategorias = Array.isArray(business.business.subcategorias)
        ? business.business.subcategorias
        : Array.isArray(business.business.subcategories)
          ? business.business.subcategories
          : [];
      setDraftSubcategorias(currentSubcategorias);
      setSubcategoriaInput("");
    }
    if (section === "costoEstimado") {
      setDraftCostoEstimado(business.business.costoEstimado || business.business.estimatedCost || "");
    }
    if (section === "tiempoSugerido") {
      setDraftTiempoSugerido(String(business.business.tiempoSugerido ?? business.business.suggestedStayTime ?? ""));
    }
    if (section === "horario") {
      setDraftHorario(normalizeSchedule(business.business.horario ?? business.business.schedule));
      setIsScheduleEditorOpen(false);
    }

    setEditingAdditional((prev) => ({ ...prev, [section]: false }));
  };

  const saveAdditionalSection = async (section: AdditionalSectionKey) => {
    if (!business) return;

    setSavingAdditionalInfo(true);
    setAdditionalInfoError("");
    try {
      const token = localStorage.getItem("pitzbol_token");
      const payload: Record<string, unknown> = {};

      if (section === "subcategorias") payload.subcategories = draftSubcategorias;
      if (section === "costoEstimado") payload.estimatedCost = draftCostoEstimado;
      if (section === "tiempoSugerido") payload.suggestedStayTime = draftTiempoSugerido;
      if (section === "horario") payload.schedule = draftHorario;

      const response = await fetch(`/api/business/${business.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la información adicional");
      }

      setBusiness((prev) => {
        if (!prev) return prev;
        const patch: Partial<BusinessData["business"]> = {};

        if (section === "subcategorias") {
          patch.subcategorias = draftSubcategorias;
          patch.subcategories = draftSubcategorias;
        }
        if (section === "costoEstimado") {
          patch.costoEstimado = draftCostoEstimado;
          patch.estimatedCost = draftCostoEstimado;
        }
        if (section === "tiempoSugerido") {
          patch.tiempoSugerido = draftTiempoSugerido;
          patch.suggestedStayTime = draftTiempoSugerido;
        }
        if (section === "horario") {
          patch.horario = draftHorario;
          patch.schedule = draftHorario;
        }

        return {
          ...prev,
          business: {
            ...prev.business,
            ...patch,
          },
        };
      });

      setEditingAdditional((prev) => ({ ...prev, [section]: false }));
      if (section === "horario") setIsScheduleEditorOpen(false);
      setResultadoMensaje({ tipo: "exito", mensaje: "Sección actualizada correctamente" });
    } catch (err) {
      console.error("Error actualizando información adicional:", err);
      setAdditionalInfoError("Error al guardar. Intenta nuevamente.");
      setResultadoMensaje({ tipo: "error", mensaje: "No se pudo actualizar la sección" });
    } finally {
      setSavingAdditionalInfo(false);
    }
  };

  const handleGestionarNegocio = async (accion: "aprobar" | "rechazar") => {
    if (!business) return;
    setModalAccion(accion);
    if (accion === "aprobar") {
      setMotivoRechazo("");
    }
    setModalOpen(true);
  };

  const handleConfirmarGestion = async () => {
    if (!business) return;

    setProcesando(true);
    try {
      const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || "{}").uid;
      await gestionarNegocioPendiente({
        negocioId: business.id,
        accion: modalAccion,
        adminUid,
        motivoRechazo: modalAccion === "rechazar" ? motivoRechazo.trim() : undefined,
      });
      setResultadoMensaje({
        tipo: "exito",
        mensaje: `Negocio ${modalAccion === "aprobar" ? "aprobado" : "rechazado"} exitosamente`,
      });
      setModalOpen(false);
      setMotivoRechazo("");
      setTimeout(() => {
        // Redirigir según la acción: aprobados ? registrados, rechazados ? archivados
        const targetTab = modalAccion === "aprobar" ? "registrados" : "archivados";
        router.push(`/admin/negocios?tab=${targetTab}`);
      }, 1500);
    } catch (e) {
      console.error("Error al gestionar negocio:", e);
      setResultadoMensaje({
        tipo: "error",
        mensaje: `Error al ${modalAccion} negocio. Intenta nuevamente.`,
      });
      setModalOpen(false);
    } finally {
      setProcesando(false);
    }
  };

  // Regresar negocio activo a pendientes
  const handleRegresarAPendientes = async () => {
    if (!business) return;
    setProcesandoAccion(true);
    try {
      const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || "{}").uid;
      const response = await fetch(`/api/admin/negocios/${business.id}/regresar-pendientes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const data = await response.json();
      if (data.success) {
        setResultadoMensaje({ tipo: "exito", mensaje: "Negocio regresado a pendientes exitosamente" });
        setTimeout(() => router.push("/admin/negocios?tab=pendientes"), 1500);
      } else {
        setResultadoMensaje({ tipo: "error", mensaje: data.message || "Error al regresar a pendientes" });
      }
    } catch (error) {
      setResultadoMensaje({ tipo: "error", mensaje: "Error de conexión" });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Archivar negocio activo
  const handleArchivarNegocio = async () => {
    if (!business) return;
    setProcesandoAccion(true);
    try {
      const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || "{}").uid;
      const motivoFinal = motivoArchivo.trim() || "Archivado por administrador";
      const response = await fetch(`/api/admin/negocios/${business.id}/archivar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoFinal, adminUid }),
      });
      const data = await response.json();
      if (data.success) {
        setResultadoMensaje({ tipo: "exito", mensaje: "Negocio archivado exitosamente" });
        setModalArchivar(false);
        setMotivoArchivo("");
        setTimeout(() => router.push("/admin/negocios?tab=archivados"), 1500);
      } else {
        setResultadoMensaje({ tipo: "error", mensaje: data.message || "Error al archivar" });
      }
    } catch (error) {
      setResultadoMensaje({ tipo: "error", mensaje: "Error de conexión" });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Desarchivar negocio
  const handleDesarchivarNegocio = async () => {
    if (!business) return;
    setProcesandoAccion(true);
    try {
      const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || "{}").uid;
      const response = await fetch(`/api/admin/negocios/${business.id}/desarchivar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const data = await response.json();
      if (data.success) {
        setResultadoMensaje({ tipo: "exito", mensaje: "Negocio desarchivado exitosamente" });
        setTimeout(() => router.push("/admin/negocios?tab=pendientes"), 1500);
      } else {
        setResultadoMensaje({ tipo: "error", mensaje: data.message || "Error al desarchivar" });
      }
    } catch (error) {
      setResultadoMensaje({ tipo: "error", mensaje: "Error de conexión" });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Eliminar permanentemente negocio
  const handleEliminarPermanentemente = async () => {
    if (!business) return;
    setProcesandoAccion(true);
    try {
      const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || "{}").uid;
      const response = await fetch(`/api/admin/negocios/${business.id}/eliminar-permanente`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const data = await response.json();
      if (data.success) {
        setResultadoMensaje({ tipo: "exito", mensaje: "Negocio eliminado permanentemente" });
        setModalEliminar(false);
        setTimeout(() => router.push("/admin/negocios?tab=archivados"), 1500);
      } else {
        setResultadoMensaje({ tipo: "error", mensaje: data.message || "Error al eliminar" });
      }
    } catch (error) {
      setResultadoMensaje({ tipo: "error", mensaje: "Error de conexión" });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleUpdateBusinessField = async (field: string, value: string) => {
    if (!business) return;

    const token = localStorage.getItem("pitzbol_token");
    const updateData: any = { [field]: value };

    const response = await fetch(`/api/business/${business.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar el negocio");
    }

    // Actualizar el estado local
    setBusiness((prev) => {
      if (!prev) return prev;
      
      // Si es email, se actualiza a nivel raíz, si no, dentro de business
      if (field === "email") {
        return {
          ...prev,
          email: value,
        };
      }
      
      return {
        ...prev,
        business: {
          ...prev.business,
          [field === "businessName" ? "name" : field]: value,
        },
      };
    });

  };

  const validateUniquenessField = async (field: UniquenessField, value: string) => {
    if (!business || !value.trim()) return;

    const response = await fetch(`/api/business/validate-uniqueness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [field]: value,
        excludeBusinessId: business.id,
      }),
    });

    if (response.ok) return;

    const data = await response.json().catch(() => null);
    const backendError = data?.errors?.[field];
    throw new Error(backendError || "Este valor ya está registrado");
  };

  const handleUpdateLocation = async (data: {
    location: string;
    latitud: string;
    longitud: string;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigoPostal?: string;
    ciudad?: string;
    estado?: string;
    local?: string;
    referencias?: string;
  }) => {
    if (!business) return;

    await validateUniquenessField("location", data.location);

    const token = localStorage.getItem("pitzbol_token");
    const updateData: any = {
      location: data.location,
      latitud: data.latitud,
      longitud: data.longitud,
      calle: data.calle,
      numero: data.numero,
      colonia: data.colonia,
      codigoPostal: data.codigoPostal,
      ciudad: data.ciudad,
      estado: data.estado,
      local: data.local,
      referencias: data.referencias,
    };

    const response = await fetch(`/api/business/${business.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar la ubicación");
    }

    // Actualizar el estado local
    setBusiness((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        business: {
          ...prev.business,
          location: data.location,
          latitud: data.latitud,
          longitud: data.longitud,
          calle: data.calle,
          numero: data.numero,
          colonia: data.colonia,
          codigoPostal: data.codigoPostal,
          ciudad: data.ciudad,
          estado: data.estado,
          local: data.local,
          referencias: data.referencias,
        },
      };
    });

    setLocationDraftCoords({
      latitud: data.latitud || "",
      longitud: data.longitud || "",
    });
  };

  const handleUpdateLogo = async (file: File) => {
    if (!business) return;

    const token = localStorage.getItem("pitzbol_token");
    const formData = new FormData();
    formData.append("logo", file);
    if (business.business.logo) {
      formData.append("deleteLogoUrl", business.business.logo);
    }

    const response = await fetch(`/api/business/${business.id}/images`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al actualizar el logo");
    }

    const data = await response.json();
    if (data.data?.logo) {
      setBusiness((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          business: {
            ...prev.business,
            logo: data.data.logo,
          },
        };
      });
    }
  };

  const handleUpdateImage = async (index: number, file: File) => {
    if (!business) return;

    const token = localStorage.getItem("pitzbol_token");
    const formData = new FormData();
    formData.append("images", file);
    
    // Mantener las otras imágenes pero reemplazar la que se está editando
    const deleteImageUrls = [business.business.images[index]];
    formData.append("deleteImageUrls", JSON.stringify(deleteImageUrls));

    const response = await fetch(`/api/business/${business.id}/images`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al actualizar la imagen");
    }

    const data = await response.json();
    if (data.data?.images && data.data.images.length > 0) {
      setBusiness((prev) => {
        if (!prev) return prev;
        const newImages = [...prev.business.images];
        newImages[index] = data.data.images[0];
        return {
          ...prev,
          business: {
            ...prev.business,
            images: newImages,
          },
        };
      });
    }
  };

  const handleAddImage = async (file: File) => {
    if (!business) return;

    // Verificar que no exceed el límite de 10 imágenes
    if (business.business.images.length >= 10) {
      throw new Error("Máximo 10 imágenes permitidas");
    }

    const token = localStorage.getItem("pitzbol_token");
    const formData = new FormData();
    formData.append("images", file);

    const response = await fetch(`/api/business/${business.id}/images`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al agregar la imagen");
    }

    const data = await response.json();
    if (data.data?.images && data.data.images.length > 0) {
      setBusiness((prev) => {
        if (!prev) return prev;
        const currentImages = prev.business.images || [];
        return {
          ...prev,
          business: {
            ...prev.business,
            images: [...currentImages, data.data.images[0]],
          },
        };
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="text-5xl text-[#0D601E]"
        >
          <FiClock />
        </motion.div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A4D2E] mb-3">No disponible</h2>
          <p className="text-[#1A4D2E]/70 mb-6">{error || "No se pudo cargar el negocio."}</p>
          <Link
            href="/admin/negocios?tab=pendientes"
            className="inline-block bg-[#0D601E] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#094d18] transition-colors"
          >
            Volver a negocios
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig: {
    [key in "PENDING" | "APPROVED" | "REJECTED" | "archivado"]: {
      label: string;
      color: string;
      bgColor: string;
      icon: React.ReactNode;
      description: string;
    };
  } = {
    PENDING: {
      label: "Pendiente por Aprobar",
      color: "text-[#B56A00]",
      bgColor: "bg-[#FFF7E8] border-[#F2C47C]",
      icon: <FiClock className="text-[#B56A00]" size={22} />,
      description: "Esta solicitud está esperando revisión administrativa.",
    },
    APPROVED: {
      label: "Aprobado",
      color: "text-[#1F6B3A]",
      bgColor: "bg-[#E9F7EE] border-[#9ED9B2]",
      icon: <FiCheckCircle className="text-[#1F6B3A]" size={22} />,
      description: "El negocio está aprobado y disponible para los usuarios.",
    },
    REJECTED: {
      label: "Rechazado",
      color: "text-[#8B0000]",
      bgColor: "bg-[#FDEAEA] border-[#F2A5A5]",
      icon: <FiAlertCircle className="text-[#8B0000]" size={22} />,
      description: "La solicitud fue rechazada por revisión administrativa.",
    },
    archivado: {
      label: "Archivado",
      color: "text-gray-600",
      bgColor: "bg-gray-100 border-gray-300",
      icon: <FiAlertCircle className="text-gray-600" size={22} />,
      description: "Este negocio está archivado.",
    },
  };

  const normalizedStatus = (business.status || "").toString().trim().toLowerCase();
  const statusMap: Record<string, keyof typeof statusConfig> = {
    pending: "PENDING",
    approved: "APPROVED",
    aprobado: "APPROVED",
    rejected: "REJECTED",
    rechazado: "REJECTED",
    archivado: "archivado",
    archived: "archivado",
  };
  const mappedStatus = statusMap[normalizedStatus] || "PENDING";
  const config = statusConfig[mappedStatus];
  const ownerName = owner ? `${owner.nombre} ${owner.apellido}`.trim() : business.business.owner;
  const ownerProfileIdentifier = owner?.uid || business.ownerUid || business.id || business.uid || business.business.owner || "";
  const isPending = mappedStatus === "PENDING";
  const isApproved = mappedStatus === "APPROVED";
  const isArchived = mappedStatus === "archivado";
  const isRejected = mappedStatus === "REJECTED";
  const showArchivedStyleActions = isArchived || isRejected;
  const hasAdministrativeActions = isPending || isApproved || showArchivedStyleActions;
  const activeSchedulePreview = DAY_LABELS.filter((day) => draftHorario[day.key].enabled).map((day) => ({
    key: day.key,
    label: day.label,
    open: draftHorario[day.key].open,
    close: draftHorario[day.key].close,
  }));

  return (
    <div className="min-h-screen bg-[#F6F8F7] relative">
      <div
        className="absolute inset-x-0 top-0 h-[22rem] md:h-[24rem] lg:h-[26rem] overflow-hidden"
        style={{
          backgroundImage: business.business.images?.[0]
            ? `url(${business.business.images[0]})`
            : business.business.logo
              ? `url(${business.business.logo})`
              : "linear-gradient(135deg, #0D601E 0%, #1A4D2E 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#0D601E]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D601E]/75 via-[#0D601E]/45 to-[#0D601E]/35" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6 md:pt-8 pb-8 md:pb-12">
        <Link
          href="/admin/negocios?tab=pendientes"
          className="relative z-20 inline-flex items-center gap-2 text-white hover:text-white/85 font-semibold mb-6 transition-colors"
        >
          <FiArrowLeft size={20} /> Volver
        </Link>

        <div className="h-28 md:h-32 lg:h-36" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white rounded-[40px] shadow-lg overflow-hidden border border-[#1A4D2E]/10"
        >
          <div className="p-6 md:p-8 bg-[#F8FBF8]">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0D601E]/10 border border-[#0D601E]/25 px-4 py-2">
                  <FiBriefcase className="text-[#0D601E]" size={15} />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1A4D2E]">Gestión Administrativa</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1A4D2E] leading-tight" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                {business.business.name}
              </h1>
              <p className="text-[#4F6757] font-black text-lg md:text-xl mt-1" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                {business.business.category}
              </p>
              <div className="flex justify-center mt-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-wide ${config.color} bg-white border border-[#1A4D2E]/15 shadow-sm`}>
                  {config.icon}
                  {config.label}
                </span>
              </div>
              <p className="mt-4 text-[#1A4D2E]/80 text-sm md:text-base font-medium">{config.description}</p>
            </div>
          </div>

          <div className="h-[2px] w-full bg-[#1A4D2E]/20" />

          <div className="px-6 md:px-8 pt-6 md:pt-8 pb-8 md:pb-10 bg-gradient-to-b from-white to-[#FCFEFC]">
            <div className={`mb-8 grid gap-5 ${hasAdministrativeActions ? "xl:grid-cols-2 xl:items-stretch" : ""}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="h-full bg-white rounded-3xl p-5 border-2 border-[#1A4D2E]/20 flex flex-col shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleSection("solicitante")}
                  className="w-full flex items-center justify-between text-left pb-3 border-b-2 border-[#1A4D2E]/15"
                >
                  <h3 className="text-xl font-black text-[#1A4D2E] inline-flex items-center gap-2">
                    <FiUser className="text-[#0D601E]" size={18} /> Información del Solicitante
                  </h3>
                  <FiChevronRight
                    size={22}
                    className={`text-[#1A4D2E] transition-transform duration-200 ${openSections.solicitante ? "rotate-90" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {openSections.solicitante && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden flex-1"
                    >
                      <div className="mt-5 h-full">
                        {ownerProfileIdentifier && (
                          <Link
                            href={`/perfil/${encodeURIComponent(ownerProfileIdentifier)}`}
                            className="block w-full bg-[#FCFEFC] border-2 border-[#1A4D2E]/15 rounded-2xl p-4 hover:shadow-lg hover:border-[#0D601E]/35 transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1A4D2E]/20 bg-[#F6F0E6] flex-shrink-0">
                                {owner?.fotoPerfil ? (
                                  <img src={owner.fotoPerfil} alt={ownerName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#769C7B]">
                                    <FiUser size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiUser size={16} className="text-[#0D601E]" />
                                  <p className="text-xs text-[#769C7B] font-black uppercase tracking-wide">Propietario</p>
                                </div>
                                <p className="text-sm font-black text-[#1A4D2E] break-all mb-1">{ownerName || "No disponible"}</p>
                                <p className="text-xs text-[#769C7B] break-all">{owner?.email || "No disponible"}</p>
                              </div>
                              <FiChevronRight size={20} className="text-[#0D601E] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="h-full flex">
                {isPending && (
                  <PendingDecisionPanel
                    procesando={procesando}
                    modalAccion={modalAccion}
                    onAprobar={() => handleGestionarNegocio("aprobar")}
                    onRechazar={() => handleGestionarNegocio("rechazar")}
                    compact
                  />
                )}

                {isApproved && (
                  <ApprovedBusinessPanel
                    procesando={procesandoAccion}
                    onRegresarPendientes={handleRegresarAPendientes}
                    onArchivar={() => setModalArchivar(true)}
                  />
                )}

                {showArchivedStyleActions && (
                  <ArchivedBusinessPanel
                    procesando={procesandoAccion}
                    onDesarchivar={handleDesarchivarNegocio}
                    onEliminar={() => setModalEliminar(true)}
                  />
                )}
              </div>
            </div>

            <div className="mb-6 h-[2px] w-full bg-[#1A4D2E]/20" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8 -mx-6 md:-mx-8 px-6 md:px-8 py-5 bg-[#F8FBF8]"
            >
              <button
                type="button"
                onClick={() => toggleSection("negocio")}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E] inline-flex items-center gap-2">
                  <FiBriefcase className="text-[#0D601E]" size={20} /> Información del Negocio
                </h3>
                <FiChevronRight
                  size={24}
                  className={`text-[#1A4D2E] transition-transform duration-200 ${openSections.negocio ? "rotate-90" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {openSections.negocio && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col gap-4"
                        >
                          <LocationMap
                            location={business.business.location}
                            businessName={business.business.name}
                            latitud={isEditingLocation ? (locationDraftCoords?.latitud ?? business.business.latitud ?? "") : business.business.latitud}
                            longitud={isEditingLocation ? (locationDraftCoords?.longitud ?? business.business.longitud ?? "") : business.business.longitud}
                            editable={isEditingLocation}
                            onLocationChange={(lat, lng) => {
                              setLocationDraftCoords({ latitud: lat, longitud: lng });
                            }}
                          />

                          <div className="space-y-3">
                            <AdminEditableField
                              label="Nombre del negocio"
                              value={business.business.name || ""}
                              icon={<FiBriefcase className="text-[#0D601E]" size={24} />}
                              required
                              validate={validateBusinessName}
                              onSave={async (value) => {
                                await validateUniquenessField("businessName", value);
                                await handleUpdateBusinessField("businessName", value);
                              }}
                            />

                            <AdminEditableField
                              label="Categoría"
                              value={business.business.category}
                              icon={<FiBriefcase className="text-[#0D601E]" size={24} />}
                              options={
                                businessCategoryOptions.some((option) => option.value === business.business.category)
                                  ? businessCategoryOptions
                                  : [{ value: business.business.category, label: business.business.category }, ...businessCategoryOptions]
                              }
                              required
                              onSave={(value) => handleUpdateBusinessField("category", value)}
                            />

                            <AdminEditableField
                              label="Descripción"
                              value={business.business.description || ""}
                              multiline={true}
                              rows={4}
                              required
                              maxLength={500}
                              validate={(value) => (value.trim() ? null : "La descripción es obligatoria")}
                              icon={<FiFileText className="text-[#0D601E]" size={24} />}
                              onSave={(value) => handleUpdateBusinessField("description", value)}
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 }}
                          className="flex flex-col gap-4"
                        >
                          <div className="bg-[#F6F0E6] p-4 rounded-2xl">
                            <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Fecha de solicitud</p>
                            <p className="text-lg font-bold text-[#1A4D2E]">
                              {new Date(business.business.createdAt).toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>

                          <AdminEditableField
                            label="Teléfono"
                            value={business.business.phone}
                            icon={<FiPhone className="text-[#0D601E]" size={24} />}
                            inputType="tel"
                            required
                            maxLength={10}
                            normalizeValue={(value) => value.replace(/\D/g, "").slice(0, 10)}
                            validate={validatePhone}
                            onSave={async (value) => {
                              await validateUniquenessField("phone", value);
                              await handleUpdateBusinessField("phone", value);
                            }}
                          />

                          <AdminEditableLocation
                            location={business.business.location}
                            latitud={business.business.latitud}
                            longitud={business.business.longitud}
                            calle={business.business.calle}
                            numero={business.business.numero}
                            colonia={business.business.colonia}
                            codigoPostal={business.business.codigoPostal}
                            ciudad={business.business.ciudad}
                            estado={business.business.estado}
                            local={business.business.local}
                            referencias={business.business.referencias}
                            linkedLatitud={locationDraftCoords?.latitud || ""}
                            linkedLongitud={locationDraftCoords?.longitud || ""}
                            onCoordinatesChange={(lat, lng) => setLocationDraftCoords({ latitud: lat, longitud: lng })}
                            onEditModeChange={setIsEditingLocation}
                            onSave={handleUpdateLocation}
                          />

                          <AdminEditableField
                            label="Sitio web"
                            value={business.business.website || ""}
                            icon={<FiGlobe className="text-[#0D601E]" size={24} />}
                            inputType="url"
                            required
                            validate={validateURL}
                            onSave={async (value) => {
                              await validateUniquenessField("website", value);
                              await handleUpdateBusinessField("website", value);
                            }}
                          />

                          <AdminEditableField
                            label="RFC"
                            value={business.business.rfc}
                            icon={<FiBriefcase className="text-[#0D601E]" size={24} />}
                            required
                            maxLength={13}
                            normalizeValue={(value) => value.toUpperCase()}
                            validate={validateRFC}
                            onSave={async (value) => {
                              await validateUniquenessField("rfc", value);
                              await handleUpdateBusinessField("rfc", value);
                            }}
                          />
                          <AdminEditableField
                            label="Código Postal"
                            value={business.business.cp || ""}
                            icon={<FiMapPin className="text-[#0D601E]" size={24} />}
                            required
                            maxLength={5}
                            inputType="tel"
                            normalizeValue={(value) => value.replace(/\D/g, "").slice(0, 5)}
                            validate={validateCP}
                            onSave={async (value) => {
                              await validateUniquenessField("cp", value);
                              await handleUpdateBusinessField("cp", value);
                            }}
                          />
                          <AdminEditableField
                            label="Email del negocio"
                            value={business.email || ""}
                            icon={<FiMail className="text-[#0D601E]" size={24} />}
                            inputType="email"
                            required
                            validate={validateEmail}
                            onSave={async (value) => {
                              await validateUniquenessField("email", value);
                              await handleUpdateBusinessField("email", value);
                            }}
                          />
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] uppercase tracking-widest text-[#4F6757] font-black ml-2">Subcategorías / palabras clave</p>
                            {editingAdditional.subcategorias ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveAdditionalSection("subcategorias")}
                                  disabled={savingAdditionalInfo}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#0D601E] text-white disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelAdditionalSectionEdit("subcategorias")}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-[#C9D4CB] text-[#1F3528]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startAdditionalSectionEdit("subcategorias")}
                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#EEF4EF] border border-[#C9D4CB] text-[#245038]"
                                aria-label="Editar subcategorías"
                                title="Editar subcategorías"
                              >
                                <FiEdit2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="border border-[#C9D4CB] rounded-2xl p-2 bg-white min-h-[130px] flex flex-col">
                            <input
                              placeholder="Escribe subcategoría y presiona Enter"
                              className="w-full px-4 py-2 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm"
                              value={subcategoriaInput}
                              disabled={!editingAdditional.subcategorias}
                              onChange={(e) => setSubcategoriaInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (!editingAdditional.subcategorias) return;
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  addSubcategory(subcategoriaInput);
                                }
                              }}
                              onBlur={() => {
                                if (subcategoriaInput.trim()) addSubcategory(subcategoriaInput);
                              }}
                            />

                            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[38px]">
                              {draftSubcategorias.map((sub) => (
                                <span key={sub} className="inline-flex items-center gap-1 bg-[#EEF4EF] text-[#245038] border border-[#C9D4CB] px-2.5 py-1 rounded-full text-[11px] font-bold">
                                  {sub}
                                  {editingAdditional.subcategorias && (
                                    <button type="button" onClick={() => removeSubcategory(sub)} className="text-[#8B0000] font-black">
                                      x
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] uppercase tracking-widest text-[#4F6757] font-black ml-2">Rango estimado</p>
                            {editingAdditional.costoEstimado ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveAdditionalSection("costoEstimado")}
                                  disabled={savingAdditionalInfo}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#0D601E] text-white disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelAdditionalSectionEdit("costoEstimado")}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-[#C9D4CB] text-[#1F3528]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startAdditionalSectionEdit("costoEstimado")}
                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#EEF4EF] border border-[#C9D4CB] text-[#245038]"
                                aria-label="Editar rango estimado"
                                title="Editar rango estimado"
                              >
                                <FiEdit2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {COST_OPTIONS.map((option) => {
                              const isSelected = draftCostoEstimado === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={!editingAdditional.costoEstimado}
                                  onClick={() => setDraftCostoEstimado(isSelected ? "" : option.value)}
                                  className={`flex min-h-[62px] flex-col items-center justify-center rounded-2xl border px-2 py-1 text-center transition-all ${
                                    isSelected
                                      ? "border-[#0D601E] bg-[#0D601E] text-white shadow-[0_8px_18px_rgba(13,96,30,0.18)]"
                                      : "border-[#C9D4CB] bg-white text-[#1F3528] hover:border-[#8BA592]"
                                  }`}
                                >
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-white/85" : "text-[#5C7564]"}`}>{option.label}</span>
                                  <span className="mt-0.5 w-full text-center text-[13px] font-black leading-none">{option.accent}</span>
                                  <span className={`mt-0.5 w-full text-center text-[10px] font-semibold ${isSelected ? "text-white/85" : "text-[#5C7564]"}`}>{option.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] uppercase tracking-widest text-[#4F6757] font-black ml-2">Tiempo sugerido</p>
                            {editingAdditional.tiempoSugerido ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveAdditionalSection("tiempoSugerido")}
                                  disabled={savingAdditionalInfo}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#0D601E] text-white disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelAdditionalSectionEdit("tiempoSugerido")}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-[#C9D4CB] text-[#1F3528]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startAdditionalSectionEdit("tiempoSugerido")}
                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#EEF4EF] border border-[#C9D4CB] text-[#245038]"
                                aria-label="Editar tiempo sugerido"
                                title="Editar tiempo sugerido"
                              >
                                <FiEdit2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Ej. 1.5"
                              className="w-full px-4 py-2 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm pr-16"
                              value={draftTiempoSugerido}
                              disabled={!editingAdditional.tiempoSugerido}
                              onChange={(e) => setDraftTiempoSugerido(e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5C7564] font-bold">horas</span>
                          </div>
                        </div>

                        <div className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] uppercase tracking-widest text-[#4F6757] font-black ml-2">Horario</p>
                            {editingAdditional.horario ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveAdditionalSection("horario")}
                                  disabled={savingAdditionalInfo}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#0D601E] text-white disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelAdditionalSectionEdit("horario")}
                                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-[#C9D4CB] text-[#1F3528]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startAdditionalSectionEdit("horario")}
                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#EEF4EF] border border-[#C9D4CB] text-[#245038]"
                                aria-label="Editar horario"
                                title="Editar horario"
                              >
                                <FiEdit2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="border border-[#C9D4CB] rounded-2xl p-2 bg-white">
                            <div className="flex items-center gap-2 text-[#1F3528]">
                              <FiClock size={13} className="text-[#2E5A3D]" />
                              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide">
                                {activeSchedulePreview.length > 0 ? `${activeSchedulePreview.length} día(s) configurado(s)` : "Sin horario configurado"}
                              </p>
                            </div>

                            {activeSchedulePreview.length > 0 && (
                              <div className={`grid gap-1 mt-1 ${activeSchedulePreview.length === 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
                                {(activeSchedulePreview.length > 4 ? activeSchedulePreview.slice(0, 4) : activeSchedulePreview).map((item) => (
                                  <div key={item.key} className="rounded-lg border border-[#BFD0C2] bg-[#F8FBF8] px-2 py-1 min-w-0">
                                    <p className="text-[10px] md:text-[11px] font-black text-[#245038] leading-tight truncate uppercase text-center">
                                      {item.label.slice(0, 3)} {item.open.replace(":00", "")}-{item.close.replace(":00", "")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {activeSchedulePreview.length > 4 && (
                              <p className="mt-1 text-[10px] font-semibold text-[#5C7564] italic leading-tight text-center">
                                Más días: {activeSchedulePreview.slice(4).map((item) => item.label).join(" • ")}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => setIsScheduleEditorOpen(true)}
                              disabled={!editingAdditional.horario}
                              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#0A4D19] bg-[#0D601E] text-white text-[11px] md:text-[12px] font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95 shadow-[0_6px_16px_rgba(13,96,30,0.22)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiPlus size={13} />
                              Configurar Horario
                            </button>
                          </div>
                        </div>

                        {additionalInfoError && <p className="text-[11px] text-[#8B0000] mt-1 font-semibold">{additionalInfoError}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8 -mx-6 md:-mx-8 px-6 md:px-8 py-5 bg-[#F8FBF8]"
            >
              <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-[#1A4D2E]/30 to-transparent" />
              <div className="flex flex-col gap-4">
                {/* Logo - Arriba */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-4 max-w-sm"
                >
                  <AdminEditableLogo
                    logoUrl={business.business.logo}
                    businessName={business.business.name}
                    onSave={handleUpdateLogo}
                    isLoading={false}
                    onView={(url) => setSelectedImage(url)}
                  />
                </motion.div>

                {/* Galería - Debajo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <p className="text-sm text-[#4F6757] font-black uppercase tracking-wide mb-3 block">
                      Galería de imágenes ({business.business.images?.length || 0}/10)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {business.business.images?.map((image, index) => (
                        <div key={index} className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-2">
                          <AdminEditableImage
                            imageUrl={image}
                            index={index}
                            onSave={(file) => handleUpdateImage(index, file)}
                            onView={(url) => setSelectedImage(url)}
                          />
                        </div>
                      ))}
                      <div className="bg-white border border-dashed border-[#1A4D2E]/30 rounded-2xl p-2 min-h-[180px] flex items-center justify-center">
                        <AnimatePresence>
                          <AdminImageUploader
                            onUpload={handleAddImage}
                            currentImageCount={business.business.images?.length || 0}
                            maxImages={10}
                          />
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <GestionarNegocioModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMotivoRechazo("");
        }}
        onConfirm={handleConfirmarGestion}
        accion={modalAccion}
        loading={procesando}
        motivoRechazo={motivoRechazo}
        onMotivoRechazoChange={setMotivoRechazo}
      />

      <AnimatePresence>
        {isScheduleEditorOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-[760px] rounded-[28px] bg-[#F8F4EC] border border-[#1A4D2E]/20 shadow-2xl p-4 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-[#8B0000] text-xl sm:text-2xl font-black uppercase leading-none" style={{ fontFamily: "var(--font-jockey)" }}>
                    Horario del negocio
                  </h3>
                  <p className="text-[#1A4D2E] italic text-xs sm:text-sm mt-1">Configúralo por bloques y guarda los cambios.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleEditorOpen(false)}
                  className="text-gray-400 hover:text-red-500 transition-all"
                  aria-label="Cerrar editor de horario"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="rounded-2xl border border-[#1A4D2E]/15 bg-white/90 p-3 sm:p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B] mb-2">Selecciona días</p>
                  <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map((day) => {
                      const isSelected = scheduleSelection.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleScheduleSelection(day.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border transition-all ${
                            isSelected
                              ? "bg-[#0D601E] text-white border-[#0D601E]"
                              : "bg-white text-[#1A4D2E] border-[#1A4D2E]/20 hover:bg-[#F3EEE4]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="time"
                    value={bulkOpenTime}
                    disabled={!editingAdditional.horario}
                    onChange={(e) => setBulkOpenTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1A4D2E]/20 text-sm font-semibold text-[#1A4D2E] bg-white"
                  />
                  <input
                    type="time"
                    value={bulkCloseTime}
                    disabled={!editingAdditional.horario}
                    onChange={(e) => setBulkCloseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1A4D2E]/20 text-sm font-semibold text-[#1A4D2E] bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyScheduleToSelection}
                    disabled={!editingAdditional.horario}
                    className="px-4 py-2.5 rounded-full bg-[#0D601E] text-white text-xs font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aplicar
                  </button>
                </div>

                {activeSchedulePreview.length > 0 && (
                  <div className="rounded-2xl border border-[#1A4D2E]/15 bg-[#FDFBF7] p-3 sm:p-4">
                    <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B] mb-2">Días activos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeSchedulePreview.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#1A4D2E]/15 bg-white px-3 py-2"
                        >
                          <div>
                            <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B]">{item.label}</p>
                            <p className="text-sm font-bold text-[#1A4D2E]">{item.open} - {item.close}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => disableScheduleDay(item.key)}
                            disabled={!editingAdditional.horario}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-[#8B0000]/25 text-[#8B0000] font-bold hover:bg-[#8B0000]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => saveAdditionalSection("horario")}
                    disabled={!editingAdditional.horario || savingAdditionalInfo}
                    className="px-5 py-2.5 rounded-full bg-[#0D601E] text-white text-xs font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95"
                  >
                    {savingAdditionalInfo ? "Guardando..." : "Guardar horario"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para archivar negocio activo */}
      <AnimatePresence>
        {modalArchivar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              if (!procesandoAccion) {
                setModalArchivar(false);
                setMotivoArchivo("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <FiArchive className="text-gray-600" size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-800">Archivar negocio</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Puedes indicar el motivo por el cual deseas archivar este negocio (opcional). El negocio dejará de estar visible para los usuarios.
              </p>
              <textarea
                value={motivoArchivo}
                onChange={(e) => setMotivoArchivo(e.target.value)}
                placeholder="Escribe el motivo del archivado (opcional)..."
                className="w-full border border-gray-300 rounded-xl p-3 mb-4 min-h-[100px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={procesandoAccion}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleArchivarNegocio}
                  disabled={procesandoAccion}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoAccion ? "Archivando..." : "Archivar"}
                </button>
                <button
                  onClick={() => {
                    if (!procesandoAccion) {
                      setModalArchivar(false);
                      setMotivoArchivo("");
                    }
                  }}
                  disabled={procesandoAccion}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para eliminar permanentemente */}
      <AnimatePresence>
        {modalEliminar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !procesandoAccion && setModalEliminar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <FiTrash2 className="text-[#8B0000]" size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#8B0000]">Eliminar permanentemente</h3>
              </div>
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar permanentemente este negocio? 
              </p>
              <div className="bg-red-50 border-l-4 border-[#8B0000] p-4 mb-6 rounded">
                <p className="text-sm text-[#8B0000] font-semibold">
                  ?? Esta acción borrará todos los elementos de la base de datos y de Cloudinary. No se podrá deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEliminarPermanentemente}
                  disabled={procesandoAccion}
                  className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoAccion ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => !procesandoAccion && setModalEliminar(false)}
                  disabled={procesandoAccion}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resultadoMensaje && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[60] max-w-md"
          >
            <div
              className={`rounded-2xl shadow-lg p-6 border-l-4 ${
                resultadoMensaje.tipo === "exito"
                  ? "bg-[#E9F7EE] border-l-[#0D601E]"
                  : "bg-[#FDEAEA] border-l-[#8B0000]"
              }`}
            >
              <p
                className={`font-semibold ${
                  resultadoMensaje.tipo === "exito" ? "text-[#0D601E]" : "text-[#8B0000]"
                }`}
              >
                {resultadoMensaje.mensaje}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              <img src={selectedImage} alt="Imagen ampliada" className="w-full h-full object-contain rounded-2xl" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PendingDecisionPanel({
  procesando,
  modalAccion,
  onAprobar,
  onRechazar,
  compact = false,
}: {
  procesando: boolean;
  modalAccion: "aprobar" | "rechazar";
  onAprobar: () => void;
  onRechazar: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`h-full rounded-3xl border-2 border-[#1A4D2E]/18 bg-white shadow-sm flex flex-col ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#1A4D2E]/12">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-[#769C7B] mb-1">Accion administrativa</p>
          <h3 className="text-xl font-black text-[#1A4D2E]">Gestionar solicitud del negocio</h3>
          {!compact && (
            <p className="text-sm text-[#1A4D2E]/70 mt-1">Revisa la informacion y confirma si apruebas o rechazas esta solicitud.</p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={onAprobar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#0D601E] hover:bg-[#094d18] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiCheckCircle size={18} />
          {procesando && modalAccion === "aprobar" ? "Aprobando..." : "Aprobar negocio"}
        </button>

        <button
          onClick={onRechazar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#FDEAEA] hover:bg-[#FBDDDD] text-[#8B0000] font-bold py-3.5 px-6 rounded-2xl transition-all border border-[#F2A5A5] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiAlertCircle size={18} />
          {procesando && modalAccion === "rechazar" ? "Rechazando..." : "Rechazar negocio"}
        </button>
      </div>
    </div>
  );
}

function ApprovedBusinessPanel({
  procesando,
  onRegresarPendientes,
  onArchivar,
}: {
  procesando: boolean;
  onRegresarPendientes: () => void;
  onArchivar: () => void;
}) {
  return (
    <div className="h-full rounded-3xl border-2 border-[#1A4D2E]/18 bg-white shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#1A4D2E]/12">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-[#769C7B] mb-1">Acción administrativa</p>
          <h3 className="text-xl font-black text-[#1A4D2E]">Gestionar negocio activo</h3>
          <p className="text-sm text-[#4F6757] mt-1">Este negocio está activo. Puedes regresarlo a pendientes o archivarlo.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={onRegresarPendientes}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#EEF4EF] hover:bg-[#E4EFE5] text-[#1A4D2E] font-bold py-3.5 px-6 rounded-2xl transition-all border border-[#BFD0C2] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRotateCcw size={18} />
          {procesando ? "Procesando..." : "Regresar a pendientes"}
        </button>

        <button
          onClick={onArchivar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#F6F0E6] hover:bg-[#EFE5D6] text-[#1A4D2E] font-bold py-3.5 px-6 rounded-2xl transition-all border border-[#D6CDBF] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiArchive size={18} />
          {procesando ? "Procesando..." : "Archivar negocio"}
        </button>
      </div>
    </div>
  );
}

function ArchivedBusinessPanel({
  procesando,
  onDesarchivar,
  onEliminar,
}: {
  procesando: boolean;
  onDesarchivar: () => void;
  onEliminar: () => void;
}) {
  return (
    <div className="h-full rounded-3xl border-2 border-[#1A4D2E]/18 bg-white shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#1A4D2E]/12">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-[#769C7B] mb-1">Acción administrativa</p>
          <h3 className="text-xl font-black text-[#1A4D2E]">Gestionar negocio archivado</h3>
          <p className="text-sm text-[#4F6757] mt-1">Este negocio está archivado. Puedes desarchivarlo o eliminarlo permanentemente.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <button
          onClick={onDesarchivar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#0D601E] hover:bg-[#094d18] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRotateCcw size={18} />
          {procesando ? "Procesando..." : "Desarchivar"}
        </button>

        <button
          onClick={onEliminar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Eliminar permanentemente"
        >
          <FiTrash2 size={20} />
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#1A4D2E]/10 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="bg-[#0D601E]/10 p-2 rounded-full mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">{label}</p>
          <p className="text-sm font-bold text-[#1A4D2E] break-all">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">{title}</p>
          <p className="text-lg font-bold text-[#1A4D2E]">{value}</p>
          {subtitle && <p className="text-sm text-[#769C7B] mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

const LocationMap = dynamic(() => Promise.resolve(LocationMapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#F6F0E6] rounded-3xl flex items-center justify-center border border-[#1A4D2E]/10">
      <p className="text-[#769C7B] font-semibold">Cargando mapa...</p>
    </div>
  ),
});

function LocationMapComponent({
  location,
  businessName,
  latitud,
  longitud,
  editable = false,
  onLocationChange,
}: {
  location: string;
  businessName: string;
  latitud?: string | null;
  longitud?: string | null;
  editable?: boolean;
  onLocationChange?: (lat: string, lng: string) => void;
}) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (latitud && longitud) {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      if (!isNaN(lat) && !isNaN(lon)) {
        setCoordinates([lat, lon]);
        setError(false);
        setLoading(false);
        return;
      }
    }

    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoordinates([lat, lon]);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error geocoding address:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [location, latitud, longitud]);

  if (loading) {
    return (
      <div className="h-[400px] bg-[#F6F0E6] rounded-3xl flex items-center justify-center border border-[#1A4D2E]/10">
        <p className="text-[#769C7B] font-semibold">Cargando ubicación...</p>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="bg-[#F6F0E6] rounded-3xl p-6 border border-[#1A4D2E]/10">
        <div className="flex items-center gap-3 mb-3">
          <FiMapPin className="text-[#0D601E]" size={24} />
          <h4 className="font-bold text-[#1A4D2E]">Ubicación</h4>
        </div>
        <p className="text-[#1A4D2E] mb-2">{location}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="text-yellow-800 font-semibold mb-1">Mapa no disponible</p>
          <p className="text-yellow-700 text-xs">No se pudieron obtener coordenadas para mostrar esta ubicación.</p>
        </div>
      </div>
    );
  }

  if (typeof window === "undefined") return null;

  const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } = require("react-leaflet");
  const L = require("leaflet");

  const MapCenter = ({ center }: { center: [number, number] }) => {
    const map = useMap();

    useEffect(() => {
      map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);

    return null;
  };

  const MapClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
    useMapEvents({
      click(event: any) {
        if (!editable) return;
        onPick(event.latlng.lat, event.latlng.lng);
      },
    });

    return null;
  };

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-[#1A4D2E]/20">
      <MapContainer
        center={coordinates}
        zoom={15}
        style={{ height: "400px", width: "100%" }}
        scrollWheelZoom
        dragging
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={coordinates} />
        <MapClickHandler
          onPick={(lat, lng) => {
            const next: [number, number] = [lat, lng];
            setCoordinates(next);
            onLocationChange?.(lat.toFixed(6), lng.toFixed(6));
          }}
        />
        <Marker
          position={coordinates}
          draggable={editable}
          eventHandlers={{
            dragend: (event: any) => {
              if (!editable) return;
              const { lat, lng } = event.target.getLatLng();
              const next: [number, number] = [lat, lng];
              setCoordinates(next);
              onLocationChange?.(lat.toFixed(6), lng.toFixed(6));
            },
          }}
        >
          <Popup>
            <div className="text-center">
              <strong>{businessName}</strong>
              <br />
              <span className="text-sm text-gray-600">{location}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div className="bg-[#0D601E] text-white text-center py-2 text-sm font-semibold">
        {editable ? "?? Arrastra o da clic en el mapa para ajustar ubicación" : `?? ${location}`}
      </div>
    </div>
  );
}


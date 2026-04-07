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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const businessCategoryOptions = [
  { value: "Restaurante / Bar", label: "Restaurante / Bar" },
  { value: "Cafetería / Desayunos", label: "Cafetería / Desayunos" },
  { value: "Hotelería / Hostal / Airbnb", label: "Hotelería / Hostal / Airbnb" },
  { value: "Transporte / Traslados", label: "Transporte / Traslados" },
  { value: "Renta de Equipo Deportivo", label: "Renta de Equipo Deportivo" },
  { value: "Artesanías / Souvenirs", label: "Artesanías / Souvenirs" },
  { value: "Vida Nocturna / Club", label: "Vida Nocturna / Club" },
];

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
  };
  archivedReason?: string;
  archivedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string | null;
}

type SectionKey = "solicitante" | "negocio" | "galeria";

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

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
        const response = await fetch(`${BACKEND_URL}/api/business/by-id/${businessId}`, {
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
        // Redirigir según la acción: aprobados → registrados, rechazados → archivados
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
      const response = await fetch(`${BACKEND_URL}/api/admin/negocios/${business.id}/regresar-pendientes`, {
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
      const response = await fetch(`${BACKEND_URL}/api/admin/negocios/${business.id}/archivar`, {
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
      const response = await fetch(`${BACKEND_URL}/api/admin/negocios/${business.id}/desarchivar`, {
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
      const response = await fetch(`${BACKEND_URL}/api/admin/negocios/${business.id}/eliminar-permanente`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/${business.id}`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/validate-uniqueness`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/${business.id}`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/${business.id}/images`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/${business.id}/images`, {
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

    const response = await fetch(`${BACKEND_URL}/api/business/${business.id}/images`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCF9] to-[#F6F0E6] px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/admin/negocios?tab=pendientes"
          className="inline-flex items-center gap-2 text-[#0D601E] hover:text-[#094d18] font-semibold mb-6 transition-colors"
        >
          <FiArrowLeft size={20} /> Volver
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-lg overflow-hidden border border-[#1A4D2E]/10"
        >
          <div className={`border-b-4 p-8 md:p-12 ${config.bgColor}`}>
            <div className="flex justify-center mb-4">{config.icon}</div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A4D2E] mb-2 text-center" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              {business.business.name}
            </h1>
            <div className="text-center mb-4">
              <span className={`inline-block px-6 py-2 rounded-full font-bold text-sm ${config.color} bg-white/40`}>
                {config.label}
              </span>
            </div>
            <p className="text-[#1A4D2E]/70 max-w-2xl mx-auto text-center">{config.description}</p>
          </div>

          <div className="p-8 md:p-12">
            <div className={`mb-8 grid gap-6 ${hasAdministrativeActions ? "xl:grid-cols-2 xl:items-stretch" : ""}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="h-full bg-gradient-to-br from-[#F6F0E6]/50 to-[#E8F5E9]/50 rounded-3xl p-6 border border-[#1A4D2E]/10 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => toggleSection("solicitante")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-xl font-black text-[#1A4D2E]">Información del Solicitante</h3>
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
                            className="block w-full bg-white border border-[#1A4D2E]/10 rounded-2xl p-4 hover:shadow-lg hover:border-[#0D601E]/30 transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1A4D2E]/20 bg-[#F6F0E6] flex-shrink-0">
                                {owner?.fotoPerfil ? (
                                  <img src={owner.fotoPerfil} alt={ownerName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#769C7B]">
                                    <FiUser size={22} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">Propietario</p>
                                <p className="text-sm font-bold text-[#1A4D2E] break-all mb-2">{ownerName || "No disponible"}</p>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <button
                type="button"
                onClick={() => toggleSection("negocio")}
                className="w-full flex items-center justify-between text-left mb-4"
              >
                <h3 className="text-2xl font-black text-[#1A4D2E]">Información del Negocio</h3>
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
                    <div className="pt-1">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
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
                    <p className="text-xs text-[#769C7B] font-semibold uppercase mb-3 block">
                      Galería de imágenes ({business.business.images?.length || 0}/10)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {business.business.images?.map((image, index) => (
                        <AdminEditableImage
                          key={index}
                          imageUrl={image}
                          index={index}
                          onSave={(file) => handleUpdateImage(index, file)}
                          onView={(url) => setSelectedImage(url)}
                        />
                      ))}
                      <AnimatePresence>
                        <AdminImageUploader
                          onUpload={handleAddImage}
                          currentImageCount={business.business.images?.length || 0}
                          maxImages={10}
                        />
                      </AnimatePresence>
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
                  ⚠️ Esta acción borrará todos los elementos de la base de datos y de Cloudinary. No se podrá deshacer.
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
      className={`h-full mb-8 rounded-3xl border border-[#1A4D2E]/15 bg-gradient-to-br from-[#F6F0E6] via-[#FCF8F1] to-[#E8F5E9] shadow-sm flex flex-col ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
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
    <div className="h-full mb-8 rounded-3xl border border-[#1A4D2E]/15 bg-gradient-to-br from-[#E9F7EE] via-[#F0FFF4] to-[#E8F5E9] shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-[#769C7B] mb-1">Acción administrativa</p>
          <h3 className="text-xl font-black text-[#1A4D2E]">Gestionar negocio activo</h3>
          <p className="text-sm text-[#1A4D2E]/70 mt-1">Este negocio está activo. Puedes regresarlo a pendientes o archivarlo.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={onRegresarPendientes}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-[#FFF7E8] hover:bg-[#FFF3D6] text-[#B56A00] font-bold py-3.5 px-6 rounded-2xl transition-all border border-[#F2C47C] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRotateCcw size={18} />
          {procesando ? "Procesando..." : "Regresar a pendientes"}
        </button>

        <button
          onClick={onArchivar}
          disabled={procesando}
          className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-2xl transition-all border border-gray-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="h-full mb-8 rounded-3xl border border-gray-300 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-gray-500 mb-1">Acción administrativa</p>
          <h3 className="text-xl font-black text-gray-700">Gestionar negocio archivado</h3>
          <p className="text-sm text-gray-600 mt-1">Este negocio está archivado. Puedes desarchivarlo o eliminarlo permanentemente.</p>
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
        {editable ? "📍 Arrastra o da clic en el mapa para ajustar ubicación" : `📍 ${location}`}
      </div>
    </div>
  );
}


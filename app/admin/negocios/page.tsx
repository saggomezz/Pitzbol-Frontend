
"use client";
import React, { useEffect, useState } from "react";
import { editarNegocio } from "@/lib/editarNegocioApi";
import EliminarNegocioModal from "@/app/components/EliminarNegocioModal";
import { archivarNegocio } from "@/lib/adminNegociosApi";
import { gestionarNegocioPendiente } from "@/lib/gestionarNegocioApi";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaEye, FaHourglassHalf, FaArchive, FaHistory, FaStore, FaSearch, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe } from "react-icons/fa";
import { MdBusiness, MdPerson, MdCategory, MdImage } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { HiSparkles } from "react-icons/hi";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export interface Business {
  id: string;
  name: string;
  description: string;
  owner: string;
  images: string[];
  logo?: string;
  email?: string;
  phone?: string;
  category?: string;
  location?: string;
  website?: string;
  status: string;
  createdAt?: any;
  updatedAt?: any;
  ownerName?: string;
  ownerPhoto?: string;
  business?: {
    name?: string;
    description?: string;
    logo?: string;
    images?: string[];
    email?: string;
    phone?: string;
    category?: string;
    location?: string;
    website?: string;
  };
}

const AdminNegociosPage = () => {
  const [negocios, setNegocios] = useState<Business[]>([]);
  const [pendientes, setPendientes] = useState<Business[]>([]);
  const [tab, setTab] = useState<"registrados" | "pendientes" | "archivados">("registrados");
  const [archivados, setArchivados] = useState<Business[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [negocioAEliminar, setNegocioAEliminar] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [negocioAEditar, setNegocioAEditar] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const abrirModalEditar = (negocio: Business) => {
    setNegocioAEditar(negocio);
    const businessData = negocio.business || negocio;
    setEditForm({ 
      name: businessData.name || negocio.name || "", 
      description: businessData.description || negocio.description || "" 
    });
    setModalEditarOpen(true);
  };

  // Función auxiliar para obtener datos del negocio
  const getBusinessData = (negocio: Business) => {
    const business = negocio.business || negocio;
    return {
      name: business.name || negocio.name || "Sin nombre",
      description: business.description || negocio.description || "Sin descripción",
      logo: business.logo || "",
      images: Array.isArray(business.images) ? business.images.filter((img: string) => !!img) : [],
      email: business.email || negocio.email || "",
      phone: business.phone || "",
      category: business.category || "",
      location: business.location || "",
      website: business.website || "",
      owner: negocio.owner || "",
      ownerName: negocio.ownerName || "Usuario",
      ownerPhoto: negocio.ownerPhoto || "",
      status: negocio.status || "pendiente",
      createdAt: negocio.createdAt || "",
    };
  };

  // Filtrar negocios por búsqueda
  const filterBusinesses = (businesses: Business[]) => {
    if (!searchQuery) return businesses;
    return businesses.filter(neg => {
      const data = getBusinessData(neg);
      return (
        data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const currentBusinesses = filterBusinesses(
    tab === "registrados" ? negocios : tab === "pendientes" ? pendientes : archivados
  );

  const cargarNegocios = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const headers = { "Content-Type": "application/json" };
      // Registrados
      const resReg = await fetchWithAuth(`${API_BASE}/api/admin/negocios`, { headers });
      const dataReg = await resReg.json();
      setNegocios(dataReg.success ? dataReg.negocios : []);
      // Pendientes
      const resPend = await fetchWithAuth(`${API_BASE}/api/admin/negocios/pendientes`, { headers });
      const dataPend = await resPend.json();
      setPendientes(dataPend.success ? dataPend.negocios : []);
      // Archivados
      const resArch = await fetchWithAuth(`${API_BASE}/api/admin/negocios/archivados`, { headers });
      const dataArch = await resArch.json();
      setArchivados(dataArch.success ? dataArch.negocios : []);
    } catch (err) {
      setNegocios([]);
      setPendientes([]);
      setArchivados([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarNegocios();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "pendientes" || requestedTab === "registrados" || requestedTab === "archivados") {
      setTab(requestedTab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-4 rounded-2xl shadow-lg">
              <FaStore className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A4D2E] flex items-center gap-2">
                Gestionar Negocios
              </h1>
              <p className="text-gray-600 text-sm mt-1">Administra y supervisa todos los negocios registrados</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-[#0D601E]/20 text-[#0D601E] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/admin/historial-solicitudes')}
          >
            <FaHistory /> Historial
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === "registrados" 
                ? "bg-[#0D601E] text-white scale-105 shadow-lg" 
                : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
            }`}
            onClick={() => setTab("registrados")}
          >
            <FaCheckCircle /> Registrados ({negocios.length})
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === "pendientes" 
                ? "bg-[#EAB308] text-black scale-105 shadow-lg font-extrabold" 
                : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
            }`}
            onClick={() => setTab("pendientes")}
          >
            <FaHourglassHalf /> Pendientes ({pendientes.length})
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === "archivados" 
                ? "bg-gray-700 text-white scale-105 shadow-lg" 
                : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105"
            }`}
            onClick={() => setTab("archivados")}
          >
            <FaArchive /> Archivados ({archivados.length})
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar negocios por nombre, categoría o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#0D601E]/20 focus:border-[#0D601E] focus:outline-none bg-white shadow-md text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
        </motion.div>

        {/* Business Cards Grid */}
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin"></div>
              <FaStore className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
            </div>
            <p className="text-gray-600 font-medium">Cargando negocios...</p>
          </motion.div>
        ) : currentBusinesses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 flex flex-col items-center gap-4"
          >
            <div className="bg-white p-8 rounded-full shadow-lg">
              <FaStore className="text-gray-300 text-6xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No hay negocios {tab}</h3>
              <p className="text-gray-500">
                {searchQuery ? "Intenta con otra búsqueda" : "Aún no hay negocios en esta categoría"}
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {tab === "pendientes" && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] rounded-2xl border-2 border-[#0D601E]/50 shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                      <FaHourglassHalf className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">Pendientes por Aprobar</h2>
                      <p className="text-white/90 text-sm font-semibold mt-1">Tienes {pendientes.length} negocio{pendientes.length !== 1 ? 's' : ''} esperando aprobación</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                      <span className="text-white font-black text-2xl">{pendientes.length}</span>
                      <p className="text-white/80 text-xs font-semibold">Pendientes</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {currentBusinesses.map((negocio: Business, index: number) => {
                const businessData = getBusinessData(negocio);
                const isPendingCard = tab === "pendientes" || businessData.status === "pendiente" || businessData.status === "PENDING";
                
                return (
                  <motion.div
                    key={negocio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    onClick={() => {
                      router.push(`/admin/negocios/${negocio.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/admin/negocios/${negocio.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent hover:border-[#0D601E]/20 cursor-pointer"
                  >
                    {/* Business Header con Logo */}
                    <div className="relative h-32 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center overflow-hidden">
                      {businessData.logo ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={businessData.logo}
                            alt={businessData.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <MdBusiness className="text-[#0D601E]/30 text-6xl mb-2" />
                          <span className="text-xs text-gray-400 font-medium">Sin logo</span>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {businessData.status === "aprobado" && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaCheckCircle />Aprobado
                          </motion.span>
                        )}
                        {businessData.status === "pendiente" && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaHourglassHalf />Pendiente
                          </motion.span>
                        )}
                        {businessData.status === "rechazado" && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaTimesCircle />Rechazado
                          </motion.span>
                        )}
                        {businessData.status === "archivado" && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaArchive />Archivado
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Business Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-[#1A4D2E] mb-3 line-clamp-1">
                        {businessData.name}
                      </h3>
                      
                      {/* User Info - quien publicó */}
                      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200">
                        {businessData.ownerPhoto ? (
                          <Image 
                            src={businessData.ownerPhoto} 
                            alt={businessData.ownerName} 
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#0D601E]/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] flex items-center justify-center text-white font-bold text-sm">
                            {businessData.ownerName?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        <p className="text-xs font-semibold text-gray-700">{businessData.ownerName}</p>
                      </div>

                      {businessData.category && (
                        <div className="flex items-center gap-2 mb-3">
                          <MdCategory className="text-[#0D601E] text-sm" />
                          <span className="text-xs font-medium text-gray-600 bg-[#0D601E]/10 px-2 py-1 rounded-lg">
                            {businessData.category}
                          </span>
                        </div>
                      )}

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {businessData.description}
                      </p>

                      {/* Business Contact Info */}
                      <div className="space-y-2 text-xs mb-4">
                        {businessData.email && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaEnvelope className="text-[#0D601E]" />
                            <span className="truncate">{businessData.email}</span>
                          </div>
                        )}
                        {businessData.phone && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaPhone className="text-[#0D601E]" />
                            <span>{businessData.phone}</span>
                          </div>
                        )}
                        {businessData.location && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaMapMarkerAlt className="text-[#0D601E]" />
                            <span className="truncate">{businessData.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Gallery Preview */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MdImage className="text-[#0D601E]" />
                          <span className="text-xs font-semibold text-gray-600">
                            Galería {businessData.images.length > 0 ? `(${businessData.images.length})` : ""}
                          </span>
                        </div>
                        {businessData.images.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {businessData.images.slice(0, 4).map((img: string, i: number) => (
                              <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-100 hover:border-[#0D601E] transition-colors cursor-pointer shadow-sm">
                                <Image 
                                  src={img} 
                                  alt={`Imagen ${i + 1}`} 
                                  fill 
                                  className="object-cover hover:scale-110 transition-transform"
                                />
                              </div>
                            ))}
                            {businessData.images.length > 4 && (
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#0D601E]/10 flex items-center justify-center border-2 border-dashed border-[#0D601E]/30 hover:border-[#0D601E]/60 transition-colors">
                                <span className="text-xs font-bold text-[#0D601E]">+{businessData.images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <MdImage className="text-gray-300 text-3xl mx-auto mb-1" />
                              <span className="text-xs text-gray-400 font-medium">Sin imágenes</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Owner Info */}
                      {businessData.owner && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                          <MdPerson className="text-[#0D601E]" />
                          <span className="font-medium">Propietario:</span>
                          <span className="truncate">{businessData.owner}</span>
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Modal de Editar */}
        <AnimatePresence>
          {modalEditarOpen && negocioAEditar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setModalEditarOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:rotate-90 transition-all"
                  onClick={() => setModalEditarOpen(false)}
                >
                  <IoMdClose size={28} />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <FaEdit className="text-amber-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A4D2E]">Editar Negocio</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 text-sm">
                      Nombre del Negocio
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-[#0D601E] focus:outline-none transition-colors"
                      value={editForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditForm((f: typeof editForm) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Nombre del negocio"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 text-sm">
                      Descripción
                    </label>
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl p-3 min-h-[100px] focus:border-[#0D601E] focus:outline-none transition-colors resize-none"
                      value={editForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setEditForm((f: typeof editForm) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Descripción del negocio"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setModalEditarOpen(false)} 
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || '{}').uid;
                        await editarNegocio({ negocioId: negocioAEditar.id, data: editForm, adminUid });
                        setModalEditarOpen(false);
                        setNegocioAEditar(null);
                        cargarNegocios();
                      } catch (e) {
                        alert("Error al editar negocio.");
                        setLoading(false);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white font-bold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Eliminar/Archivar */}
        <EliminarNegocioModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setNegocioAEliminar(null);
          }}
          onConfirm={async (motivo: string) => {
            if (!negocioAEliminar || !negocioAEliminar.id) return;
            setLoading(true);
            try {
              const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || '{}').uid;
              await archivarNegocio({ negocioId: negocioAEliminar.id, motivo, adminUid });
              setModalOpen(false);
              setNegocioAEliminar(null);
              cargarNegocios();
            } catch (e) {
              alert("Error al archivar negocio. Intenta de nuevo.");
              setLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default AdminNegociosPage;

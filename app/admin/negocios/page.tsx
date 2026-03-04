
"use client";
import React, { useEffect, useState } from "react";
import { editarNegocio } from "@/lib/editarNegocioApi";
import EliminarNegocioModal from "@/app/components/EliminarNegocioModal";
import { archivarNegocio } from "@/lib/adminNegociosApi";
import { gestionarNegocioPendiente } from "@/lib/gestionarNegocioApi";
import { FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaEye, FaHourglassHalf, FaArchive, FaHistory } from "react-icons/fa";
import { MdBusiness, MdPerson } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface Business {
  id: string;
  name: string;
  description: string;
  owner: string;
  images: string[];
  status: string;
  createdAt?: any;
  updatedAt?: any;
}

const AdminNegociosPage = () => {
  const [negocios, setNegocios] = useState<Business[]>([]);
  const [pendientes, setPendientes] = useState<Business[]>([]);
  const [tab, setTab] = useState<"registrados" | "pendientes" | "archivados">("registrados");
  const [archivados, setArchivados] = useState<Business[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [negocioAEliminar, setNegocioAEliminar] = useState<Business | null>(null);


  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [negocioAEditar, setNegocioAEditar] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const abrirModalEditar = (negocio: Business) => {
    setNegocioAEditar(negocio);
    setEditForm({ name: negocio.name, description: negocio.description });
    setModalEditarOpen(true);
  };

  const cargarNegocios = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('pitzbol_token') || '';
      }
      // Registrados
      const resReg = await fetch(`${API_BASE}/api/admin/negocios`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      const dataReg = await resReg.json();
      setNegocios(dataReg.success ? dataReg.negocios : []);
      // Pendientes
      const resPend = await fetch(`${API_BASE}/api/admin/negocios/pendientes`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      const dataPend = await resPend.json();
      setPendientes(dataPend.success ? dataPend.negocios : []);
      // Archivados
      const resArch = await fetch(`${API_BASE}/api/admin/negocios/archivados`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
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

  return (
    <div className="min-h-screen bg-[#F8F8F5] p-0 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-[#3B5D50]">
            <MdBusiness size={36} color="#047857" /> Gestionar Negocios
          </h1>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-100 text-blue-800 font-bold shadow hover:bg-blue-200 transition text-base"
            onClick={() => router.push('/admin/historial-solicitudes')}
          >
            <FaHistory /> Historial de Solicitudes
          </button>
        </div>
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-full font-semibold shadow transition-all duration-200 ${tab === "registrados" ? "bg-emerald-700 text-white scale-105" : "bg-gray-100 text-gray-700 hover:bg-emerald-50"}`}
            onClick={() => setTab("registrados")}
          >
            <FaArchive size={18} color="#3B5D50" /> Registrados
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold shadow transition-all duration-200 ${tab === "pendientes" ? "bg-yellow-500 text-white scale-105" : "bg-gray-100 text-gray-700 hover:bg-yellow-50"}`}
            onClick={() => setTab("pendientes")}
          >
            <FaHourglassHalf size={18} color="#eab308" /> Pendientes
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold shadow transition-all duration-200 ${tab === "archivados" ? "bg-gray-700 text-white scale-105" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setTab("archivados")}
          >
            <FaArchive size={18} color="#6b7280" /> Archivados
          </button>
        </div>
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg flex flex-col items-center gap-2">
            <FaHourglassHalf size={36} color="#eab308" />
            Cargando negocios...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {(tab === "registrados" ? negocios : tab === "pendientes" ? pendientes : archivados).map((negocio: Business) => (
              <div key={negocio.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 border border-gray-100 hover:shadow-2xl transition-all relative">
                <div className="flex items-center gap-3 mb-2">
                  <MdBusiness size={24} color="#047857" />
                  <span className="font-bold text-lg text-[#3B5D50] truncate">{negocio.name}</span>
                </div>
                <div className="text-gray-700 mb-1 min-h-[40px]">{negocio.description}</div>
                {negocio.images && negocio.images.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {negocio.images.slice(0,3).map((img: string, i: number) => (
                      <Image key={i} src={img} alt="Imagen negocio" width={60} height={60} className="rounded-lg border object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs mb-1">
                  <MdPerson size={18} color="#9ca3af" />
                  <span className="font-semibold text-gray-600">Dueño:</span>
                  <span className="text-gray-800">{negocio.owner}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {negocio.status === "aprobado" && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FaCheckCircle size={14} color="#047857" />Aprobado</span>}
                  {negocio.status === "pendiente" && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FaHourglassHalf size={14} color="#eab308" />Pendiente</span>}
                  {negocio.status === "rechazado" && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FaTimesCircle size={14} color="#ea580c" />Rechazado</span>}
                  {negocio.status === "archivado" && <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FaArchive size={14} color="#6b7280" />Archivado</span>}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button 
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-all text-sm"
                    onClick={() => router.push(`/admin/negocios/${negocio.id}`)}
                  >
                    <FaEye size={16} color="#1d4ed8" />Ver
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-semibold hover:bg-yellow-100 transition-all text-sm"
                    onClick={() => abrirModalEditar(negocio)}
                  >
                    <FaEdit size={16} color="#eab308" />Editar
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-all text-sm"
                    onClick={() => {
                      setNegocioAEliminar(negocio);
                      setModalOpen(true);
                    }}
                  >
                    <FaTrash size={16} color="#dc2626" />Eliminar
                  </button>
                </div>
                {tab === "pendientes" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-200 transition-all text-sm"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || '{}').uid;
                          await gestionarNegocioPendiente({ negocioId: negocio.id, accion: "aprobar", adminUid });
                          cargarNegocios();
                        } catch (e) {
                          alert("Error al aprobar negocio.");
                          setLoading(false);
                        }
                      }}
                    >
                      <FaCheckCircle />Aprobar
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 transition-all text-sm"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const adminUid = JSON.parse(localStorage.getItem("pitzbol_user") || '{}').uid;
                          await gestionarNegocioPendiente({ negocioId: negocio.id, accion: "rechazar", adminUid });
                          cargarNegocios();
                        } catch (e) {
                          alert("Error al rechazar negocio.");
                          setLoading(false);
                        }
                      }}
                    >
                      <FaTimesCircle />Rechazar
                    </button>
                  </div>
                )}
                {/* Modal editar negocio */}
                {modalEditarOpen && negocioAEditar && negocioAEditar.id === negocio.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                      <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={() => setModalEditarOpen(false)}><IoMdClose size={24} /></button>
                      <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><FaEdit />Editar negocio</h2>
                      <label className="block mb-2 font-semibold">Nombre</label>
                      <input
                        className="w-full border rounded p-2 mb-4"
                        value={editForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm((f: typeof editForm) => ({ ...f, name: e.target.value }))}
                      />
                      <label className="block mb-2 font-semibold">Descripción</label>
                      <textarea
                        className="w-full border rounded p-2 mb-4 min-h-[60px]"
                        value={editForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm((f: typeof editForm) => ({ ...f, description: e.target.value }))}
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setModalEditarOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-700">Cancelar</button>
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
                          className="px-4 py-2 rounded bg-blue-600 text-white font-bold"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
              alert("Error al eliminar negocio. Intenta de nuevo.");
              setLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default AdminNegociosPage;

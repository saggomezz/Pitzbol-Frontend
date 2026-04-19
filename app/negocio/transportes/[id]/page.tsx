"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import TourFormModal from "@/app/components/TourFormModal";
import {
  FiArrowLeft, FiMapPin, FiPhone, FiGlobe, FiMail, FiUsers,
  FiExternalLink, FiCheckCircle, FiPlus, FiEdit2, FiSave,
  FiInstagram, FiYoutube, FiX, FiClock, FiDollarSign,
} from "react-icons/fi";
import { FaBus, FaMapMarkedAlt, FaFacebook, FaTiktok, FaWhatsapp } from "react-icons/fa";

interface ToursInfo {
  tipoVehiculo: string[];
  puntoRecogida: string;
  idiomas: string[];
  capacidad: string;
  queIncluye: string[];
  destinosRutas: string[];
}

interface RedesSociales {
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
}

interface Tour {
  id: string;
  titulo: string;
  destino: string;
  fotoPrincipal: string;
  duracion: string;
  precio: string;
  queIncluye: string[];
  idiomas: string[];
  status: string;
  createdAt: string;
}

interface EmpresaData {
  id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  telefono: string;
  website: string;
  email: string;
  logo: string;
  galeria: string[];
  subcategorias: string[];
  toursInfo: ToursInfo | null;
  horario: Record<string, any> | null;
  estado: string;
  categoria: string;
  redesSociales: RedesSociales | null;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <FiInstagram size={16} />,
  facebook: <FaFacebook size={16} />,
  tiktok: <FaTiktok size={16} />,
  whatsapp: <FaWhatsapp size={16} />,
  youtube: <FiYoutube size={16} />,
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
  whatsapp: "WhatsApp", youtube: "YouTube",
};

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  instagram: "https://instagram.com/tuempresa",
  facebook: "https://facebook.com/tuempresa",
  tiktok: "https://tiktok.com/@tuempresa",
  whatsapp: "+52 33 1234 5678",
  youtube: "https://youtube.com/@tuempresa",
};

export default function TransportesOwnerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = usePitzbolUser();
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTourForm, setShowTourForm] = useState(false);
  const [editingRedes, setEditingRedes] = useState(false);
  const [redesForm, setRedesForm] = useState<RedesSociales>({
    instagram: "", facebook: "", tiktok: "", whatsapp: "", youtube: "",
  });
  const [savingRedes, setSavingRedes] = useState(false);
  const [redesSaved, setRedesSaved] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    fetchData();
    // eslint-disable-next-line
  }, [user, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bizRes, toursRes] = await Promise.all([
        fetchWithAuth(`/api/business/by-id/${id}`),
        fetch(`/api/tours/empresa/${id}`),
      ]);
      const bizData = await bizRes.json();
      const toursData = await toursRes.json();

      if (!bizData.success || !bizData.business) {
        setError("No se encontró la empresa o no tienes acceso.");
        setLoading(false);
        return;
      }
      const b = bizData.business;
      const redes = b.business?.redesSociales || null;
      setEmpresa({
        id: b.id || id,
        nombre: b.business?.name || "",
        descripcion: b.business?.description || "",
        ubicacion: b.business?.location || "",
        telefono: b.business?.phone || "",
        website: b.business?.website || "",
        email: b.email || "",
        logo: b.business?.logo || "",
        galeria: b.business?.images || [],
        subcategorias: b.business?.subcategories || [],
        toursInfo: b.business?.toursInfo || null,
        horario: b.business?.schedule || null,
        estado: b.status || "aprobado",
        categoria: b.business?.category || "",
        redesSociales: redes,
      });
      setRedesForm(redes || { instagram: "", facebook: "", tiktok: "", whatsapp: "", youtube: "" });
      setTours(toursData.success ? (toursData.tours || []) : []);
    } catch {
      setError("Error al cargar la empresa.");
    }
    setLoading(false);
  };

  const handleSaveRedes = async () => {
    setSavingRedes(true);
    try {
      const res = await fetchWithAuth(`/api/business/transporte/redes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(redesForm),
      });
      const data = await res.json();
      if (data.success) {
        setEmpresa(e => e ? { ...e, redesSociales: redesForm } : e);
        setEditingRedes(false);
        setRedesSaved(true);
        setTimeout(() => setRedesSaved(false), 2500);
      }
    } catch {}
    setSavingRedes(false);
  };

  const handleTourPublished = (tour: Tour) => {
    setTours(prev => [tour, ...prev]);
    setShowTourForm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <p className="text-gray-500">Debes iniciar sesión para ver este perfil.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF7]">
        <p className="text-gray-500">{error || "Empresa no encontrada."}</p>
        <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
      </div>
    );
  }

  const ti = empresa.toursInfo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] pb-16">
      {showTourForm && (
        <TourFormModal
          empresaId={empresa.id}
          empresaNombre={empresa.nombre}
          onClose={() => setShowTourForm(false)}
          onSuccess={handleTourPublished}
        />
      )}

      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white">
        {empresa.logo && (
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <Image src={empresa.logo} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push("/negocio/mis-solicitudes")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <FiArrowLeft /> Mis negocios
          </button>

          <div className="flex items-center gap-5">
            {empresa.logo ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl flex-shrink-0">
                <Image src={empresa.logo} alt={empresa.nombre} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FaBus className="text-white text-3xl" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Transporte / Tours</span>
                <span className="flex items-center gap-1 text-xs text-emerald-300">
                  <FiCheckCircle size={12} /> Verificada
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight">{empresa.nombre}</h1>
              {empresa.ubicacion && (
                <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                  <FiMapPin size={12} /> {empresa.ubicacion}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Tus Tours */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1A4D2E]">
              Tus Tours publicados <span className="text-gray-400 font-normal">({tours.length})</span>
            </h2>
            <button
              onClick={() => setShowTourForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A4D2E] text-white text-xs font-bold rounded-full hover:bg-[#0D601E] transition-all shadow"
            >
              <FiPlus size={13} /> Agregar Tour
            </button>
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-10 bg-[#F6F9F6] rounded-2xl border border-dashed border-[#C9D4CB]">
              <FaBus className="text-[#C9D4CB] text-4xl mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">Aún no tienes tours publicados</p>
              <p className="text-gray-400 text-xs mt-1">Crea tu primer tour para que aparezca en la plataforma</p>
              <button
                onClick={() => setShowTourForm(true)}
                className="mt-4 px-5 py-2 bg-[#1A4D2E] text-white text-xs font-bold rounded-full hover:bg-[#0D601E] transition-all"
              >
                <FiPlus className="inline mr-1" size={11} /> Publicar primer tour
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tours.map(tour => (
                <div key={tour.id} className="rounded-2xl overflow-hidden border border-[#E0EAE1] bg-[#FAFAF7]">
                  {tour.fotoPrincipal ? (
                    <div className="relative h-32">
                      <Image src={tour.fotoPrincipal} alt={tour.titulo} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">
                        {tour.destino}
                      </span>
                    </div>
                  ) : (
                    <div className="h-32 bg-[#E8F5E9] flex items-center justify-center">
                      <FaMapMarkedAlt className="text-[#C9D4CB] text-3xl" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-bold text-[#1A4D2E] text-sm line-clamp-1">{tour.titulo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-gray-500">
                      {tour.duracion && (
                        <span className="text-[11px] flex items-center gap-1">
                          <FiClock size={10} /> {tour.duracion}
                        </span>
                      )}
                      {tour.precio && (
                        <span className="text-[11px] flex items-center gap-1">
                          <FiDollarSign size={10} /> {tour.precio}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Redes Sociales */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1A4D2E]">Redes Sociales</h2>
            {!editingRedes ? (
              <button
                onClick={() => setEditingRedes(true)}
                className="flex items-center gap-1.5 text-xs text-[#0D601E] font-semibold hover:underline"
              >
                <FiEdit2 size={12} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingRedes(false); setRedesForm(empresa.redesSociales || { instagram: "", facebook: "", tiktok: "", whatsapp: "", youtube: "" }); }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <FiX size={12} /> Cancelar
                </button>
                <button
                  onClick={handleSaveRedes}
                  disabled={savingRedes}
                  className="flex items-center gap-1 text-xs text-white bg-[#1A4D2E] px-3 py-1 rounded-full font-bold disabled:opacity-60"
                >
                  <FiSave size={11} /> {savingRedes ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}
          </div>

          {redesSaved && (
            <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
              <FiCheckCircle size={12} /> Redes guardadas correctamente
            </p>
          )}

          <div className="space-y-3">
            {(["instagram", "facebook", "tiktok", "whatsapp", "youtube"] as const).map(red => (
              <div key={red} className="flex items-center gap-3">
                <div className="w-7 flex-shrink-0 flex items-center justify-center text-[#1A4D2E]">
                  {SOCIAL_ICONS[red]}
                </div>
                {editingRedes ? (
                  <input
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#C9D4CB] focus:outline-none focus:border-[#1A4D2E]"
                    placeholder={SOCIAL_PLACEHOLDERS[red]}
                    value={redesForm[red]}
                    onChange={e => setRedesForm(f => ({ ...f, [red]: e.target.value }))}
                  />
                ) : (
                  <span className={`text-sm ${empresa.redesSociales?.[red] ? "text-gray-700" : "text-gray-300 italic"}`}>
                    {empresa.redesSociales?.[red] || `Sin ${SOCIAL_LABELS[red]}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info del servicio */}
        {ti && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10 space-y-4"
          >
            <h2 className="text-sm font-bold text-[#1A4D2E]">Información de tu servicio</h2>

            {ti.tipoVehiculo.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Tipo de vehículo</p>
                <div className="flex flex-wrap gap-2">
                  {ti.tipoVehiculo.map(v => (
                    <span key={v} className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.puntoRecogida && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Punto de recogida</p>
                <p className="text-sm text-gray-700">{ti.puntoRecogida}</p>
              </div>
            )}

            {ti.capacidad && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiUsers size={13} className="text-[#0D601E]" />
                Capacidad: <strong>{ti.capacidad}</strong>
              </div>
            )}

            {ti.idiomas.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Idiomas</p>
                <div className="flex flex-wrap gap-2">
                  {ti.idiomas.map(i => (
                    <span key={i} className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full font-medium">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.queIncluye.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">¿Qué incluye?</p>
                <div className="flex flex-wrap gap-2">
                  {ti.queIncluye.map(q => (
                    <span key={q} className="text-xs px-3 py-1 bg-[#FFF9E6] text-[#7A5000] rounded-full font-medium">{q}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.destinosRutas.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Destinos / Rutas</p>
                <div className="flex flex-wrap gap-2">
                  {ti.destinosRutas.map(d => (
                    <span key={d} className="text-xs px-3 py-1 bg-[#E3F2FD] text-[#0D47A1] rounded-full font-medium">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Contacto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-sm font-bold text-[#1A4D2E] mb-4">Contacto</h2>
          <div className="space-y-3">
            {empresa.telefono && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FiPhone className="text-[#0D601E] flex-shrink-0" />
                <span>{empresa.telefono}</span>
              </div>
            )}
            {empresa.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FiMail className="text-[#0D601E] flex-shrink-0" />
                <span>{empresa.email}</span>
              </div>
            )}
            {empresa.website && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FiGlobe className="text-[#0D601E] flex-shrink-0" />
                <a href={empresa.website} target="_blank" rel="noopener noreferrer" className="text-[#0D601E] hover:underline flex items-center gap-1">
                  {empresa.website} <FiExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ver perfil público */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <a
            href={`/empresa/transportes/${empresa.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A4D2E] text-white rounded-full font-semibold text-sm hover:bg-[#0D601E] transition-colors shadow-lg"
          >
            <FiExternalLink size={15} /> Ver perfil público de la empresa
          </a>
        </motion.div>
      </div>
    </div>
  );
}

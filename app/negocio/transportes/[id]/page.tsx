"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePitzbolUser } from "@/lib/usePitzbolUser";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  FiArrowLeft, FiMapPin, FiPhone, FiGlobe, FiMail, FiUsers,
  FiExternalLink, FiCheckCircle,
} from "react-icons/fi";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";

interface ToursInfo {
  tipoVehiculo: string[];
  puntoRecogida: string;
  idiomas: string[];
  capacidad: string;
  queIncluye: string[];
  destinosRutas: string[];
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
  horario: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
  estado: string;
  categoria: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

export default function TransportesOwnerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = usePitzbolUser();
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    fetchEmpresa();
    // eslint-disable-next-line
  }, [user, id]);

  const fetchEmpresa = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/business/by-id/${id}`);
      const data = await res.json();
      if (!data.success || !data.business) {
        setError("No se encontró la empresa o no tienes acceso.");
        setLoading(false);
        return;
      }
      const b = data.business;
      setEmpresa({
        id: b.id || id,
        nombre: b.business?.name || b.name || "",
        descripcion: b.business?.description || b.description || "",
        ubicacion: b.business?.location || b.location || "",
        telefono: b.business?.phone || b.phone || "",
        website: b.business?.website || b.website || "",
        email: b.email || b.business?.email || "",
        logo: b.business?.logo || b.logo || "",
        galeria: b.business?.images || b.images || [],
        subcategorias: b.business?.subcategories || [],
        toursInfo: b.business?.toursInfo || null,
        horario: b.business?.schedule || null,
        estado: b.status || b.estado || "aprobado",
        categoria: b.business?.category || "",
      });
    } catch {
      setError("Error al cargar la empresa.");
    }
    setLoading(false);
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

          <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-sm font-semibold text-emerald-200 mb-1">Tu empresa está verificada</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Pitzbol verificó tu empresa de transportes. Próximamente podrás publicar tus tours directamente desde este panel.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Descripción */}
        {empresa.descripcion && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-sm font-bold text-[#1A4D2E] mb-3">Sobre la empresa</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{empresa.descripcion}</p>
          </motion.div>
        )}

        {/* Info de tours */}
        {ti && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10 space-y-5"
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
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FiUsers size={11} /> Capacidad</p>
                <p className="text-sm text-gray-700">{ti.capacidad} personas</p>
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
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><FaMapMarkedAlt size={11} /> Destinos / Rutas</p>
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
          transition={{ delay: 0.1 }}
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

        {/* Galería */}
        {empresa.galeria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-sm font-bold text-[#1A4D2E] mb-4">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {empresa.galeria.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden">
                  <Image src={img} alt={`Imagen ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
            <FiExternalLink size={15} />
            Ver perfil público de la empresa
          </a>
        </motion.div>
      </div>
    </div>
  );
}

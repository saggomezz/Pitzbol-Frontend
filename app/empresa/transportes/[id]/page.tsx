"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiArrowLeft, FiMapPin, FiPhone, FiGlobe, FiMail, FiUsers, FiExternalLink } from "react-icons/fi";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";

interface ToursInfo {
  tipoVehiculo: string[];
  puntoRecogida: string;
  idiomas: string[];
  capacidad: string;
  queIncluye: string[];
  destinosRutas: string[];
}

interface EmpresaPublica {
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
}

export default function EmpresaTransportesPublicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [empresa, setEmpresa] = useState<EmpresaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/business/transporte/perfil/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.empresa) setEmpresa(data.empresa);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF7]">
        <p className="text-gray-500">Empresa no encontrada.</p>
        <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
      </div>
    );
  }

  const ti = empresa.toursInfo;
  const todasFotos = empresa.logo ? [empresa.logo, ...empresa.galeria] : empresa.galeria;

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-16">
      {/* Hero */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] overflow-hidden">
        {todasFotos[fotoIdx] && (
          <Image
            src={todasFotos[fotoIdx]}
            alt={empresa.nombre}
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors bg-black/20 px-3 py-1.5 rounded-full"
          >
            <FiArrowLeft size={14} /> Volver
          </button>
        </div>
        <div className="absolute bottom-5 left-0 right-0 px-6 text-center">
          <p className="text-white text-xl md:text-2xl font-black drop-shadow-lg">{empresa.nombre}</p>
          {empresa.ubicacion && (
            <p className="text-white/70 text-sm mt-1 flex items-center justify-center gap-1">
              <FiMapPin size={12} /> {empresa.ubicacion}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-5">

        {/* Logo + badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-md border border-[#0D601E]/10 flex items-center gap-5"
        >
          {empresa.logo ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
              <Image src={empresa.logo} alt={empresa.nombre} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <FaBus className="text-[#1A4D2E] text-2xl" />
            </div>
          )}
          <div>
            <h1 className="font-black text-[#1A4D2E] text-lg">{empresa.nombre}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[11px] bg-[#E8F5E9] text-[#1A4D2E] px-2 py-0.5 rounded-full font-semibold">Transporte / Tours</span>
              {empresa.subcategorias.slice(0, 3).map(s => (
                <span key={s} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Descripción */}
        {empresa.descripcion && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-2">Sobre nosotros</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{empresa.descripcion}</p>
          </motion.div>
        )}

        {/* Servicios / tours info */}
        {ti && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10 space-y-4"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide">Nuestros servicios</h2>

            {ti.tipoVehiculo.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Tipo de vehículo</p>
                <div className="flex flex-wrap gap-2">
                  {ti.tipoVehiculo.map(v => (
                    <span key={v} className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full font-semibold">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.capacidad && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="text-[#0D601E]" size={14} />
                <span>Capacidad: <strong>{ti.capacidad} personas</strong></span>
              </div>
            )}

            {ti.puntoRecogida && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FiMapPin className="text-[#0D601E] mt-0.5 flex-shrink-0" size={14} />
                <span>Punto de recogida: <strong>{ti.puntoRecogida}</strong></span>
              </div>
            )}

            {ti.idiomas.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Idiomas</p>
                <div className="flex flex-wrap gap-2">
                  {ti.idiomas.map(i => (
                    <span key={i} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.queIncluye.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">¿Qué incluye?</p>
                <div className="flex flex-wrap gap-2">
                  {ti.queIncluye.map(q => (
                    <span key={q} className="text-xs px-3 py-1 bg-[#FFF9E6] text-[#7A5000] rounded-full font-medium">{q}</span>
                  ))}
                </div>
              </div>
            )}

            {ti.destinosRutas.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1">
                  <FaMapMarkedAlt size={11} /> Destinos / Rutas
                </p>
                <div className="flex flex-wrap gap-2">
                  {ti.destinosRutas.map(d => (
                    <span key={d} className="text-xs px-3 py-1 bg-[#E3F2FD] text-[#0D47A1] rounded-full font-medium">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Galería */}
        {empresa.galeria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {empresa.galeria.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFotoIdx(i + (empresa.logo ? 1 : 0))}
                  className="relative aspect-video rounded-xl overflow-hidden hover:ring-2 ring-[#0D601E] transition-all"
                >
                  <Image src={img} alt={`Imagen ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contacto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Contacto</h2>
          <div className="space-y-3">
            {empresa.telefono && (
              <a href={`tel:${empresa.telefono}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0D601E] transition-colors">
                <FiPhone className="text-[#0D601E] flex-shrink-0" />
                <span>{empresa.telefono}</span>
              </a>
            )}
            {empresa.email && (
              <a href={`mailto:${empresa.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0D601E] transition-colors">
                <FiMail className="text-[#0D601E] flex-shrink-0" />
                <span>{empresa.email}</span>
              </a>
            )}
            {empresa.website && (
              <a
                href={empresa.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-[#0D601E] hover:underline"
              >
                <FiGlobe className="flex-shrink-0" />
                <span className="flex items-center gap-1">{empresa.website} <FiExternalLink size={11} /></span>
              </a>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

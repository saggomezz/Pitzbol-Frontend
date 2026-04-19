"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft, FiMapPin, FiPhone, FiGlobe, FiMail, FiUsers,
  FiExternalLink, FiClock, FiDollarSign, FiInstagram, FiYoutube,
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
  descripcion: string;
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
  redesSociales: RedesSociales | null;
  tours: Tour[];
}

const SOCIAL_CONFIG = [
  { key: "instagram", icon: <FiInstagram size={18} />, label: "Instagram", color: "hover:text-pink-500" },
  { key: "facebook", icon: <FaFacebook size={18} />, label: "Facebook", color: "hover:text-blue-600" },
  { key: "tiktok", icon: <FaTiktok size={18} />, label: "TikTok", color: "hover:text-black" },
  { key: "whatsapp", icon: <FaWhatsapp size={18} />, label: "WhatsApp", color: "hover:text-green-500" },
  { key: "youtube", icon: <FiYoutube size={18} />, label: "YouTube", color: "hover:text-red-500" },
];

function socialHref(key: string, value: string): string {
  if (key === "whatsapp") {
    const digits = value.replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  }
  return value.startsWith("http") ? value : `https://${value}`;
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
      .then(data => { if (data.success && data.empresa) setEmpresa(data.empresa); })
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
        <FaBus className="text-gray-200 text-5xl" />
        <p className="text-gray-500 font-medium">Empresa no encontrada.</p>
        <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
      </div>
    );
  }

  const ti = empresa.toursInfo;
  const heroFoto = empresa.galeria[fotoIdx] || empresa.logo || "";
  const activeRedes = SOCIAL_CONFIG.filter(s => empresa.redesSociales?.[s.key as keyof RedesSociales]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-16">
      {/* Hero */}
      <div className="relative h-60 md:h-80 bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] overflow-hidden">
        {heroFoto && (
          <Image src={heroFoto} alt={empresa.nombre} fill className="object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors bg-black/25 px-3 py-1.5 rounded-full"
          >
            <FiArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 space-y-5">

        {/* Card principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-xl border border-[#0D601E]/10"
        >
          <div className="flex items-start gap-4">
            {empresa.logo ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#E0EAE1] shadow-sm flex-shrink-0">
                <Image src={empresa.logo} alt={empresa.nombre} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                <FaBus className="text-[#1A4D2E] text-2xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-[#1A4D2E] text-xl leading-tight">{empresa.nombre}</h1>
              {empresa.ubicacion && (
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                  <FiMapPin size={11} /> {empresa.ubicacion}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] bg-[#E8F5E9] text-[#1A4D2E] px-2 py-0.5 rounded-full font-semibold">Transporte / Tours</span>
                {empresa.subcategorias.slice(0, 2).map(s => (
                  <span key={s} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          {activeRedes.length > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              {activeRedes.map(({ key, icon, label, color }) => {
                const val = empresa.redesSociales![key as keyof RedesSociales];
                return (
                  <a
                    key={key}
                    href={socialHref(key, val)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className={`text-gray-400 transition-colors ${color}`}
                  >
                    {icon}
                  </a>
                );
              })}
            </div>
          )}
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

        {/* Tours publicados */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-4">
            Nuestros Tours <span className="text-gray-400 font-normal normal-case">({empresa.tours.length})</span>
          </h2>

          {empresa.tours.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaMapMarkedAlt className="text-3xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">Próximamente publicaremos nuestros tours</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {empresa.tours.map(tour => (
                <Link
                  key={tour.id}
                  href={`/tours/${tour.id}`}
                  className="group rounded-2xl overflow-hidden border border-[#E0EAE1] hover:border-[#1A4D2E] hover:shadow-md transition-all bg-[#FAFAF7]"
                >
                  {tour.fotoPrincipal ? (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={tour.fotoPrincipal}
                        alt={tour.titulo}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-2 left-3 text-white text-[11px] font-bold drop-shadow flex items-center gap-1">
                        <FiMapPin size={10} /> {tour.destino}
                      </span>
                    </div>
                  ) : (
                    <div className="h-36 bg-[#E8F5E9] flex items-center justify-center">
                      <FaMapMarkedAlt className="text-[#C9D4CB] text-3xl" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-bold text-[#1A4D2E] text-sm line-clamp-2">{tour.titulo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-gray-400">
                      {tour.duracion && (
                        <span className="text-[11px] flex items-center gap-0.5">
                          <FiClock size={10} /> {tour.duracion}
                        </span>
                      )}
                      {tour.precio && (
                        <span className="text-[11px] flex items-center gap-0.5 text-[#0D601E] font-semibold">
                          <FiDollarSign size={10} /> {tour.precio}
                        </span>
                      )}
                    </div>
                    {tour.queIncluye?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tour.queIncluye.slice(0, 3).map(q => (
                          <span key={q} className="text-[10px] bg-[#FFF9E6] text-[#7A5000] px-2 py-0.5 rounded-full">{q}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Servicios info */}
        {ti && (ti.tipoVehiculo.length > 0 || ti.capacidad || ti.idiomas.length > 0 || ti.destinosRutas.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
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
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <FiUsers className="text-[#0D601E]" size={14} />
                Capacidad: <strong>{ti.capacidad} personas</strong>
              </p>
            )}

            {ti.puntoRecogida && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <FiMapPin className="text-[#0D601E]" size={14} />
                Recogida: <strong>{ti.puntoRecogida}</strong>
              </p>
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
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
          >
            <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {empresa.galeria.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFotoIdx(i)}
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
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#0D601E]/10"
        >
          <h2 className="text-xs font-bold text-[#1A4D2E] uppercase tracking-wide mb-3">Contacto</h2>
          <div className="space-y-3">
            {empresa.telefono && (
              <a href={`tel:${empresa.telefono}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0D601E]">
                <FiPhone className="text-[#0D601E]" /> {empresa.telefono}
              </a>
            )}
            {empresa.email && (
              <a href={`mailto:${empresa.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0D601E]">
                <FiMail className="text-[#0D601E]" /> {empresa.email}
              </a>
            )}
            {empresa.website && (
              <a href={empresa.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[#0D601E] hover:underline">
                <FiGlobe /> {empresa.website} <FiExternalLink size={11} />
              </a>
            )}
            {empresa.redesSociales?.whatsapp && (
              <a
                href={socialHref("whatsapp", empresa.redesSociales.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-emerald-600 hover:underline"
              >
                <FaWhatsapp /> Contactar por WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiCompass, FiClock, FiDollarSign, FiMapPin, FiUser } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa";
import { getBackendOrigin } from "@/lib/backendUrl";

interface Paquete {
  id: string;
  titulo: string;
  destino: string;
  fotoPrincipal: string;
  fotos?: string[];
  duracion: string;
  precio: string;
  queIncluye: string[];
  descripcion: string;
  guiaNombre: string;
  guiaFoto: string;
  guiaId: string;
  idiomas: string[];
}

const QUICK_FILTERS = ["Todos", "Tequila", "Tlaquepaque", "Tonalá", "Chapala", "Centro Histórico"];

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterDestino, setFilterDestino] = useState("Todos");

  useEffect(() => {
    const backendUrl = getBackendOrigin();
    fetch(`${backendUrl}/api/paquetes`)
      .then(r => r.json())
      .then(data => { if (data.success) setPaquetes(data.paquetes || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = paquetes.filter(paq => {
    const matchesQuery =
      !query ||
      paq.titulo.toLowerCase().includes(query.toLowerCase()) ||
      paq.destino.toLowerCase().includes(query.toLowerCase()) ||
      paq.descripcion?.toLowerCase().includes(query.toLowerCase()) ||
      paq.guiaNombre?.toLowerCase().includes(query.toLowerCase());

    const matchesFilter =
      filterDestino === "Todos" ||
      paq.destino.toLowerCase().includes(filterDestino.toLowerCase());

    return matchesQuery && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="https://res.cloudinary.com/ddgkagn4y/image/upload/v1776484529/a2_go8rka.jpg"
          alt="Paquetes Guadalajara"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D601E]/70 via-[#1A4D2E]/50 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 text-white/70 text-xs mb-3">
            <FiCompass size={12} /> Turismo • Paquetes de guías
          </div>
          <h1 className="text-white font-black text-3xl md:text-5xl leading-tight drop-shadow-lg">
            Paquetes en Guadalajara
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 max-w-md">
            Paquetes diseñados por guías locales verificados. Experiencias únicas a tu medida.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-5">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar paquete, destino, guía..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#0D601E]/15 bg-white shadow-sm focus:outline-none focus:border-[#0D601E] text-sm text-gray-700 placeholder-gray-400 transition-all"
          />
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {QUICK_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilterDestino(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterDestino === f
                  ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                  : "bg-white text-[#1A4D2E] border-[#C9D4CB] hover:border-[#1A4D2E]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Cargando paquetes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div className="bg-[#E8F5E9] p-6 rounded-full">
              <FaBoxOpen className="text-[#1A4D2E] text-4xl" />
            </div>
            <div>
              <p className="text-gray-600 font-bold text-lg">
                {paquetes.length === 0
                  ? "Próximamente habrá paquetes disponibles"
                  : "No se encontraron paquetes con ese criterio"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {paquetes.length === 0
                  ? "Los guías verificados publicarán sus paquetes aquí."
                  : "Intenta con otro destino o elimina los filtros."}
              </p>
            </div>
            {(query || filterDestino !== "Todos") && (
              <button
                onClick={() => { setQuery(""); setFilterDestino("Todos"); }}
                className="text-xs text-[#0D601E] underline mt-1"
              >
                Limpiar filtros
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4 ml-1">
              {filtered.length} paquete{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((paq, i) => (
                  <motion.div
                    key={paq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    layout
                  >
                    <Link
                      href={`/perfil/${paq.guiaId}#paquete-${paq.id}`}
                      className="group block rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#1A4D2E]/20"
                    >
                      <div className="relative h-48 overflow-hidden bg-[#E8F5E9]">
                        {(paq.fotos?.length ?? 0) > 1 ? (
                          <div className="flex gap-0.5 h-full">
                            {paq.fotos!.slice(0, 3).map((src: string, fi: number) => (
                              <div key={fi} className={`relative overflow-hidden ${fi === 0 ? "flex-[2]" : "flex-1"}`}>
                                <Image src={src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-400" />
                              </div>
                            ))}
                          </div>
                        ) : paq.fotoPrincipal ? (
                          <Image src={paq.fotoPrincipal} alt={paq.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-400" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FaBoxOpen className="text-[#C9D4CB] text-5xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                            <FiMapPin size={9} /> {paq.destino}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-[#1A4D2E] text-sm leading-snug line-clamp-2 mb-2">{paq.titulo}</h3>
                        <div className="flex items-center gap-3 mb-3">
                          {paq.duracion && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <FiClock size={10} className="text-[#0D601E]" /> {paq.duracion}
                            </span>
                          )}
                          {paq.precio && (
                            <span className="text-[11px] text-[#0D601E] font-bold flex items-center gap-1">
                              <FiDollarSign size={10} /> {paq.precio}
                            </span>
                          )}
                        </div>
                        {paq.queIncluye?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {paq.queIncluye.slice(0, 3).map(q => (
                              <span key={q} className="text-[10px] bg-[#FFF9E6] text-[#7A5000] px-2 py-0.5 rounded-full">{q}</span>
                            ))}
                            {paq.queIncluye.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{paq.queIncluye.length - 3} más</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          {paq.guiaFoto ? (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                              <Image src={paq.guiaFoto} alt={paq.guiaNombre} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                              <FiUser className="text-[#1A4D2E] text-[10px]" />
                            </div>
                          )}
                          <span className="text-[11px] text-gray-500 truncate">{paq.guiaNombre}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

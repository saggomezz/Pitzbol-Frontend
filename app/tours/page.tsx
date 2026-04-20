"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiCompass, FiClock, FiDollarSign, FiMapPin, FiFilter } from "react-icons/fi";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";

interface Tour {
  id: string;
  titulo: string;
  destino: string;
  fotoPrincipal: string;
  duracion: string;
  precio: string;
  queIncluye: string[];
  descripcion: string;
  empresaNombre: string;
  empresaLogo: string;
  empresaId: string;
  idiomas: string[];
}

const QUICK_FILTERS = ["Todos", "Tequila", "Tlaquepaque", "Tonalá", "Chapala", "Centro Histórico"];
const TIPO_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "persona", label: "Guía individual" },
  { value: "empresa", label: "Empresa" },
];

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterDestino, setFilterDestino] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("todos");

  useEffect(() => {
    fetch("/api/tours")
      .then(r => r.json())
      .then(data => { if (data.success) setTours(data.tours || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tours.filter(tour => {
    const matchesQuery =
      !query ||
      tour.titulo.toLowerCase().includes(query.toLowerCase()) ||
      tour.destino.toLowerCase().includes(query.toLowerCase()) ||
      tour.descripcion.toLowerCase().includes(query.toLowerCase()) ||
      tour.empresaNombre.toLowerCase().includes(query.toLowerCase());

    const matchesFilter =
      filterDestino === "Todos" ||
      tour.destino.toLowerCase().includes(filterDestino.toLowerCase());

    const matchesTipo =
      filterTipo === "todos" ||
      (tour as any).tipoGuia === filterTipo;

    return matchesQuery && matchesFilter && matchesTipo;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="https://res.cloudinary.com/ddgkagn4y/image/upload/v1776484529/a2_go8rka.jpg"
          alt="Tours Guadalajara"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D601E]/70 via-[#1A4D2E]/50 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 text-white/70 text-xs mb-3">
            <FiCompass size={12} /> Turismo • Recomendaciones
          </div>
          <h1 className="text-white font-black text-3xl md:text-5xl leading-tight drop-shadow-lg">
            Tours en Guadalajara
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 max-w-md">
            Descubre la ciudad y sus alrededores con tours guiados, rutas culturales y experiencias únicas.
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
            placeholder="Buscar tour, destino, empresa..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#0D601E]/15 bg-white shadow-sm focus:outline-none focus:border-[#0D601E] text-sm text-gray-700 placeholder-gray-400 transition-all"
          />
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
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

        {/* Filtro tipo guía */}
        <div className="flex gap-2 mb-6">
          {TIPO_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterTipo(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterTipo === f.value
                  ? "bg-[#F6F0E6] text-[#8B0000] border-[#8B0000]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Cargando tours...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div className="bg-[#E8F5E9] p-6 rounded-full">
              <FaBus className="text-[#1A4D2E] text-4xl" />
            </div>
            <div>
              <p className="text-gray-600 font-bold text-lg">
                {tours.length === 0
                  ? "Próximamente habrá tours disponibles"
                  : "No se encontraron tours con ese criterio"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {tours.length === 0
                  ? "Las empresas de tours verificadas publicarán sus experiencias aquí."
                  : "Intenta con otro destino o elimina los filtros."}
              </p>
            </div>
            {(query || filterDestino !== "Todos" || filterTipo !== "todos") ? (
              <button
                onClick={() => { setQuery(""); setFilterDestino("Todos"); setFilterTipo("todos"); }}
                className="text-xs text-[#0D601E] underline mt-1"
              >
                Limpiar filtros
              </button>
            ) : null}
          </motion.div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4 ml-1">
              {filtered.length} tour{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((tour, i) => (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    layout
                  >
                    <Link
                      href={`/tours/${tour.id}`}
                      className="group block rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#1A4D2E]/20"
                    >
                      {/* Imagen */}
                      <div className="relative h-48 overflow-hidden bg-[#E8F5E9]">
                        {tour.fotoPrincipal ? (
                          <Image
                            src={tour.fotoPrincipal}
                            alt={tour.titulo}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-400"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FaMapMarkedAlt className="text-[#C9D4CB] text-5xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                            <FiMapPin size={9} /> {tour.destino}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-[#1A4D2E] text-sm leading-snug line-clamp-2 mb-2">
                          {tour.titulo}
                        </h3>

                        <div className="flex items-center gap-3 mb-3">
                          {tour.duracion && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <FiClock size={10} className="text-[#0D601E]" /> {tour.duracion}
                            </span>
                          )}
                          {tour.precio && (
                            <span className="text-[11px] text-[#0D601E] font-bold flex items-center gap-1">
                              <FiDollarSign size={10} /> {tour.precio}
                            </span>
                          )}
                        </div>

                        {tour.queIncluye?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {tour.queIncluye.slice(0, 3).map(q => (
                              <span key={q} className="text-[10px] bg-[#FFF9E6] text-[#7A5000] px-2 py-0.5 rounded-full">{q}</span>
                            ))}
                            {tour.queIncluye.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{tour.queIncluye.length - 3} más</span>
                            )}
                          </div>
                        )}

                        {/* Empresa */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          {tour.empresaLogo ? (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                              <Image src={tour.empresaLogo} alt={tour.empresaNombre} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                              <FaBus className="text-[#1A4D2E] text-[10px]" />
                            </div>
                          )}
                          <span className="text-[11px] text-gray-500 truncate">{tour.empresaNombre}</span>
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

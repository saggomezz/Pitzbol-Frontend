�"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FiSearch, FiFilter, FiCompass, FiClock, FiDollarSign, FiMapPin } from "react-icons/fi";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";
import GuideCard from "../components/GuideCard";
import styles from "./tours.module.css";

// ������ Types ��������������������������������������������������������������������������������������������������������������������������������������

interface Guide {
  uid: string;
  nombre: string;
  fotoPerfil?: string;
  descripcion?: string;
  idiomas?: string[];
  especialidades?: string[];
  tarifa?: number;
  ubicacion?: string;
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
  empresaNombre: string;
  empresaLogo: string;
  empresaId: string;
  idiomas: string[];
  tipoGuia?: string;
}

// ������ Constants ��������������������������������������������������������������������������������������������������������������������������������

const QUICK_FILTERS = ["Todos", "Tequila", "Tlaquepaque", "Tonalá", "Chapala", "Centro Histórico"];
const TIPO_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "persona", label: "Guía individual" },
  { value: "empresa", label: "Empresa" },
];

// ������ Component ��������������������������������������������������������������������������������������������������������������������������������

export default function ToursPage() {
  const t = useTranslations('tours');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "paquetes" ? "paquetes" : "guias";

  const [activeTab, setActiveTab] = useState<"guias" | "paquetes">(initialTab);

  // Guides state
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  // Tours state
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterDestino, setFilterDestino] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("todos");

  // ���� Load both data sources in parallel ����������������������������������������������������������������������������
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setGuidesLoading(true);
        const res = await fetch(`/api/guides/verified?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) { setGuides([]); return; }
        const data = await res.json();
        setGuides([...(data.guides || [])]);
      } catch {
        setGuides([]);
      } finally {
        setGuidesLoading(false);
      }
    };

    const fetchTours = async () => {
      try {
        setToursLoading(true);
        const res = await fetch("/api/tours");
        const data = await res.json();
        if (data.success) setTours(data.tours || []);
      } catch {
        setTours([]);
      } finally {
        setToursLoading(false);
      }
    };

    fetchGuides();
    fetchTours();

    const handleProfileUpdate = () => setTimeout(fetchGuides, 500);
    window.addEventListener('guideProfileUpdated', handleProfileUpdate);
    window.addEventListener('authStateChanged', handleProfileUpdate);
    window.addEventListener('fotoPerfilActualizada', handleProfileUpdate);
    return () => {
      window.removeEventListener('guideProfileUpdated', handleProfileUpdate);
      window.removeEventListener('authStateChanged', handleProfileUpdate);
      window.removeEventListener('fotoPerfilActualizada', handleProfileUpdate);
    };
  }, []);

  // ���� Tab change syncs URL ����������������������������������������������������������������������������������������������������������
  const handleTabChange = (tab: "guias" | "paquetes") => {
    setActiveTab(tab);
    router.replace(`/tours?tab=${tab}`, { scroll: false });
  };

  // ���� Guide filters ������������������������������������������������������������������������������������������������������������������������
  const availableLanguages = useMemo(() => {
    const s = new Set<string>();
    guides.forEach(g => g.idiomas?.forEach(l => s.add(l)));
    return Array.from(s).sort();
  }, [guides]);

  const availableSpecialties = useMemo(() => {
    const s = new Set<string>();
    guides.forEach(g => g.especialidades?.forEach(e => s.add(e)));
    return Array.from(s).sort();
  }, [guides]);

  const filteredGuides = useMemo(() => guides.filter(g => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      g.nombre.toLowerCase().includes(q) ||
      g.descripcion?.toLowerCase().includes(q) ||
      g.idiomas?.some(l => l.toLowerCase().includes(q)) ||
      g.especialidades?.some(e => e.toLowerCase().includes(q));
    const matchesLang = selectedLanguage === "all" || g.idiomas?.includes(selectedLanguage);
    const matchesSpec = selectedSpecialty === "all" || g.especialidades?.includes(selectedSpecialty);
    return matchesSearch && matchesLang && matchesSpec;
  }), [guides, searchTerm, selectedLanguage, selectedSpecialty]);

  // ���� Tour filters ��������������������������������������������������������������������������������������������������������������������������
  const filteredTours = useMemo(() => tours.filter(tour => {
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      tour.titulo.toLowerCase().includes(q) ||
      tour.destino.toLowerCase().includes(q) ||
      tour.descripcion.toLowerCase().includes(q) ||
      tour.empresaNombre.toLowerCase().includes(q);
    const matchesFilter = filterDestino === "Todos" || tour.destino.toLowerCase().includes(filterDestino.toLowerCase());
    const matchesTipo = filterTipo === "todos" || tour.tipoGuia === filterTipo;
    return matchesQuery && matchesFilter && matchesTipo;
  }), [tours, query, filterDestino, filterTipo]);

  // ���� Render ��������������������������������������������������������������������������������������������������������������������������������������
  return (
    <div className="min-h-screen bg-[#FAFAF7]">

      {/* ���� Hero con imagen (siempre visible) ���� */}
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
            <FiCompass size={12} /> Turismo ⬢ Guadalajara
          </div>
          <h1 className="text-white font-black text-3xl md:text-5xl leading-tight drop-shadow-lg"
              style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Tours en Guadalajara
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 max-w-md">
            Descubre la ciudad con guías expertos o con tours organizados por empresas locales.
          </p>

          {/* ���� Switch de tabs ���� */}
          <div className="mt-6 flex items-center bg-white/15 backdrop-blur-sm rounded-full p-1 border border-white/25">
            <button
              onClick={() => handleTabChange("guias")}
              className={`px-7 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === "guias"
                  ? "bg-white text-[#1A4D2E] shadow-md"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Guías
            </button>
            <button
              onClick={() => handleTabChange("paquetes")}
              className={`px-7 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === "paquetes"
                  ? "bg-white text-[#1A4D2E] shadow-md"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Paquetes
            </button>
          </div>
        </div>
      </div>

      {/* ���� Contenido por tab ���� */}
      <AnimatePresence mode="wait">

        {/* PPP TAB GU�AS PPP */}
        {activeTab === "guias" && (
          <motion.div
            key="guias"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="max-w-5xl mx-auto px-4 py-8">
              {/* Buscador */}
              <div className="relative mb-5">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#0D601E]/15 bg-white shadow-sm focus:outline-none focus:border-[#0D601E] text-sm text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border bg-white text-[#1A4D2E] border-[#C9D4CB] hover:border-[#1A4D2E] transition-all outline-none cursor-pointer"
                >
                  <option value="all">{t('allLanguages')}</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <select
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border bg-white text-[#1A4D2E] border-[#C9D4CB] hover:border-[#1A4D2E] transition-all outline-none cursor-pointer"
                >
                  <option value="all">{t('allSpecialties')}</option>
                  {availableSpecialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Conteo */}
              {!guidesLoading && (
                <p className="text-xs text-gray-400 mb-4 ml-1">
                  {filteredGuides.length} {filteredGuides.length === 1 ? t('guideFound') : t('guidesFound')}
                </p>
              )}

              {/* Grid */}
              {guidesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">{t('loading')}</p>
                </div>
              ) : filteredGuides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="bg-[#E8F5E9] p-6 rounded-full">
                    <FiCompass className="text-[#1A4D2E] text-4xl" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold text-lg">{t('noGuides')}</p>
                    <p className="text-gray-400 text-sm mt-1">{t('noGuidesDescription')}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredGuides.map((guide, i) => (
                      <motion.div
                        key={guide.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04 }}
                        layout
                      >
                        <GuideCard guide={guide} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PPP TAB PAQUETES (tu interfaz) PPP */}
        {activeTab === "paquetes" && (
          <motion.div
            key="paquetes"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
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

              {/* Quick filters destino */}
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

              {/* Filtro tipo */}
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
              {toursLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Cargando paquetes...</p>
                </div>
              ) : filteredTours.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
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
                        ? "Las empresas verificadas publicarán sus experiencias aquí."
                        : "Intenta con otro destino o elimina los filtros."}
                    </p>
                  </div>
                  {(query || filterDestino !== "Todos" || filterTipo !== "todos") && (
                    <button
                      onClick={() => { setQuery(""); setFilterDestino("Todos"); setFilterTipo("todos"); }}
                      className="text-xs text-[#0D601E] underline mt-1"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-4 ml-1">
                    {filteredTours.length} tour{filteredTours.length !== 1 ? "s" : ""} disponible{filteredTours.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredTours.map((tour, i) => (
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
                              <div className="absolute bottom-3 left-3">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                                  <FiMapPin size={9} /> {tour.destino}
                                </span>
                              </div>
                            </div>

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
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

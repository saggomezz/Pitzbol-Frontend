"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiClock, FiFilter, FiHeart, FiInfo, FiMapPin, FiSearch } from "react-icons/fi";
import { getPlaceImageByCategory } from "@/lib/placeImages";
import { getMergedPlaces, getPopularityScore, matchesCategory, PlaceRecord } from "@/lib/placesApi";
import { useFavoritesSync } from "@/lib/favoritesApi";
import AdvancedFiltersModal from "@/app/components/AdvancedFiltersModal";
import PlaceRating from "@/app/components/PlaceRating";

type FilterOptions = {
  zone?: "centro" | "estadio" | "periferico" | null;
  horario?: "ahora" | "24h" | "manana" | "tarde" | "noche" | null;
  ordenar?: "cercano" | "favoritos" | "populares" | null;
  soloFavoritos?: boolean;
};

const quickFilters = ["Tradicional", "Gourmet", "Callejero", "Mercados", "Cafeterías", "Vegana", "Vida Nocturna"];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const ZONA_COORDS = {
  centro: { lat: 20.66, lng: -103.34, radiusKm: 3 },
  estadio: { lat: 20.622, lng: -103.42, radiusKm: 5 },
};

const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function GastronomiaPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        const mergedPlaces = await getMergedPlaces();
        setPlaces(mergedPlaces.filter((place) => {
          const raw = (place.rawCategoria || place.categoria).toLowerCase();
          return raw.includes("gastronomía") || raw.includes("gastronomia") || raw.includes("vegana") || raw.includes("cafeter") || raw.includes("vida nocturna");
        }));
      } catch (error) {
        console.error("Error cargando lugares de gastronomía:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (isAuthenticated()) {
          await syncLocalFavorites();
        }
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (error) {
        console.error("Error cargando favoritos de gastronomía:", error);
      }
    };

    loadFavorites();

    const handleFavoritesChanged = () => {
      loadFavorites();
    };

    window.addEventListener("favoritesChanged", handleFavoritesChanged);
    window.addEventListener("storage", handleFavoritesChanged);
    window.addEventListener("authStateChanged", handleFavoritesChanged);

    return () => {
      window.removeEventListener("favoritesChanged", handleFavoritesChanged);
      window.removeEventListener("storage", handleFavoritesChanged);
      window.removeEventListener("authStateChanged", handleFavoritesChanged);
    };
  }, [getFavorites, isAuthenticated, syncLocalFavorites]);

  const filteredPlaces = useMemo(() => {
    const term = normalizeText(searchTerm);

    const matchesQuickFilter = (place: PlaceRecord) => {
      if (!activeQuickFilter) return true;
      if (place.subcategoria) return place.subcategoria === activeQuickFilter;
      return false;
    };

    const matchesZone = (place: PlaceRecord) => {
      if (!advancedFilters.zone) return true;
      if (advancedFilters.zone === "periferico") return true;
      const lat = parseFloat(place.latitud);
      const lng = parseFloat(place.longitud);
      if (isNaN(lat) || isNaN(lng)) return true;
      const zone = ZONA_COORDS[advancedFilters.zone];
      const distancia = calcularDistancia(zone.lat, zone.lng, lat, lng);
      return distancia <= zone.radiusKm;
    };

    const matchesFavor = (place: PlaceRecord) => {
      if (!advancedFilters.soloFavoritos) return true;
      return favorites.includes(place.nombre);
    };

    let resultado = places.filter((p) => matchesQuickFilter(p) && matchesZone(p) && matchesFavor(p));

    // Aplicar búsqueda de texto
    if (term) {
      resultado = resultado.filter((place) => {
        const matchesSearch =
          normalizeText(place.nombre).includes(term) ||
          normalizeText(place.categoria).includes(term) ||
          normalizeText(place.ubicacion).includes(term) ||
          normalizeText(place.descripcion).includes(term);
        return matchesSearch;
      });
    }

    // Aplicar ordenamiento
    if (advancedFilters.ordenar === "cercano") {
      resultado.sort((a, b) => {
        const latA = parseFloat(a.latitud);
        const lngA = parseFloat(a.longitud);
        const latB = parseFloat(b.latitud);
        const lngB = parseFloat(b.longitud);
        if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) return 0;
        const center = { lat: 20.66, lng: -103.34 };
        const distA = calcularDistancia(center.lat, center.lng, latA, lngA);
        const distB = calcularDistancia(center.lat, center.lng, latB, lngB);
        return distA - distB;
      });
    } else if (advancedFilters.ordenar === "favoritos") {
      resultado.sort((a, b) => {
        const aIsFav = favorites.includes(a.nombre) ? 1 : 0;
        const bIsFav = favorites.includes(b.nombre) ? 1 : 0;
        return bIsFav - aIsFav;
      });
    } else if (advancedFilters.ordenar === "populares") {
      resultado.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    }

    return resultado;
  }, [places, searchTerm, activeQuickFilter, advancedFilters, favorites]);

  const goToPlaceDetail = (placeName: string) => {
    router.push(`/informacion/${encodeURIComponent(placeName)}`);
  };

  const handleFavoriteClick = async (placeName: string) => {
    const storedUser = localStorage.getItem("pitzbol_user");
    if (!storedUser) {
      alert("Por favor, inicia sesión para guardar favoritos.");
      return;
    }

    try {
      const updatedFavorites = favorites.includes(placeName)
        ? await removeFavoriteApi(placeName)
        : await addFavorite(placeName);

      setFavorites(updatedFavorites);
    } catch (error) {
      console.error("Error actualizando favoritos en gastronomía:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <div className="bg-[#F6F0E6]/50 px-6 md:px-8 py-2 flex items-center justify-end">
        <div className="flex items-center gap-2 text-[10px] text-[#769C7B] font-bold uppercase tracking-widest">
          <FiClock size={10} className="text-[#F00808]" /> Sabor local • Hoy abierto
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10 md:py-12 w-full">
        <section className="relative overflow-hidden rounded-[28px] md:rounded-[42px] bg-[#1A4D2E] text-white p-6 md:p-10 mb-10">
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1700"
            alt="Categoría gastronomía"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold text-[#F6F0E6]">Categoría principal</p>
            <h1 className="text-4xl md:text-6xl leading-[0.95] mt-3 mb-4" style={{ fontFamily: "var(--font-jockey)" }}>
              Gastronomía Tapatía
            </h1>
            <p className="text-sm md:text-base text-[#F6F0E6] max-w-2xl">
              Explora comida tradicional, spots gourmet, mercados locales y postres de Guadalajara.
            </p>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "var(--font-jockey)" }}>
              Rutas de Sabor
            </h2>
            <p className="text-[#769C7B] font-medium italic text-sm md:text-base">Busca por zona, tipo de comida o experiencia.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" />
              <input
                type="text"
                placeholder="Buscar mercado, restaurante, zona..."
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#F6F0E6] rounded-full outline-none focus:border-[#1A4D2E] transition-all shadow-sm text-sm text-black placeholder:text-gray-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsFilterModalOpen((prev) => !prev)} className="px-6 py-4 bg-white border border-[#F6F0E6] rounded-full text-[#1A4D2E] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-[#F6F0E6] transition-all">
              <FiFilter /> Filtros
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-start gap-5 md:gap-6">
          <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 26 }} className="w-full">
            <div className="flex flex-wrap gap-2 mb-8">
              {quickFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveQuickFilter((prev) => (prev === filter ? null : filter))}
                  className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    activeQuickFilter === filter
                      ? "bg-[#1A4D2E] border-[#1A4D2E] text-white"
                      : "bg-white border-[#F6F0E6] text-[#1A4D2E] hover:bg-[#1A4D2E] hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
              {activeQuickFilter && (
                <button
                  onClick={() => setActiveQuickFilter(null)}
                  className="px-4 py-2 rounded-full bg-[#F6F0E6] border border-[#E5DACA] text-[#1A4D2E] text-[11px] font-bold uppercase tracking-wider hover:bg-[#eadfcf] transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 ${isFilterModalOpen ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
              {loading && (
                <div className="col-span-full text-center text-[#769C7B] font-medium py-8">Cargando lugares de gastronomía...</div>
              )}

              {!loading && filteredPlaces.length === 0 && (
                <div className="col-span-full bg-white border border-[#F6F0E6] rounded-3xl p-8 text-center text-[#769C7B]">
                  No se encontraron lugares de gastronomía con ese criterio.
                </div>
              )}

              {filteredPlaces.map((place) => (
                <motion.article
                  key={place.nombre}
                  whileHover={{ y: -8 }}
                  onClick={() => goToPlaceDetail(place.nombre)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToPlaceDetail(place.nombre);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-[28px] md:rounded-[34px] overflow-hidden border border-[#F6F0E6] shadow-[0_10px_30px_rgba(26,77,46,0.05)] flex flex-col cursor-pointer"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={place.fotos?.[0] || getPlaceImageByCategory(place.categoria || "Gastronomía")}
                      alt={place.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0D601E]">
                      {place.categoria || "Gastronomía"}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleFavoriteClick(place.nombre);
                      }}
                      className="absolute top-14 right-4 p-3 bg-white/90 rounded-full shadow-lg transition-all active:scale-90"
                    >
                      <FiHeart className={favorites.includes(place.nombre) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"} size={18} />
                    </button>
                    <div className="absolute top-4 right-4 z-10 bg-white/95 border border-[#E8E8E8] rounded-full px-2 py-1 shadow-md">
                      <PlaceRating
                        placeName={place.nombre}
                        showLabel={true}
                        size="small"
                        readonly={true}
                      />
                    </div>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-[#1A4D2E] uppercase leading-tight mb-2" style={{ fontFamily: "var(--font-jockey)" }}>
                      {place.nombre}
                    </h3>
                    <p className="text-xs uppercase tracking-widest text-[#0D601E] font-bold mb-2">{place.ubicacion || "Guadalajara"}</p>
                    <div className="mb-3">
                      <p className="text-[10px] text-[#769C7B] mt-1">
                        {place.views.toLocaleString("es-MX")} vistas
                      </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#769C7B] bg-[#F6F0E6] px-3 py-1 rounded-full mb-4">
                      <FiClock size={11} /> Ruta disponible
                    </div>
                    <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">{place.descripcion || "Explora este punto gastronómico recomendado en Guadalajara."}</p>

                    <div className="flex items-center gap-2">
                      <Link href={`/mapa?lugar=${encodeURIComponent(place.nombre)}`} className="flex-1" onClick={(event) => event.stopPropagation()}>
                        <button className="w-full bg-[#1A4D2E] text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F00808] transition-colors">
                          <FiMapPin /> Ubicar
                        </button>
                      </Link>
                      <Link href={`/informacion/${encodeURIComponent(place.nombre)}`} onClick={(event) => event.stopPropagation()}>
                        <button className="p-3 bg-[#F6F0E6] rounded-full text-[#1A4D2E]/50 hover:text-[#1A4D2E] transition-colors">
                          <FiInfo size={16} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>

          <AdvancedFiltersModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
          />
        </div>
      </main>
    </div>
  );
}
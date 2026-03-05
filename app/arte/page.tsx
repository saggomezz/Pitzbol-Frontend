"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiHeart, FiInfo, FiMapPin, FiSearch, FiStar } from "react-icons/fi";
import { getPlaceImageByCategory } from "@/lib/placeImages";
import { getMergedPlaces, getPopularityScore, matchesCategory, PlaceRecord } from "@/lib/placesApi";
import { useFavoritesSync } from "@/lib/favoritesApi";
import AdvancedFiltersModal from "@/app/components/AdvancedFiltersModal";

type FilterOptions = {
  zone?: "centro" | "estadio" | "periferico" | null;
  horario?: "ahora" | "24h" | "manana" | "tarde" | "noche" | null;
  ordenar?: "cercano" | "favoritos" | "populares" | null;
  soloFavoritos?: boolean;
};

const chips = ["Museos", "Arte urbano", "Galerías", "Artesanía", "Exposiciones"];
const chipKeywords: Record<string, string[]> = {
  "Museos": ["museo", "museos", "historia", "exposicion"],
  "Arte urbano": ["urbano", "mural", "calle", "street"],
  "Galerías": ["galeria", "galerias", "exhibicion", "arte"],
  "Artesanía": ["artesania", "artesanal", "manualidades", "mercado"],
  "Exposiciones": ["exposicion", "temporal", "muestra", "coleccion"],
};

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

export default function ArtePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
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
        setPlaces(mergedPlaces.filter((place) => matchesCategory(place.categoria, "Arte")));
      } catch (error) {
        console.error("Error cargando lugares de arte:", error);
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
        console.error("Error cargando favoritos de arte:", error);
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
    const chipTerms = activeChip ? (chipKeywords[activeChip] || [activeChip]) : [];

    const matchesChip = (place: PlaceRecord) => {
      if (!chipTerms.length) return true;
      const haystack = normalizeText(`${place.nombre} ${place.categoria} ${place.ubicacion} ${place.descripcion}`);
      return chipTerms.some((chipTerm) => haystack.includes(normalizeText(chipTerm)));
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

    let resultado = places.filter((p) => matchesChip(p) && matchesZone(p) && matchesFavor(p));

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
  }, [places, searchTerm, activeChip, advancedFilters, favorites]);

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
      console.error("Error actualizando favoritos en arte:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <div className="bg-[#F6F0E6]/50 px-6 md:px-8 py-2 flex items-center justify-end">
        <div className="flex items-center gap-2 text-[10px] text-[#769C7B] font-bold uppercase tracking-widest">
          <FiStar size={10} className="text-[#F00808]" /> Ruta creativa • Guadalajara
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10 md:py-12 w-full">
        <section className="relative overflow-hidden rounded-[28px] md:rounded-[42px] bg-[#1A4D2E] text-white p-6 md:p-10 mb-10">
          <Image
            src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1700"
            alt="Categoría arte"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold text-[#F6F0E6]">Categoría principal</p>
            <h1 className="text-4xl md:text-6xl leading-[0.95] mt-3 mb-4" style={{ fontFamily: "var(--font-jockey)" }}>
              Arte en la Perla Tapatía
            </h1>
            <p className="text-sm md:text-base text-[#F6F0E6] max-w-2xl">
              Descubre museos, galerías, murales y espacios culturales con una experiencia visual cuidada, clara y fácil de explorar.
            </p>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "var(--font-jockey)" }}>
              Lugares de Arte
            </h2>
            <p className="text-[#769C7B] font-medium italic text-sm md:text-base">Selecciona, guarda favoritos y ubica al instante.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" />
              <input
                type="text"
                placeholder="Buscar museo, galería, zona..."
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
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveChip((prev) => (prev === chip ? null : chip))}
                  className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    activeChip === chip
                      ? "bg-[#1A4D2E] border-[#1A4D2E] text-white"
                      : "bg-white border-[#F6F0E6] text-[#1A4D2E] hover:bg-[#1A4D2E] hover:text-white"
                  }`}
                >
                  {chip}
                </button>
              ))}
              {activeChip && (
                <button
                  onClick={() => setActiveChip(null)}
                  className="px-4 py-2 rounded-full bg-[#F6F0E6] border border-[#E5DACA] text-[#1A4D2E] text-[11px] font-bold uppercase tracking-wider hover:bg-[#eadfcf] transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 ${isFilterModalOpen ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
              {loading && (
                <div className="col-span-full text-center text-[#769C7B] font-medium py-8">Cargando lugares de arte...</div>
              )}

              {!loading && filteredPlaces.length === 0 && (
                <div className="col-span-full bg-white border border-[#F6F0E6] rounded-3xl p-8 text-center text-[#769C7B]">
                  No se encontraron lugares de arte con ese criterio.
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
                      src={place.fotos?.[0] || getPlaceImageByCategory(place.categoria || "Arte")}
                      alt={place.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0D601E]">
                      {place.categoria || "Arte"}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleFavoriteClick(place.nombre);
                      }}
                      className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg transition-all active:scale-90"
                    >
                      <FiHeart className={favorites.includes(place.nombre) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"} size={18} />
                    </button>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="text-2xl font-black text-[#1A4D2E] uppercase leading-tight" style={{ fontFamily: "var(--font-jockey)" }}>
                        {place.nombre}
                      </h3>
                      <span className="text-[9px] px-3 py-1 rounded-full bg-[#F6F0E6] text-[#1A4D2E] font-bold uppercase tracking-widest">Recomendado</span>
                    </div>

                    <p className="text-xs uppercase tracking-widest text-[#0D601E] font-bold mb-3">{place.ubicacion || "Guadalajara"}</p>
                    <p className="text-[11px] text-[#769C7B] font-semibold mb-3">
                      Rating {place.rating.toFixed(1)} | {place.views.toLocaleString("es-MX")} vistas
                    </p>
                    <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">{place.descripcion || "Descubre este espacio artístico y cultural en Guadalajara."}</p>

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
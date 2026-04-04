"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    FiFilter,
    FiHeart,
    FiInfo,
    FiMapPin,
    FiSearch,
    FiSun
} from "react-icons/fi";
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

const quickFilters = ["Estadios", "Museos", "Fan Zone", "Históricos", "Familiar"];
const quickFilterKeywords: Record<string, string[]> = {
    "Estadios": ["estadio", "cancha", "akron", "jalisco"],
    "Museos": ["museo", "historia", "seleccion", "trofeos"],
    "Fan Zone": ["fan", "zone", "experiencia", "evento", "pantalla"],
    "Históricos": ["historico", "tradicion", "clasico", "iconico"],
    "Familiar": ["familiar", "familia", "parque", "museo", "tour"],
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

export default function FutbolPage() {
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
                setPlaces(mergedPlaces.filter((place) => matchesCategory(place.categoria, "Fútbol")));
            } catch (error) {
                console.error("Error cargando lugares de fútbol:", error);
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
                console.error("Error cargando favoritos de fútbol:", error);
            }
        };

        loadFavorites();

        const handleFavoritesChanged = (event?: Event) => {
            if (event instanceof StorageEvent) {
                const storageKey = event.key || "";
                if (storageKey && !storageKey.startsWith("pitzbol_favorites")) {
                    return;
                }
            }
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
        const quickTerms = activeQuickFilter ? (quickFilterKeywords[activeQuickFilter] || [activeQuickFilter]) : [];

        const matchesQuickFilter = (place: PlaceRecord) => {
            if (!quickTerms.length) return true;
            const haystack = normalizeText(`${place.nombre} ${place.categoria} ${place.ubicacion} ${place.descripcion}`);
            return quickTerms.some((quickTerm) => haystack.includes(normalizeText(quickTerm)));
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
    
    // Solo necesitamos saber si el usuario existe para los favoritos
    // Estos datos ahora se manejan idealmente vía context o el localStorage global
    const goToPlaceDetail = (placeName: string) => {
        router.push(`/informacion/${encodeURIComponent(placeName)}`);
    };

    const handleFavoriteClick = async (placeName: string) => {
        const storedUser = localStorage.getItem("pitzbol_user");
        if (!storedUser) {
            alert("Por favor, identifícate para guardar favoritos.");
            return;
        }

        try {
            const updatedFavorites = favorites.includes(placeName)
                ? await removeFavoriteApi(placeName)
                : await addFavorite(placeName);

            setFavorites(updatedFavorites);
        } catch (error) {
            console.error("Error actualizando favoritos en fútbol:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
            {/* EL HEADER HA SIDO ELIMINADO: Ahora lo provee layout.tsx */}

            {/* BARRA DE ESTADO RÁPIDA (Opcional, debajo del Nav global) */}
            <div className="bg-[#F6F0E6]/50 px-8 py-2 flex items-center justify-end">
                <div className="flex items-center gap-2 text-[10px] text-[#769C7B] font-bold uppercase tracking-widest">
                    <FiSun size={10} className="text-[#F00808]" /> GDL 28°C • Soleado
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-12 w-full">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-[#1A4D2E] uppercase mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>Destinos Futboleros</h2>
                        <p className="text-[#769C7B] font-medium italic">Explora los templos del fútbol en la Perla Tapatía.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" />
                            <input
                                type="text"
                                placeholder="Buscar estadio, museo..."
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

                        {/* GRID DE TARJETAS */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${isFilterModalOpen ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
                            {loading && (
                                <div className="col-span-full text-center text-[#769C7B] font-medium py-8">Cargando lugares de fútbol...</div>
                            )}

                            {!loading && filteredPlaces.length === 0 && (
                                <div className="col-span-full bg-white border border-[#F6F0E6] rounded-3xl p-8 text-center text-[#769C7B]">
                                    No se encontraron lugares de fútbol con ese criterio.
                                </div>
                            )}

                            {filteredPlaces.map((place) => (
                                <motion.div
                                    key={place.nombre}
                                    whileHover={{ y: -10 }}
                                    onClick={() => goToPlaceDetail(place.nombre)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            goToPlaceDetail(place.nombre);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className="bg-white rounded-[40px] overflow-hidden shadow-[0_10px_30px_rgba(26,77,46,0.05)] border border-[#F6F0E6] flex flex-col group cursor-pointer"
                                >
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <img
                                            src={place.fotos?.[0] || getPlaceImageByCategory(place.categoria || "Fútbol")}
                                            alt={place.nombre}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#0D601E] z-10">
                                            {place.categoria || "Fútbol"}
                                        </div>

                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleFavoriteClick(place.nombre);
                                            }}
                                            className="absolute top-14 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg z-10 transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
                                        >
                                            <FiHeart
                                                className={`transition-transform duration-200 ease-out ${favorites.includes(place.nombre) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"}`}
                                                size={18}
                                            />
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

                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-[#1A4D2E] uppercase mb-2 leading-tight" style={{ fontFamily: "var(--font-jockey)" }}>
                                            {place.nombre}
                                        </h3>
                                        <div className="mb-3">
                                            <p className="text-[10px] text-[#769C7B] mt-1">
                                                {place.views.toLocaleString("es-MX")} vistas
                                            </p>
                                        </div>
                                        <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">
                                            {place.descripcion || "Explora este destino futbolero destacado en Guadalajara."}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto gap-2">
                                            <Link href={`/mapa?lugar=${encodeURIComponent(place.nombre)}`} className="flex-1" onClick={(event) => event.stopPropagation()}>
                                                <button className="w-full bg-[#1A4D2E] text-white py-3 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F00808] transition-colors shadow-md">
                                                    <FiMapPin /> Ubicar
                                                </button>
                                            </Link>
                                            <Link href={`/informacion/${encodeURIComponent(place.nombre)}`} onClick={(event) => event.stopPropagation()}>
                                                <button className="p-3 bg-[#F6F0E6] rounded-full text-[#1A4D2E]/40 hover:text-[#1A4D2E] transition-colors">
                                                    <FiInfo size={16} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
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
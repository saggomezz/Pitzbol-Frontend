"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiHeart, FiInfo, FiMapPin, FiSearch } from "react-icons/fi";
import type { IconType } from "react-icons";
import { useFavoritesSync } from "@/lib/favoritesApi";
import { getPlaceImageByCategory } from "@/lib/placeImages";
import { getMergedPlaces, matchesCategory, PlaceRecord } from "@/lib/placesApi";

type CategoryPlacesPageProps = {
  categoryName: string;
  categoryFallbackLabel?: string;
  categoriesToMatch?: string[];
  heroImage: string;
  heroLabel: string;
  heroTitle: string;
  heroDescription: string;
  statusIcon: IconType;
  statusText: string;
  sectionTitle: string;
  sectionSubtitle: string;
  searchPlaceholder: string;
  quickFilters: string[];
  loadingText: string;
  emptyText: string;
  defaultDescription: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const matchesAnyCategory = (placeCategory: string, categories: string[]) =>
  categories.some((category) => matchesCategory(placeCategory, category));

export default function CategoryPlacesPage({
  categoryName,
  categoryFallbackLabel,
  categoriesToMatch,
  heroImage,
  heroLabel,
  heroTitle,
  heroDescription,
  statusIcon: StatusIcon,
  statusText,
  sectionTitle,
  sectionSubtitle,
  searchPlaceholder,
  quickFilters,
  loadingText,
  emptyText,
  defaultDescription,
}: CategoryPlacesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedTargets = useMemo(() => {
    const baseCategories = categoriesToMatch?.length ? categoriesToMatch : [categoryName];
    return Array.from(new Set(baseCategories.map((category) => category.trim()).filter(Boolean)));
  }, [categoriesToMatch, categoryName]);

  const {
    getFavorites,
    addFavorite,
    removeFavorite: removeFavoriteApi,
    syncLocalFavorites,
    isAuthenticated,
  } = useFavoritesSync();

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        const mergedPlaces = await getMergedPlaces();
        setPlaces(
          mergedPlaces.filter((place) => matchesAnyCategory(place.categoria, normalizedTargets))
        );
      } catch (error) {
        console.error(`Error cargando lugares de ${categoryName.toLowerCase()}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [normalizedTargets, categoryName]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (isAuthenticated()) {
          await syncLocalFavorites();
        }
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (error) {
        console.error(`Error cargando favoritos de ${categoryName.toLowerCase()}:`, error);
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
  }, [getFavorites, isAuthenticated, syncLocalFavorites, categoryName]);

  const filteredPlaces = useMemo(() => {
    const term = normalize(searchTerm);
    if (!term) return places;

    return places.filter((place) => {
      return (
        normalize(place.nombre).includes(term) ||
        normalize(place.categoria).includes(term) ||
        normalize(place.ubicacion).includes(term) ||
        normalize(place.descripcion).includes(term)
      );
    });
  }, [places, searchTerm]);

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
      console.error(`Error actualizando favoritos en ${categoryName.toLowerCase()}:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <div className="bg-[#F6F0E6]/50 px-6 md:px-8 py-2 flex items-center justify-end">
        <div className="flex items-center gap-2 text-[10px] text-[#769C7B] font-bold uppercase tracking-widest">
          <StatusIcon size={10} className="text-[#F00808]" /> {statusText}
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10 md:py-12 w-full">
        <section className="relative overflow-hidden rounded-[28px] md:rounded-[42px] bg-[#1A4D2E] text-white p-6 md:p-10 mb-10">
          <Image src={heroImage} alt={heroTitle} fill className="object-cover opacity-25" priority />
          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold text-[#F6F0E6]">{heroLabel}</p>
            <h1 className="text-4xl md:text-6xl leading-[0.95] mt-3 mb-4" style={{ fontFamily: "var(--font-jockey)" }}>
              {heroTitle}
            </h1>
            <p className="text-sm md:text-base text-[#F6F0E6] max-w-2xl">{heroDescription}</p>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "var(--font-jockey)" }}>
              {sectionTitle}
            </h2>
            <p className="text-[#769C7B] font-medium italic text-sm md:text-base">{sectionSubtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#F6F0E6] rounded-full outline-none focus:border-[#1A4D2E] transition-all shadow-sm text-sm text-black placeholder:text-gray-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-6 py-4 bg-white border border-[#F6F0E6] rounded-full text-[#1A4D2E] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-[#F6F0E6] transition-all">
              <FiFilter /> Filtros
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              className="px-4 py-2 rounded-full bg-white border border-[#F6F0E6] text-[#1A4D2E] text-[11px] font-bold uppercase tracking-wider hover:bg-[#1A4D2E] hover:text-white transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {loading && <div className="col-span-full text-center text-[#769C7B] font-medium py-8">{loadingText}</div>}

          {!loading && filteredPlaces.length === 0 && (
            <div className="col-span-full bg-white border border-[#F6F0E6] rounded-3xl p-8 text-center text-[#769C7B]">
              {emptyText}
            </div>
          )}

          {filteredPlaces.map((place) => (
            <motion.article
              key={place.nombre}
              whileHover={{ y: -8 }}
              className="bg-white rounded-[28px] md:rounded-[34px] overflow-hidden border border-[#F6F0E6] shadow-[0_10px_30px_rgba(26,77,46,0.05)] flex flex-col"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={place.fotos?.[0] || getPlaceImageByCategory(place.categoria || categoryFallbackLabel || categoryName)}
                  alt={place.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0D601E]">
                  {place.categoria || categoryFallbackLabel || categoryName}
                </span>
                <button
                  onClick={() => handleFavoriteClick(place.nombre)}
                  className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg transition-all active:scale-90"
                >
                  <FiHeart className={favorites.includes(place.nombre) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"} size={18} />
                </button>
              </div>

              <div className="p-5 md:p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-black text-[#1A4D2E] uppercase leading-tight mb-2" style={{ fontFamily: "var(--font-jockey)" }}>
                  {place.nombre}
                </h3>
                <p className="text-xs uppercase tracking-widest text-[#0D601E] font-bold mb-3">{place.ubicacion || "Guadalajara"}</p>
                <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">{place.descripcion || defaultDescription}</p>

                <div className="flex items-center gap-2">
                  <Link href="/mapa" className="flex-1">
                    <button className="w-full bg-[#1A4D2E] text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F00808] transition-colors">
                      <FiMapPin /> Ubicar
                    </button>
                  </Link>
                  <Link href={`/informacion/${encodeURIComponent(place.nombre)}`}>
                    <button className="p-3 bg-[#F6F0E6] rounded-full text-[#1A4D2E]/50 hover:text-[#1A4D2E] transition-colors">
                      <FiInfo size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}

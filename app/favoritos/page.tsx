"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiHeart, FiMapPin, FiUser, FiTrash2, FiClock } from "react-icons/fi";
import { useTranslations } from "next-intl";
import AuthModal from "../components/AuthModal";
import imglogo from "../components/logoPitzbol.png";
import { getPlaceImageUrlSync } from "@/lib/placeImages";
import { useFavoritesSync } from "@/lib/favoritesApi";
import { getMergedPlaces } from "@/lib/placesApi";
import PlaceRating from "@/app/components/PlaceRating";

interface Lugar {
  nombre: string;
  categoria: string;
  descripcion: string;
  ubicacion: string;
  latitud?: string;
  longitud?: string;
  fotos?: string[];
  views?: number;
}

const normalizePlaceName = (value: string): string =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export default function FavoritosPage() {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const t = useTranslations('favorites');
  const tAuth = useTranslations('auth');
  const { getFavorites, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  // Verificar usuario y cargar favoritos
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("pitzbol_user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    checkUser();
    window.addEventListener("authStateChanged", checkUser);
    return () => window.removeEventListener("authStateChanged", checkUser);
  }, []);

  // Cargar favoritos y datos de lugares
  useEffect(() => {
    if (user) {
      const loadFavorites = async () => {
        setLoading(true);
        
        try {
          // Sincronizar favoritos locales con el backend al cargar (solo si está autenticado)
          if (isAuthenticated()) {
            await syncLocalFavorites();
          }
          
          // Obtener favoritos (desde backend si está autenticado)
          const favoriteNames = await getFavorites();
          setFavorites(favoriteNames);
          const mergedPlaces = await getMergedPlaces();
          const mergedByNormalizedName = new Map(
            mergedPlaces.map((place) => [normalizePlaceName(place.nombre), place])
          );

          const resolvedFavorites: Lugar[] = favoriteNames.map((nombreFav) => {
            const place = mergedByNormalizedName.get(normalizePlaceName(nombreFav));

            if (!place) {
              return {
                nombre: nombreFav,
                categoria: "Sin categoría",
                descripcion: "",
                ubicacion: "",
                latitud: "",
                longitud: "",
                fotos: [],
                views: 0,
              };
            }

            return {
              nombre: place.nombre || nombreFav,
              categoria: place.categoria || "Sin categoría",
              descripcion: place.descripcion || "",
              ubicacion: place.ubicacion || "",
              latitud: place.latitud || "",
              longitud: place.longitud || "",
              fotos: Array.isArray(place.fotos) ? place.fotos : [],
              views: typeof place.views === "number" ? place.views : 0,
            };
          });

          setFavoritePlaces(resolvedFavorites);
          setLoading(false);
        } catch (error) {
          console.error("Error al cargar favoritos:", error);
          setLoading(false);
        }
      };

      loadFavorites();

      // Escuchar cambios en favoritos
      const handleStorageChange = (event: Event) => {
        if (event instanceof StorageEvent) {
          const storageKey = event.key || "";
          if (storageKey && !storageKey.startsWith("pitzbol_favorites")) {
            return;
          }
        }
        loadFavorites();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('favoritesChanged', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('favoritesChanged', handleStorageChange);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const removeFavorite = async (nombreLugar: string) => {
    try {
      // Eliminar del backend/localStorage usando la API
      // La función removeFavoriteApi ya maneja el caso de usuarios no autenticados
      const updated = await removeFavoriteApi(nombreLugar);
      setFavorites(updated);
      setFavoritePlaces(prev => prev.filter(place => place.nombre !== nombreLugar));
      
      // Mostrar feedback visual
      setToastMessage(`"${nombreLugar}" eliminado de favoritos`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      // Fallback: eliminar solo localmente si falla el backend
      const updated = favorites.filter(name => name !== nombreLugar);
      localStorage.setItem("pitzbol_favorites", JSON.stringify(updated));
      setFavorites(updated);
      setFavoritePlaces(prev => prev.filter(place => place.nombre !== nombreLugar));
      
      // Mostrar feedback incluso en fallback
      setToastMessage(`"${nombreLugar}" eliminado de favoritos`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Si no hay usuario, mostrar pantalla de login
  if (!user) {
    return (
      <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">
        <main className="flex-4 flex flex-col bottom-9 items-center justify-center p-6 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 md:p-16 rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full z-10"
          >
            <div className="bg-[#FDF2F2] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiHeart size={40} className="text-[#F00808] animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              {t('title')}
            </h2>
            
            <p className="text-[#769C7B] text-sm leading-relaxed mb-10 font-medium">
              {t('description')} <span className="text-[#F00808] font-bold">PITZBOL</span>.
            </p>

            <div className="space-y-4">
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold tracking-[0.1em] text-[14px] shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FiUser size={16} /> {t('loginButton')} <FiArrowRight />
              </button>
              <Link href="/" className="block py-2 text-[#769C7B] font-bold  text-[14px] hover:text-[#1A4D2E] transition-colors">
                {t('backHome')}
              </Link>
            </div>
          </motion.div>
        </main>

        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal 
              isOpen={isAuthOpen} 
              onClose={() => setIsAuthOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Usuario autenticado - mostrar favoritos
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] to-[#F6F0E6] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#F00808] to-[#c00606] mb-6 shadow-lg">
            <FiHeart size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Mis Favoritos
          </h1>
          <p className="text-[#769C7B] text-lg">
            {favoritePlaces.length} {favoritePlaces.length === 1 ? 'lugar guardado' : 'lugares guardados'}
          </p>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-[#F6F0E6] border-t-[#1A4D2E] rounded-full animate-spin"></div>
          </div>
        ) : favoritePlaces.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md mx-auto">
              <FiHeart size={64} className="text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#1A4D2E] mb-4">
                No tienes favoritos aún
              </h3>
              <p className="text-[#769C7B] mb-8">
                Explora el mapa y guarda tus lugares favoritos para verlos aquí
              </p>
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 bg-[#1A4D2E] text-white px-6 py-3 rounded-full font-bold hover:bg-[#0D601E] transition-all"
              >
                <FiMapPin /> Ir al Mapa
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Grid de Favoritos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritePlaces.map((place, index) => (
              <motion.article
                key={place.nombre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                onClick={() => router.push(`/informacion/${encodeURIComponent(place.nombre)}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/informacion/${encodeURIComponent(place.nombre)}`);
                  }
                }}
                role="button"
                tabIndex={0}
                className="bg-white rounded-[28px] md:rounded-[34px] overflow-hidden border border-[#F6F0E6] shadow-[0_10px_30px_rgba(26,77,46,0.05)] flex flex-col cursor-pointer"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={place.fotos?.[0] || getPlaceImageUrlSync({
                      nombre: place.nombre,
                      categoria: place.categoria,
                      ubicacion: place.ubicacion,
                      latitud: place.latitud,
                      longitud: place.longitud
                    })}
                    alt={place.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />

                  <span className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0D601E]">
                    {place.categoria || "Sin categoría"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(place.nombre);
                    }}
                    className="absolute bottom-4 right-4 z-10 p-3 bg-white/90 rounded-full shadow-lg transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
                    title="Eliminar de favoritos"
                  >
                    <FiHeart className={`${(favorites || []).some((fav) => normalizePlaceName(fav) === normalizePlaceName(place.nombre)) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"} transition-transform duration-200 ease-out`} size={18} />
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
                      {(place.views || 0).toLocaleString("es-MX")} vistas
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#769C7B] bg-[#F6F0E6] px-3 py-1 rounded-full mb-4">
                    <FiClock size={11} /> Ruta disponible
                  </div>

                  <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">{place.descripcion || "Explora este punto recomendado en Guadalajara."}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/informacion/${encodeURIComponent(place.nombre)}`}
                      className="flex-1"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button className="w-full bg-[#1A4D2E] text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F00808] transition-colors">
                        <FiArrowRight /> Ver Detalles
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Botón volver al mapa */}
        {favoritePlaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 text-[#1A4D2E] font-bold hover:text-[#0D601E] transition-colors"
            >
              <FiMapPin /> Explorar más lugares
            </Link>
          </motion.div>
        )}
      </div>

      {/* Toast de confirmación */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1A4D2E] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <FiTrash2 size={20} />
            <span className="font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
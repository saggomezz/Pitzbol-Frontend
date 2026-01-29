"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FiArrowRight, FiHeart, FiMapPin, FiUser, FiTrash2, FiExternalLink } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Papa from "papaparse";
import AuthModal from "../components/AuthModal";
import imglogo from "../components/logoPitzbol.png";
import { getPlaceImageUrlSync } from "@/lib/placeImages";
import { useFavoritesSync } from "@/lib/favoritesApi";

interface Lugar {
  nombre: string;
  categoria: string;
  descripcion: string;
  ubicacion: string;
  latitud?: string;
  longitud?: string;
}

export default function FavoritosPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('favorites');
  const tAuth = useTranslations('auth');
  const { getFavorites, removeFavorite: removeFavoriteApi, syncLocalFavorites } = useFavoritesSync();

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
          // Sincronizar favoritos locales con el backend al cargar
          await syncLocalFavorites();
          
          // Obtener favoritos (desde backend si está autenticado)
          const favoriteNames = await getFavorites();
          setFavorites(favoriteNames);

          // Cargar datos de lugares desde CSV
          const response = await fetch('/datosLugares.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const data = results.data.filter((row: any) => {
                return row && row["Nombre del Lugar"] && String(row["Nombre del Lugar"]).trim() !== "";
              });

              const allPlaces: Lugar[] = data.map((row: any) => {
                const nombre = String(row["Nombre del Lugar"] || "").trim();
                const categoria = String(row["Categoría"] || "").trim();
                const categoriaPrimera = categoria.split(",")[0].trim();
                
                return {
                  nombre,
                  categoria: categoriaPrimera,
                  descripcion: String(row["Nota para IA"] || "").trim(),
                  ubicacion: String(row["Dirección"] || "").trim(),
                  latitud: String(row["Latitud"] || "").replace(",", ".").trim(),
                  longitud: String(row["Longitud"] || "").replace(",", ".").trim(),
                };
              }).filter(lugar => lugar.nombre !== "");
              
              // Filtrar solo los lugares que están en favoritos
              const favPlaces = allPlaces.filter((lugar: Lugar) => 
                favoriteNames.includes(lugar.nombre)
              );
              
              console.log("📋 Favoritos sincronizados:", favoriteNames);
              console.log("📋 Lugares encontrados en CSV:", allPlaces.length);
              console.log("✅ Lugares favoritos encontrados:", favPlaces.length);
              
              setFavoritePlaces(favPlaces);
              setLoading(false);
            },
            error: (error: any) => {
              console.error("Error al cargar lugares:", error);
              setLoading(false);
            }
          });
        } catch (error) {
          console.error("Error al cargar favoritos:", error);
          setLoading(false);
        }
      };

      loadFavorites();

      // Escuchar cambios en favoritos
      const handleStorageChange = () => {
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
      const updated = await removeFavoriteApi(nombreLugar);
      setFavorites(updated);
      setFavoritePlaces(prev => prev.filter(place => place.nombre !== nombreLugar));
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      // Fallback: eliminar solo localmente si falla el backend
      const updated = favorites.filter(name => name !== nombreLugar);
      localStorage.setItem("pitzbol_favorites", JSON.stringify(updated));
      setFavorites(updated);
      setFavoritePlaces(prev => prev.filter(place => place.nombre !== nombreLugar));
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
              <motion.div
                key={place.nombre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Imagen */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1A4D2E] to-[#0D601E]">
                  <img
                    src={getPlaceImageUrlSync({
                      nombre: place.nombre,
                      categoria: place.categoria,
                      ubicacion: place.ubicacion,
                      latitud: place.latitud,
                      longitud: place.longitud
                    })}
                    alt={place.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Botón eliminar */}
                  <button
                    onClick={() => removeFavorite(place.nombre)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Eliminar de favoritos"
                  >
                    <FiTrash2 size={18} />
                  </button>

                  {/* Categoría badge */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1A4D2E]">
                    {place.categoria}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#1A4D2E] mb-2 line-clamp-1">
                    {place.nombre}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[#769C7B] text-sm mb-3">
                    <FiMapPin size={16} />
                    <span className="line-clamp-1">{place.ubicacion}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {place.descripcion}
                  </p>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Link
                      href={`/informacion/${encodeURIComponent(place.nombre)}`}
                      className="flex-1 bg-[#1A4D2E] text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-[#0D601E] transition-all flex items-center justify-center gap-2"
                    >
                      Ver Detalles <FiExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
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
    </div>
  );
}
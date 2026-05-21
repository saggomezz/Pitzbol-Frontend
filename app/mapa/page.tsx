"use client";

/*
 * MAPA DE LUGARES - PITZBOL
 * 
 * IMPLEMENTACIÓN ACTUAL:
 * - Utiliza LEAFLET (Open Source) - No requiere API key
 * - Permite marcadores interactivos, tooltips y popups
 * - Completamente funcional y gratuito
 * 
 * CARACTERÍSTICAS IMPLEMENTADAS:
 * ✅ Marcadores rojos personalizados para cada lugar
 * ✅ Tooltip al hacer hover mostrando nombre del lugar
 * ✅ Click en marcador para ver información completa
 * ✅ Filtrado por categoría actualiza marcadores en tiempo real
 * ✅ Selección desde lista sincroniza con mapa
 * ✅ Zoom automático a ubicación seleccionada
 * 
 * MEJORA FUTURA CON GOOGLE MAPS API (cuando tengas API key):
 * - Obtener API key en: https://console.cloud.google.com/
 * - Habilitar "Maps JavaScript API" y "Places API"
 * - Instalar: npm install @googlemaps/js-api-loader
 * - Reemplazar Leaflet con Google Maps para:
 *   • Street View integration
 *   • Mejores datos de ubicación
 *   • Integración con Google Places
 *   • Mejor geocoding
 * 
 * INTEGRACIÓN CON BACKEND:
 * - Actualmente carga datos desde CSV local (/datosLugares.csv)
 * - Para producción, reemplazar con:
 *   fetch('http://tu-backend-url/api/lugares')
 */

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { 
    FiMapPin, 
    FiSearch, 
    FiHeart, 
    FiMaximize2, 
    FiMinimize2,
    FiTrendingUp,
    FiDollarSign,
    FiActivity,
    FiChevronDown,
    FiNavigation,
    FiExternalLink,
    FiChevronLeft,
    FiChevronRight
} from "react-icons/fi";
import {
    GiSoccerBall,
    GiForkKnifeSpoon,
    GiGreekTemple,
    GiPartyFlags,
    GiHospitalCross,
    GiMartini
} from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { MAP_FILTER_ALIASES } from "@/lib/categories";
import "leaflet/dist/leaflet.css";
import styles from "./mapa.module.css";
import { getPlaceImageUrlSync, getPlaceImageByCategory } from "@/lib/placeImages";
import { getMergedPlaces } from "@/lib/placesApi";
import { useFavoritesSync } from "@/lib/favoritesApi";
import PlaceRating from "@/app/components/PlaceRating";

interface Lugar {
    nombre: string;
    categoria: string;
    categorias?: string[];
    descripcion: string;
    ubicacion: string;
    imagen?: string;
    fotos?: string[];
    latitud?: string;
    longitud?: string;
    views?: number;
}

// Componente de carrusel de imágenes para el info box
function PlaceImageCarousel({ 
    selectedPlace, 
    placeImages, 
    placeAllPhotos,
    getPlaceImageUrlSync,
    favorites,
    toggleFavorite
}: {
    selectedPlace: Lugar;
    placeImages: Record<string, string>;
    placeAllPhotos: Record<string, string[]>;
    getPlaceImageUrlSync: (options: any) => string;
    favorites: string[];
    toggleFavorite: (e: React.MouseEvent, nombre: string) => void;
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Obtener todas las fotos disponibles para este lugar
    const allPhotos = placeAllPhotos[selectedPlace.nombre] || [];
    const hasMultiplePhotos = allPhotos.length > 1;
    
    // Si no hay fotos guardadas, usar la imagen por categoría
    const images = hasMultiplePhotos 
        ? allPhotos 
        : [placeImages[selectedPlace.nombre] || getPlaceImageUrlSync({
            nombre: selectedPlace.nombre,
            categoria: selectedPlace.categoria,
            ubicacion: selectedPlace.ubicacion,
            latitud: selectedPlace.latitud,
            longitud: selectedPlace.longitud
        })];
    
    // Resetear índice cuando cambia el lugar
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [selectedPlace.nombre]);
    
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };
    
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    
    return (
        <div className={styles.infoImage} style={{ position: 'relative' }}>
            <img
                src={images[currentImageIndex]}
                alt={selectedPlace.nombre}
                loading="lazy"
                onError={(e) => {
                    // Fallback si la imagen falla al cargar
                    (e.target as HTMLImageElement).src = getPlaceImageUrlSync({
                        nombre: selectedPlace.nombre,
                        categoria: selectedPlace.categoria,
                        ubicacion: selectedPlace.ubicacion,
                        latitud: selectedPlace.latitud,
                        longitud: selectedPlace.longitud
                    });
                }}
            />
            
            {/* Botones de navegación del carrusel (solo si hay más de una foto) */}
            {hasMultiplePhotos && (
                <>
                    <button
                        onClick={prevImage}
                        className={styles.carouselButton}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 15,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'white';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.9)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
                        }}
                    >
                        <FiChevronLeft size={20} color="#1A4D2E" />
                    </button>
                    
                    <button
                        onClick={nextImage}
                        className={styles.carouselButton}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 15,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'white';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.9)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
                        }}
                    >
                        <FiChevronRight size={20} color="#1A4D2E" />
                    </button>
                    
                    {/* Indicadores de posición (puntos en la parte inferior) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '6px',
                            zIndex: 15
                        }}
                    >
                        {images.map((_, index) => (
                            <div
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(index);
                                }}
                                style={{
                                    width: currentImageIndex === index ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: currentImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
            
            <div className={styles.imageOverlay}></div>
            <div className={styles.categoryBadgeOverlay}>
                {selectedPlace.categoria}
            </div>
            
            {/* Botón de favoritos overlay */}
            <motion.button 
                className={`${styles.favoriteButtonOverlay} ${
                    favorites.includes(selectedPlace.nombre) ? styles.active : ""
                }`}
                onClick={(e) => toggleFavorite(e, selectedPlace.nombre)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                animate={{ 
                    scale: favorites.includes(selectedPlace.nombre) ? [1, 1.25, 1] : 1,
                    rotate: favorites.includes(selectedPlace.nombre) ? [0, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.4 }}
                title={favorites.includes(selectedPlace.nombre) ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
                <FiHeart 
                    fill={favorites.includes(selectedPlace.nombre) ? "currentColor" : "none"}
                />
            </motion.button>
        </div>
    );
}

// Importar componente de mapa dinámicamente para evitar problemas con SSR
const MapComponent = dynamic(
    () => import("./MapComponent").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e0e0e0",
                    borderRadius: "20px",
                }}
            >
                <p style={{ color: "#769C7B", fontWeight: 600 }}>Cargando mapa...</p>
            </div>
        ),
    }
);

export default function MapaPage() {
    const router = useRouter();
    const [lugares, setLugares] = useState<Lugar[]>([]);
    const [filteredLugares, setFilteredLugares] = useState<Lugar[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("Todos Los Lugares");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [filtersExpanded, setFiltersExpanded] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([20.6597, -103.3496]); // Guadalajara
    const [mapZoom, setMapZoom] = useState(12);
    const [showFavoriteToast, setShowFavoriteToast] = useState(false);
    const [favoriteToastMessage, setFavoriteToastMessage] = useState("");
    const [placeImages, setPlaceImages] = useState<Record<string, string>>({});
    const [placeAllPhotos, setPlaceAllPhotos] = useState<Record<string, string[]>>({}); // Todas las fotos para el carrusel
    
    const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

    const categories = [
        { name: "Todos Los Lugares", icon: FiMapPin },
        { name: "Más Populares", icon: FiTrendingUp },
        { name: "Fútbol", icon: GiSoccerBall },
        { name: "Gastronomía", icon: GiForkKnifeSpoon },
        { name: "Cultura", icon: GiGreekTemple },
        { name: "Eventos", icon: GiPartyFlags },
        { name: "Clubs", icon: GiMartini },
        { name: "Casas de Cambio", icon: FiDollarSign },
        { name: "Hospitales", icon: GiHospitalCross },
    ];

    const normalizeText = (value: string) =>
        value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    // Aliases generados desde la taxonomía centralizada
    const CATEGORY_FILTER_ALIASES = MAP_FILTER_ALIASES;

    useEffect(() => {
        const loadInitialData = async () => {
            // Cargar favoritos sincronizados solo si está autenticado
            try {
                if (isAuthenticated()) {
                    await syncLocalFavorites();
                }
                const favs = await getFavorites();
                setFavorites(favs);
            } catch (error) {
                console.error("Error al cargar favoritos:", error);
                // Fallback a localStorage
                const storedFavorites = localStorage.getItem("pitzbol_favorites");
                if (storedFavorites) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            }
        };
        
        loadInitialData();

        fetch("/datosLugares.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: false, // Mantener todo como string
                    complete: (results) => {
                        console.log("📊 CSV parseado - Total filas:", results.data.length);
                        
                        const data = results.data.filter((row: any) => {
                            const tieneNombre = row && row["Nombre del Lugar"] && String(row["Nombre del Lugar"]).trim() !== "";
                            if (!tieneNombre && row) {
                                console.warn("⚠️ Fila sin nombre válido:", row);
                            }
                            return tieneNombre;
                        });
                        
                        console.log("📊 Filas con nombre válido:", data.length);

                        const parsed: Lugar[] = data.map((row: any) => {
                            const nombre = String(row["Nombre del Lugar"] || "").trim();
                            const categoriaRaw = String(row["Categoría"] || "").trim();
                            const categorias = categoriaRaw
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean);

                            return {
                                nombre,
                                categoria: categorias[0] || categoriaRaw || "Cultura",
                                categorias,
                                descripcion: String(row["Nota para IA"] || row["Subcategoría"] || "").trim(),
                                ubicacion: String(row["Dirección"] || "").trim(),
                                latitud: String(row["Latitud"] || "").replace(",", ".").trim(),
                                longitud: String(row["Longitud"] || "").replace(",", ".").trim(),
                                views: Number(String(row["Views"] || row["Vistas"] || "0").replace(",", ".").trim()) || 0,
                            };
                        }).filter(lugar => lugar.nombre !== ""); // Filtrar lugares vacíos
                        
                        console.log("✅ Lugares parseados:", parsed.length);
                        console.log("📋 Primeros 3 lugares:", parsed.slice(0, 3));
                        
                        // Generar imágenes iniciales (por categoría como fallback)
                        const initialImages: Record<string, string> = {};
                        parsed.forEach((lugar: Lugar) => {
                            initialImages[lugar.nombre] = getPlaceImageUrlSync({
                                nombre: lugar.nombre,
                                categoria: lugar.categoria,
                                ubicacion: lugar.ubicacion,
                                latitud: lugar.latitud,
                                longitud: lugar.longitud
                            });
                        });
                        setPlaceImages(initialImages);
                        
                        // Guardar lugares del CSV temporalmente
                        const lugaresCSV = parsed;
                        
                        // Establecer lugares iniciales del CSV para que se muestren aunque falle el API
                        const lugaresInicialesConViews = lugaresCSV.map((lugar) => ({
                            ...lugar,
                            views: typeof lugar.views === 'number' ? lugar.views : 0,
                        }));
                        setLugares(lugaresInicialesConViews);
                        setFilteredLugares(lugaresInicialesConViews);
                        console.log(`📊 Lugares iniciales establecidos desde CSV: ${lugaresInicialesConViews.length}`);
                        
                        // Buscar lugares y fotos guardadas en Firestore (lugares creados manualmente + fotos)
                        fetch(`/api/lugares?includeApprovedBusinesses=true`)
                            .then(response => {
                                if (response.ok) {
                                    return response.json();
                                }
                                return { lugares: [] };
                            })
                            .then(data => {
                                const lugaresFirestore = data.lugares || [];
                                const viewsByName: Record<string, number> = {};

                                lugaresFirestore.forEach((lugarFirestore: any) => {
                                    const nombre = String(lugarFirestore?.nombre || '').trim();
                                    if (!nombre) return;
                                    const rawViews = Number(String(lugarFirestore?.views ?? '').replace(',', '.').trim());
                                    if (Number.isFinite(rawViews) && rawViews >= 0) {
                                        viewsByName[nombre] = rawViews;
                                    }
                                });
                                
                                // Crear un mapa de nombres del CSV para verificar duplicados
                                const nombresCSV = new Set(lugaresCSV.map(l => l.nombre));
                                
                                // Agregar lugares de Firestore que NO están en el CSV (lugares creados manualmente)
                                lugaresFirestore.forEach((lugarFirestore: any) => {
                                    if (lugarFirestore.nombre && !nombresCSV.has(lugarFirestore.nombre)) {
                                        // Este es un lugar creado manualmente, agregarlo
                                        const categoriaFirestore = String(lugarFirestore.categoria || "Cultura").trim();
                                        const categoriasFirestore = categoriaFirestore
                                            .split(",")
                                            .map((c) => c.trim())
                                };

                                const loadPlaces = async () => {
                                    try {
                                        if (isAuthenticated()) {
                                            await syncLocalFavorites();
                                        }
                                        const favs = await getFavorites();
                                        setFavorites(favs);
                                    } catch (error) {
                                        console.error("Error al cargar favoritos:", error);
                                        const storedFavorites = localStorage.getItem("pitzbol_favorites");
                                        if (storedFavorites) {
                                            setFavorites(JSON.parse(storedFavorites));
                                        }
                                    }

                                    try {
                                        const mergedPlaces = await getMergedPlaces();
                                        const normalizedPlaces: Lugar[] = mergedPlaces.map((place) => {
                                            const photos = Array.isArray(place.fotos) ? place.fotos.filter(Boolean) : [];
                                            return {
                                                nombre: place.nombre,
                                                categoria: place.categoria || place.rawCategoria || "Cultura",
                                                categorias: place.rawCategoria
                                                    ? place.rawCategoria.split(",").map((item) => item.trim()).filter(Boolean)
                                                    : [place.categoria || "Cultura"],
                                                descripcion: place.descripcion || "",
                                                ubicacion: place.ubicacion || "",
                                                latitud: place.latitud || "",
                                                longitud: place.longitud || "",
                                                views: typeof place.views === "number" ? place.views : 0,
                                                fotos: photos,
                                            };
                                        });

                                        const initialImages: Record<string, string> = {};
                                        const fotosMap: Record<string, string[]> = {};

                                        normalizedPlaces.forEach((lugar) => {
                                            const photos = lugar.fotos || [];
                                            if (photos.length > 0) {
                                                fotosMap[lugar.nombre] = photos;
                                                initialImages[lugar.nombre] = photos[0];
                                            } else {
                                                initialImages[lugar.nombre] = getPlaceImageByCategory(lugar.categoria);
                                            }
                                        });

                                        setLugares(normalizedPlaces);
                                        setFilteredLugares(normalizedPlaces);
                                        setPlaceImages(initialImages);
                                        setPlaceAllPhotos(fotosMap);
                                    } catch (error) {
                                        console.error("Error loading map places:", error);
                                    } finally {
                                        setLoading(false);
                                    }
                                };

                                loadPlaces();
                            }, [getFavorites, isAuthenticated, syncLocalFavorites]);
                                                src={placeImages[lugar.nombre] || getPlaceImageUrlSync({
                                                    nombre: lugar.nombre,
                                                    categoria: lugar.categoria,
                                                    ubicacion: lugar.ubicacion,
                                                    latitud: lugar.latitud,
                                                    longitud: lugar.longitud
                                                })}
                                                alt={lugar.nombre}
                                                className={styles.placeImage}
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Fallback garantizado: usar imagen por categoría
                                                    // Esto SIEMPRE funciona porque usa Unsplash
                                                    (e.target as HTMLImageElement).src = getPlaceImageByCategory(lugar.categoria);
                                                }}
                                            />
                                            <div className={styles.placeContent}>
                                                <div className={styles.placeHeader}>
                                                    <div>
                                                        <div className={styles.placeCategoryRow}>
                                                            <span className={styles.placeCategory}>
                                                                {lugar.categoria}
                                                            </span>
                                                            <div className={`${styles.placeRatingBadge} ${styles.ratingDesktop}`}>
                                                                <PlaceRating
                                                                    placeName={lugar.nombre}
                                                                    showLabel={true}
                                                                    size="small"
                                                                    readonly={true}
                                                                />
                                                            </div>
                                                        </div>
                                                        <h3 className={styles.placeName}>{lugar.nombre}</h3>
                                                        <p className={styles.placeDescription}>
                                                            {lugar.descripcion?.substring(0, 60)}
                                                            {(lugar.descripcion?.length || 0) > 60 ? "..." : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={styles.placeFooter}>
                                                    <div className={styles.placeLocation}>
                                                        <FiMapPin size={14} />
                                                        <span>{lugar.ubicacion}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`${styles.placeRatingBadge} ${styles.ratingMobile}`}>
                                                <PlaceRating
                                                    placeName={lugar.nombre}
                                                    showLabel={true}
                                                    size="small"
                                                    readonly={true}
                                                    displayMode="compact"
                                                />
                                            </div>
                                            <motion.button
                                                className={`${styles.favoriteButton} ${styles.favoriteButtonFloating} ${
                                                    favorites.includes(lugar.nombre) ? styles.active : ""
                                                }`}
                                                onClick={(e) => toggleFavorite(e, lugar.nombre)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.85 }}
                                                animate={{ 
                                                    scale: favorites.includes(lugar.nombre) ? [1, 1.2, 1] : 1 
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <FiHeart
                                                    size={16}
                                                    fill={
                                                        favorites.includes(lugar.nombre)
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL - MAPA INTERACTIVO */}
                    <div 
                        className={styles.rightPanel}
                        onClick={(e) => {
                            // Deseleccionar solo si se hace click en el mapa (no en el infoBox)
                            if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.leaflet-container')) {
                                if (selectedPlace && !(e.target as HTMLElement).closest(`.${styles.placeInfoBox}`)) {
                                    handleClearSelection();
                                }
                            }
                        }}
                    >
                        <div className={styles.mapContainer} key="map-container-wrapper">
                            <MapComponent
                                key="main-map-component"
                                lugares={filteredLugares}
                                selectedPlace={selectedPlace}
                                onSelectPlace={handleSelectPlace}
                                mapCenter={mapCenter}
                                mapZoom={mapZoom}
                                placeImages={placeImages}
                            />

                            {/* Info box para lugar seleccionado */}
                            <AnimatePresence>
                                {selectedPlace && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                        className={styles.placeInfoBox}
                                    >
                                        {/* Botón de cerrar */}
                                        <button 
                                            className={styles.closeInfoBox}
                                            onClick={handleClearSelection}
                                            title="Ver todos los lugares"
                                        >
                                            ×
                                        </button>
                                        
                                        {/* Imagen del lugar con gradiente overlay y carrusel */}
                                        <PlaceImageCarousel 
                                            selectedPlace={selectedPlace}
                                            placeImages={placeImages}
                                            placeAllPhotos={placeAllPhotos}
                                            getPlaceImageUrlSync={getPlaceImageUrlSync}
                                            favorites={favorites}
                                            toggleFavorite={toggleFavorite}
                                        />

                                        {/* Contenido */}
                                        <div className={styles.infoContent}>
                                            <h3 
                                                className={styles.infoTitle}
                                                onClick={() => router.push(`/informacion/${encodeURIComponent(selectedPlace.nombre)}`)}
                                            >
                                                {selectedPlace.nombre}
                                            </h3>
                                            
                                            <p className={styles.infoDescription}>{selectedPlace.descripcion}</p>
                                            
                                            <div 
                                                className={styles.infoLocation}
                                                onClick={() => {
                                                    const lat = parseFloat(selectedPlace.latitud || "20.6597");
                                                    const lng = parseFloat(selectedPlace.longitud || "-103.3496");
                                                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
                                                }}
                                            >
                                                <div className={styles.locationIcon}>
                                                    <FiMapPin size={16} />
                                                </div>
                                                <span>{selectedPlace.ubicacion}</span>
                                            </div>

                                            {/* Botón de acción mejorado */}
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={() => router.push(`/informacion/${encodeURIComponent(selectedPlace.nombre)}`)}
                                            >
                                                <span>Detalles</span>
                                                <FiExternalLink size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Toast de notificación de favoritos */}
            <AnimatePresence>
                {showFavoriteToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className={styles.favoriteToast}
                    >
                        <FiHeart size={20} fill="currentColor" />
                        <span>{favoriteToastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

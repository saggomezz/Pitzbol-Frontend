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
import Papa from "papaparse";
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
    GiPalette,
    GiGreekTemple,
    GiPartyFlags,
    GiHospitalCross,
    GiStethoscope
} from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import styles from "./mapa.module.css";
import { getPlaceImageUrlSync, getPlaceImageByCategory } from "@/lib/placeImages";
import { useFavoritesSync } from "@/lib/favoritesApi";
import PlaceRating from "@/app/components/PlaceRating";

interface Lugar {
    nombre: string;
    categoria: string;
    categorias?: string[];
    descripcion: string;
    ubicacion: string;
    imagen?: string;
    latitud?: string;
    longitud?: string;
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
        { name: "Arte", icon: GiPalette },
        { name: "Cultura", icon: GiGreekTemple },
        { name: "Eventos", icon: GiPartyFlags },
        { name: "Casas de Cambio", icon: FiDollarSign },
        { name: "Hospitales", icon: GiHospitalCross },
        { name: "Médico", icon: GiStethoscope },
    ];

    const normalizeText = (value: string) =>
        value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    const CATEGORY_FILTER_ALIASES: Record<string, string[]> = {
        futbol: ["futbol", "soccer", "deporte", "deportefutbol"],
        gastronomia: ["gastronomia", "gastronomia mexicana", "comida", "postre", "vegana"],
        arte: ["arte", "arte e historia", "arquitectura", "museos", "fotografia"],
        cultura: ["cultura", "museos", "arquitectura", "religion"],
        eventos: ["eventos", "musica", "vida nocturna", "conciertos"],
        "casas de cambio": ["casas de cambio", "cambio"],
        hospitales: ["hospitales", "hospital", "salud"],
        medico: ["medico", "salud", "clinica", "doctor"],
    };

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
                                            .filter(Boolean);

                                        lugaresCSV.push({
                                            nombre: lugarFirestore.nombre,
                                            categoria: categoriasFirestore[0] || categoriaFirestore || 'Cultura',
                                            categorias: categoriasFirestore,
                                            descripcion: lugarFirestore.descripcion || '',
                                            ubicacion: lugarFirestore.ubicacion || '',
                                            latitud: lugarFirestore.latitud || '',
                                            longitud: lugarFirestore.longitud || ''
                                        const BACKEND_URL = getBackendOrigin();
                                        });
                                        console.log(`✅ Lugar creado manualmente agregado: ${lugarFirestore.nombre}`);
                                    }
                                });
                                
                                console.log(`📊 Total lugares: ${lugaresCSV.length} (${parsed.length} del CSV + ${lugaresCSV.length - parsed.length} creados manualmente)`);
                                
                                setLugares(lugaresCSV);
                                setFilteredLugares(lugaresCSV);
                                
                                // Crear un mapa de fotos por nombre
                                const fotosMap: Record<string, string[]> = {};
                                lugaresFirestore.forEach((lugar: any) => {
                                    if (lugar.nombre && lugar.fotos && lugar.fotos.length > 0) {
                                        fotosMap[lugar.nombre] = lugar.fotos;
                                    }
                                });
                                
                                // Guardar todas las fotos para el carrusel
                                setPlaceAllPhotos(fotosMap);
                                
                                // Actualizar imágenes con fotos guardadas (primera foto para compatibilidad)
                                if (Object.keys(fotosMap).length > 0) {
                                    const updatedImages = { ...initialImages };
                                    Object.keys(fotosMap).forEach(nombre => {
                                        if (fotosMap[nombre] && fotosMap[nombre].length > 0) {
                                            updatedImages[nombre] = fotosMap[nombre][0]; // Usar la primera foto
                                            console.log(`✅ ${fotosMap[nombre].length} foto(s) guardada(s) para: ${nombre}`);
                                        }
                                    });
                                    setPlaceImages(updatedImages);
                                }
                            })
                            .catch(error => {
                                console.error("Error obteniendo fotos guardadas:", error);
                                // Continuar con imágenes por categoría si falla
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                    },
                });
            })
            .catch((error) => {
                console.error("Error loading CSV:", error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let filtered = lugares;
        
        console.log("🔍 Filtrando lugares - Total:", lugares.length);
        console.log("🔍 Categoría seleccionada:", selectedCategory);
        console.log("🔍 Término de búsqueda:", searchTerm);

        if (selectedCategory !== "Todos Los Lugares" && selectedCategory !== "Más Populares") {
            const antes = filtered.length;
            const normalizedSelected = normalizeText(selectedCategory);
            const targetAliases = CATEGORY_FILTER_ALIASES[normalizedSelected] || [normalizedSelected];

            filtered = filtered.filter((lugar) => {
                const placeCategories = (lugar.categorias && lugar.categorias.length > 0
                    ? lugar.categorias
                    : [lugar.categoria]
                )
                    .map((category) => normalizeText(category))
                    .filter(Boolean);

                return placeCategories.some((cat) =>
                    targetAliases.some(
                        (target) => cat === target || cat.includes(target) || target.includes(cat)
                    )
                );
            });
            console.log(`🔍 Filtrado por categoría: ${antes} → ${filtered.length}`);
        }

        if (searchTerm) {
            const antes = filtered.length;
            filtered = filtered.filter(
                (lugar) =>
                    lugar.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            console.log(`🔍 Filtrado por búsqueda: ${antes} → ${filtered.length}`);
        }

        console.log("✅ Lugares filtrados finales:", filtered.length);
        setFilteredLugares(filtered);
    }, [selectedCategory, searchTerm, lugares]);

    // Manejar query parameter "lugar" para mostrar solo un lugar específico
    useEffect(() => {
        // Leer el parámetro "lugar" del URL
        const urlParams = new URLSearchParams(window.location.search);
        const lugarParam = urlParams.get('lugar');
        
        if (lugarParam && lugares.length > 0) {
            // Buscar el lugar por nombre (decodificando el URL)
            const lugarEncontrado = lugares.find(
                lugar => lugar.nombre.toLowerCase() === decodeURIComponent(lugarParam).toLowerCase()
            );
            
            if (lugarEncontrado) {
                console.log("📍 Lugar encontrado desde URL:", lugarEncontrado.nombre);
                
                // Filtrar para mostrar solo este lugar
                setFilteredLugares([lugarEncontrado]);
                
                // Seleccionar el lugar y centrar el mapa
                setSelectedPlace(lugarEncontrado);
                const lat = parseFloat(lugarEncontrado.latitud || "20.6597");
                const lng = parseFloat(lugarEncontrado.longitud || "-103.3496");
                setMapCenter([lat, lng]);
                setMapZoom(15);
                
                // Limpiar filtros de categoría y búsqueda para evitar conflictos
                setSelectedCategory("Todos Los Lugares");
                setSearchTerm("");
            } else {
                console.warn("⚠️ No se encontró el lugar:", lugarParam);
            }
        }
    }, [lugares]);

    // Manejar selección de lugar (desde lista o desde mapa)
    const handleSelectPlace = (lugar: Lugar) => {
        setSelectedPlace(lugar);
        const lat = parseFloat(lugar.latitud || "20.6597");
        const lng = parseFloat(lugar.longitud || "-103.3496");
        setMapCenter([lat, lng]);
        setMapZoom(15);
    };

    // Limpiar selección y volver a mostrar todos los lugares
    const handleClearSelection = () => {
        setSelectedPlace(null);
        setMapCenter([20.6597, -103.3496]);
        setMapZoom(12);
    };

    // Deseleccionar con ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selectedPlace) {
                handleClearSelection();
            }
        };
        
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [selectedPlace]);

    const toggleFavorite = async (e: React.MouseEvent, nombre: string) => {
        e.stopPropagation();
        const isRemoving = favorites.includes(nombre);
        
        try {
            const updated = isRemoving
                ? await removeFavoriteApi(nombre)
                : await addFavorite(nombre);
            setFavorites(updated);
            
            // Mostrar notificación
            setFavoriteToastMessage(isRemoving ? "Eliminado de favoritos" : "Agregado a favoritos");
            setShowFavoriteToast(true);
            setTimeout(() => setShowFavoriteToast(false), 2000);
        } catch (error) {
            console.error("Error al actualizar favorito:", error);
            // Fallback: actualizar solo localmente
            const updated = isRemoving
                ? favorites.filter((n) => n !== nombre)
                : [...favorites, nombre];
            setFavorites(updated);
            localStorage.setItem("pitzbol_favorites", JSON.stringify(updated));
            
            setFavoriteToastMessage(isRemoving ? "Eliminado de favoritos" : "Agregado a favoritos");
            setShowFavoriteToast(true);
            setTimeout(() => setShowFavoriteToast(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.loading}>
                        <div className={styles.loadingSpinner}></div>
                        <p style={{ marginTop: "1rem", color: "#769C7B", fontWeight: 600 }}>
                            Cargando lugares...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.badge}>
                        <GiSoccerBall style={{ display: "inline", marginRight: "0.5rem" }} />
                        EXPLORA MÉXICO
                    </div>
                    <h1 className={styles.title}>
                        MAPA DE <span className={styles.titleAccent}>LUGARES</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Descubre los mejores destinos deportivos, culturales y gastronómicos
                    </p>
                </div>

                {/* FILTERS */}
                <div className={styles.filters}>
                    <div 
                        className={styles.filtersHeader}
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.filtersTitle}>
                            <FiMapPin size={24} />
                            <span>Explora Guadalajara</span>
                            <FiChevronDown 
                                size={24} 
                                className={`${styles.chevronIcon} ${filtersExpanded ? styles.expanded : ''}`}
                            />
                        </div>
                        <div className={styles.filtersSubtitle}>
                            Selecciona una categoría para descubrir lugares increíbles
                        </div>
                    </div>

                    <div className={`${styles.filtersContent} ${filtersExpanded ? styles.expanded : styles.collapsed}`}>
                    <div className={styles.categoryGrid}>
                        {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                                <button
                                    key={cat.name}
                                    className={`${styles.categoryCard} ${
                                        selectedCategory === cat.name ? styles.active : ""
                                    }`}
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    <div className={styles.categoryIcon}>
                                        <IconComponent size={28} />
                                    </div>
                                    <span className={styles.categoryName}>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                    </div>

                    <div className={styles.searchContainer}>
                        <div className={styles.searchBox}>
                            <FiSearch className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Buscar por nombre, descripción o ubicación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                    className={styles.clearButton}
                                    onClick={() => setSearchTerm("")}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* MAIN LAYOUT */}
                <div className={styles.mainLayout}>
                    {/* LEFT PANEL */}
                    <div className={styles.leftPanel}>
                        <div className={styles.results}>
                            <div className={styles.resultsHeader}>
                                <span className={styles.resultsCount}>
                                    {filteredLugares.length} LUGARES ENCONTRADOS
                                </span>
                            </div>

                            {filteredLugares.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <FiMapPin />
                                    </div>
                                    <div className={styles.emptyTitle}>Sin resultados</div>
                                    <div className={styles.emptyDescription}>
                                        Intenta con otros filtros o palabras clave
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.placesListMap}>
                                    {filteredLugares.map((lugar, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`${styles.placeCardMap} ${
                                                selectedPlace?.nombre === lugar.nombre ? styles.selected : ""
                                            }`}
                                            onClick={() => handleSelectPlace(lugar)}
                                        >
                                            <img
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
                                                        <span className={styles.placeCategory}>
                                                            {lugar.categoria}
                                                        </span>
                                                        <h3 className={styles.placeName}>{lugar.nombre}</h3>
                                                        <p className={styles.placeDescription}>
                                                            {lugar.descripcion?.substring(0, 60)}
                                                            {(lugar.descripcion?.length || 0) > 60 ? "..." : ""}
                                                        </p>
                                                    </div>
                                                    <div className={styles.placeActions}>
                                                        <div className={styles.placeRatingBadge}>
                                                            <PlaceRating
                                                                placeName={lugar.nombre}
                                                                showLabel={true}
                                                                size="small"
                                                                readonly={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.placeFooter}>
                                                    <div className={styles.placeLocation}>
                                                        <FiMapPin size={14} />
                                                        <span>{lugar.ubicacion}</span>
                                                    </div>
                                                </div>
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

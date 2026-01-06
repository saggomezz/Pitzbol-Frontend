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
    FiChevronDown
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

interface Lugar {
    nombre: string;
    categoria: string;
    descripcion: string;
    ubicacion: string;
    imagen?: string;
    latitud?: string;
    longitud?: string;
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

    useEffect(() => {
        const storedFavorites = localStorage.getItem("pitzbol_favorites");
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }

        fetch("/datosLugares.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const data = results.data.filter((row: any) => row["Nombre del Lugar"]);
                        const parsed = data.map((row: any) => ({
                            nombre: row["Nombre del Lugar"],
                            categoria: row["Categoría"],
                            descripcion: row["Nota para IA"] || "",
                            ubicacion: row["Dirección"],
                            latitud: row["Latitud"]?.replace(",", "."),
                            longitud: row["Longitud"]?.replace(",", "."),
                        }));
                        setLugares(parsed);
                        setFilteredLugares(parsed);
                        setLoading(false);
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

        if (selectedCategory !== "Todos Los Lugares" && selectedCategory !== "Más Populares") {
            filtered = filtered.filter((lugar) => lugar.categoria === selectedCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (lugar) =>
                    lugar.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLugares(filtered);
    }, [selectedCategory, searchTerm, lugares]);

    const toggleFavorite = (e: React.MouseEvent, nombre: string) => {
        e.stopPropagation();
        const updated = favorites.includes(nombre)
            ? favorites.filter((n) => n !== nombre)
            : [...favorites, nombre];
        setFavorites(updated);
        localStorage.setItem("pitzbol_favorites", JSON.stringify(updated));
    };

    // Manejar selección de lugar (desde lista o desde mapa)
    const handleSelectPlace = (lugar: Lugar) => {
        setSelectedPlace(lugar);
        const lat = parseFloat(lugar.latitud || "20.6597");
        const lng = parseFloat(lugar.longitud || "-103.3496");
        setMapCenter([lat, lng]);
        setMapZoom(15);
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
                                    {filteredLugares.length} lugar{filteredLugares.length !== 1 ? "es" : ""}
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
                                                src="https://via.placeholder.com/90?text=Lugar"
                                                alt={lugar.nombre}
                                                className={styles.placeImage}
                                            />
                                            <div className={styles.placeContent}>
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
                                                <div className={styles.placeFooter}>
                                                    <div className={styles.placeLocation}>
                                                        <FiMapPin size={14} />
                                                        <span>{lugar.ubicacion}</span>
                                                    </div>
                                                    <button
                                                        className={`${styles.favoriteButton} ${
                                                            favorites.includes(lugar.nombre) ? styles.active : ""
                                                        }`}
                                                        onClick={(e) => toggleFavorite(e, lugar.nombre)}
                                                    >
                                                        <FiHeart
                                                            size={16}
                                                            fill={
                                                                favorites.includes(lugar.nombre)
                                                                    ? "currentColor"
                                                                    : "none"
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL - MAPA INTERACTIVO */}
                    <div className={styles.rightPanel}>
                        <div className={styles.mapContainer}>
                            <MapComponent
                                lugares={filteredLugares}
                                selectedPlace={selectedPlace}
                                onSelectPlace={handleSelectPlace}
                                mapCenter={mapCenter}
                                mapZoom={mapZoom}
                            />

                            {/* Info box para lugar seleccionado */}
                            <AnimatePresence>
                                {selectedPlace && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className={styles.placeInfoBox}
                                    >
                                        <h3 className={styles.infoTitle}>{selectedPlace.nombre}</h3>
                                        <span className={styles.infoCategory}>{selectedPlace.categoria}</span>
                                        <p className={styles.infoDescription}>{selectedPlace.descripcion}</p>
                                        <div className={styles.infoLocation}>
                                            <FiMapPin size={16} />
                                            {selectedPlace.ubicacion}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

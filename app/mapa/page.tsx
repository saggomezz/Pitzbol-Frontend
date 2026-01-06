"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { FiMapPin, FiSearch, FiHeart } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";
import styles from "./mapa.module.css";

interface Lugar {
    nombre: string;
    categoria: string;
    descripcion: string;
    ubicacion: string;
    imagen?: string;
}

export default function MapaLugares() {
    const [lugares, setLugares] = useState<Lugar[]>([]);
    const [filteredLugares, setFilteredLugares] = useState<Lugar[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("todos");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Categorías disponibles
    const categories = ["todos", "fútbol", "gastronomía", "arte", "cultura", "eventos"];

    useEffect(() => {
        // Cargar favoritos del localStorage
        const storedFavorites = localStorage.getItem("pitzbol_favorites");
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }

        // Cargar lugares desde CSV
        fetch("/datosLugares.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const data = results.data as Lugar[];
                        setLugares(data);
                        setFilteredLugares(data);
                        setLoading(false);
                    },
                });
            })
            .catch((error) => {
                console.error("Error al cargar lugares:", error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        // Filtrar lugares por categoría y búsqueda
        let filtered = lugares;

        if (selectedCategory !== "todos") {
            filtered = filtered.filter(
                (lugar) => lugar.categoria?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (lugar) =>
                    lugar.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lugar.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLugares(filtered);
    }, [selectedCategory, searchTerm, lugares]);

    const toggleFavorite = (lugarNombre: string) => {
        let newFavorites: string[];
        if (favorites.includes(lugarNombre)) {
            newFavorites = favorites.filter((fav) => fav !== lugarNombre);
        } else {
            newFavorites = [...favorites, lugarNombre];
        }
        setFavorites(newFavorites);
        localStorage.setItem("pitzbol_favorites", JSON.stringify(newFavorites));
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <p style={{ marginTop: "1rem", color: "#769C7B" }}>Cargando lugares...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HEADER */}
                <div className={styles.header}>
                    <span className={styles.badge}>
                        <GiSoccerBall style={{ display: "inline", marginRight: "0.5rem" }} />
                        Explora México
                    </span>
                    <h1 className={styles.title}>
                        MAPA DE <span className={styles.titleAccent}>LUGARES</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Descubre los mejores destinos deportivos, culturales y gastronómicos
                    </p>
                </div>

                {/* FILTERS */}
                <div className={styles.filters}>
                    <div className={styles.filtersTitle}>
                        <FiMapPin style={{ display: "inline", marginRight: "0.5rem" }} />
                        Filtrar por categoría
                    </div>
                    <div className={styles.categoryButtons}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`${styles.categoryButton} ${
                                    selectedCategory === cat ? styles.active : ""
                                }`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat === "todos" ? "Todos los lugares" : cat}
                            </button>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className={styles.searchBox}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar lugares por nombre, descripción o ubicación..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* RESULTS */}
                <div className={styles.results}>
                    <div className={styles.resultsHeader}>
                        <div className={styles.resultsCount}>
                            {filteredLugares.length} {filteredLugares.length === 1 ? "lugar encontrado" : "lugares encontrados"}
                        </div>
                    </div>

                    {/* PLACES GRID */}
                    {filteredLugares.length > 0 ? (
                        <div className={styles.placesGrid}>
                            {filteredLugares.map((lugar, index) => (
                                <div key={index} className={styles.placeCard}>
                                    <img
                                        src={lugar.imagen || "/placeholder-image.jpg"}
                                        alt={lugar.nombre}
                                        className={styles.placeImage}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                                        }}
                                    />
                                    <div className={styles.placeContent}>
                                        <span className={styles.placeCategory}>
                                            {lugar.categoria || "Sin categoría"}
                                        </span>
                                        <h3 className={styles.placeName}>{lugar.nombre}</h3>
                                        <p className={styles.placeDescription}>
                                            {lugar.descripcion?.substring(0, 120)}
                                            {(lugar.descripcion?.length || 0) > 120 ? "..." : ""}
                                        </p>
                                        <div className={styles.placeFooter}>
                                            <div className={styles.placeLocation}>
                                                <FiMapPin />
                                                {lugar.ubicacion || "Sin ubicación"}
                                            </div>
                                            <button
                                                className={`${styles.favoriteButton} ${
                                                    favorites.includes(lugar.nombre) ? styles.active : ""
                                                }`}
                                                onClick={() => toggleFavorite(lugar.nombre)}
                                                title={
                                                    favorites.includes(lugar.nombre)
                                                        ? "Quitar de favoritos"
                                                        : "Agregar a favoritos"
                                                }
                                            >
                                                <FiHeart />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <FiMapPin />
                            </div>
                            <h3 className={styles.emptyTitle}>No se encontraron lugares</h3>
                            <p className={styles.emptyDescription}>
                                Intenta con otra categoría o término de búsqueda
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

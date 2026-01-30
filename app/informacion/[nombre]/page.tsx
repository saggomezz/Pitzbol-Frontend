"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiClock, FiDollarSign, FiInfo, FiArrowLeft, FiNavigation, FiHeart, FiShare2 } from "react-icons/fi";
import styles from "../informacion.module.css";
import { useFavoritesSync } from "@/lib/favoritesApi";

interface Lugar {
  nombre: string;
  categoria: string;
  direccion: string;
  latitud: number;
  longitud: number;
  tiempoEstancia: number;
  costoEstimado: string;
  notaIA: string;
}

export default function InformacionLugar() {
  const params = useParams();
  const router = useRouter();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  useEffect(() => {
    const cargarLugar = async () => {
      try {
        const response = await fetch("/datosLugares.csv");
        const text = await response.text();
        const lineas = text.split("\n");

        const nombreBuscado = decodeURIComponent(params.nombre as string);

        for (let i = 1; i < lineas.length; i++) {
          const valores = lineas[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
          if (valores) {
            const nombreLugar = valores[0].replace(/"/g, "");
            
            if (nombreLugar === nombreBuscado) {
              setLugar({
                nombre: nombreLugar,
                categoria: valores[1]?.replace(/"/g, "") || "",
                direccion: valores[2]?.replace(/"/g, "") || "",
                latitud: parseFloat(valores[3]) || 0,
                longitud: parseFloat(valores[4]) || 0,
                tiempoEstancia: parseInt(valores[5]) || 0,
                costoEstimado: valores[6]?.replace(/"/g, "") || "",
                notaIA: valores[7]?.replace(/"/g, "") || "",
              });
              break;
            }
          }
        }

        // Verificar si está en favoritos
        try {
          if (isAuthenticated()) {
            await syncLocalFavorites();
          }
          const favorites = await getFavorites();
          setIsFavorite(favorites.includes(nombreBuscado));
        } catch (error) {
          console.error("Error al cargar favoritos:", error);
          // Fallback a localStorage
          const storedFavorites = localStorage.getItem("pitzbol_favorites");
          if (storedFavorites) {
            const favorites = JSON.parse(storedFavorites);
            setIsFavorite(favorites.includes(nombreBuscado));
          }
        }
      } catch (error) {
        console.error("Error al cargar el lugar:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarLugar();
  }, [params.nombre]);

  const abrirEnMaps = () => {
    if (lugar) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lugar.latitud},${lugar.longitud}`;
      window.open(url, "_blank");
    }
  };

  const toggleFavorite = async () => {
    const nombreLugar = decodeURIComponent(params.nombre as string);
    
    try {
      if (isFavorite) {
        await removeFavoriteApi(nombreLugar);
        setIsFavorite(false);
      } else {
        await addFavorite(nombreLugar);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      // Fallback: actualizar solo localmente
      const storedFavorites = localStorage.getItem("pitzbol_favorites");
      const favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
      
      if (isFavorite) {
        const updated = favorites.filter((n: string) => n !== nombreLugar);
        localStorage.setItem("pitzbol_favorites", JSON.stringify(updated));
        setIsFavorite(false);
      } else {
        favorites.push(nombreLugar);
        localStorage.setItem("pitzbol_favorites", JSON.stringify(favorites));
        setIsFavorite(true);
      }
      
      window.dispatchEvent(new Event('favoritesChanged'));
    }
  };

  const compartir = async () => {
    if (navigator.share && lugar) {
      try {
        await navigator.share({
          title: lugar.nombre,
          text: `¡Mira este lugar en Pitzbol! ${lugar.nombre}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error al compartir:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!lugar) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>😕 Lugar no encontrado</h1>
          <p>No pudimos encontrar información sobre este lugar.</p>
          <button onClick={() => router.push("/mapa")} className={styles.backButton}>
            <FiArrowLeft /> Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header con imagen de fondo */}
      <div className={styles.heroHeader}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <FiArrowLeft />
          </button>
          <div className={styles.heroActions}>
            <motion.button 
              onClick={toggleFavorite} 
              className={`${styles.iconBtn} ${isFavorite ? styles.iconBtnActive : ''}`}
              title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              whileTap={{ scale: 0.85 }}
              animate={{ 
                scale: isFavorite ? [1, 1.2, 1] : 1,
                rotate: isFavorite ? [0, -10, 10, 0] : 0
              }}
              transition={{ duration: 0.4 }}
            >
              <FiHeart fill={isFavorite ? "currentColor" : "none"} />
            </motion.button>
            <button onClick={compartir} className={styles.iconBtn} title="Compartir">
              <FiShare2 />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.wrapper}>
        {/* Información principal */}
        <div className={styles.mainContent}>
          <div className={styles.titleSection}>
            <span className={styles.categoryBadge}>{lugar.categoria}</span>
            <h1 className={styles.title}>{lugar.nombre}</h1>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiClock />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Tiempo sugerido</span>
                <span className={styles.statValue}>{lugar.tiempoEstancia} min</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiDollarSign />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Costo estimado</span>
                <span className={styles.statValue}>{lugar.costoEstimado}</span>
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className={styles.locationCard}>
            <div className={styles.locationHeader}>
              <FiMapPin />
              <h2>Ubicación</h2>
            </div>
            <p className={styles.address}>{lugar.direccion}</p>
            <button onClick={abrirEnMaps} className={styles.directionsBtn}>
              <FiNavigation /> Cómo llegar
            </button>
          </div>

          {/* Información adicional */}
          {lugar.notaIA && (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <FiInfo />
                <h2>Información adicional</h2>
              </div>
              <p className={styles.infoText}>{lugar.notaIA}</p>
            </div>
          )}

          {/* Mapa */}
          <div className={styles.mapSection}>
            <h2 className={styles.mapTitle}>Mapa</h2>
            <div className={styles.mapContainer}>
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${lugar.latitud},${lugar.longitud}&zoom=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${lugar.nombre}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

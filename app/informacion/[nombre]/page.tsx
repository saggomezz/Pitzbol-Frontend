"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiClock, FiDollarSign, FiInfo, FiArrowLeft, FiNavigation, FiHeart, FiShare2 } from "react-icons/fi";
import styles from "../informacion.module.css";
import { useFavoritesSync } from "@/lib/favoritesApi";
import PlaceRating from "@/app/components/PlaceRating";
import { usePlaceView } from "@/lib/usePlaceView";

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function InformacionLugar() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromItinerario = searchParams.get('from') === 'itinerario';
  const backUrl = searchParams.get('back');
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  // Registrar vista del lugar
  const nombreLugar = params.nombre ? decodeURIComponent(params.nombre as string) : null;
  usePlaceView(nombreLugar);

  useEffect(() => {
    const cargarLugar = async () => {
      try {
        const nombreBuscado = decodeURIComponent(params.nombre as string);
        let lugarEncontrado: Lugar | null = null;

        // 1. Primero intentar buscar en el backend (Firestore)
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
          const backendResponse = await fetch(`${BACKEND_URL}/api/lugares`);
          
          if (backendResponse.ok) {
            const data = await backendResponse.json();
            const lugares = data.lugares || [];
            
            const lugarBackend = lugares.find((l: any) => l.nombre === nombreBuscado);
            
            if (lugarBackend) {
              lugarEncontrado = {
                nombre: lugarBackend.nombre || nombreBuscado,
                categoria: lugarBackend.categoria || "",
                direccion: lugarBackend.ubicacion || "",
                latitud: parseFloat(lugarBackend.latitud) || 0,
                longitud: parseFloat(lugarBackend.longitud) || 0,
                tiempoEstancia: 60, // Valor por defecto
                costoEstimado: "$$", // Valor por defecto
                notaIA: lugarBackend.descripcion || "",
              };
            }
          }
        } catch (backendError) {
          console.log("No se pudo buscar en backend, intentando CSV:", backendError);
        }

        // 2. Si no se encontró en backend, buscar en CSV
        if (!lugarEncontrado) {
          const response = await fetch("/datosLugares.csv");
          const text = await response.text();
          const lineas = text.split("\n");

          for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            
            if (valores) {
              const nombreLugar = valores[0].replace(/"/g, "");
              
              if (nombreLugar === nombreBuscado) {
                lugarEncontrado = {
                  nombre: nombreLugar,
                  categoria: valores[1]?.replace(/"/g, "") || "",
                  direccion: valores[2]?.replace(/"/g, "") || "",
                  latitud: parseFloat(valores[3]) || 0,
                  longitud: parseFloat(valores[4]) || 0,
                  tiempoEstancia: parseInt(valores[5]) || 0,
                  costoEstimado: valores[6]?.replace(/"/g, "") || "",
                  notaIA: valores[7]?.replace(/"/g, "") || "",
                };
                break;
              }
            }
=======
        for (let i = 1; i < lineas.length; i++) {
          if (!lineas[i].trim()) continue;
          const valores = parseCSVLine(lineas[i]);
          const nombreLugar = valores[0];

          if (nombreLugar === nombreBuscado) {
            setLugar({
              nombre: nombreLugar,
              categoria: valores[1] || "",
              direccion: valores[2] || "",
              latitud: parseFloat((valores[3] || "0").replace(',', '.')) || 0,
              longitud: parseFloat((valores[4] || "0").replace(',', '.')) || 0,
              tiempoEstancia: parseInt(valores[5] || "0") || 0,
              costoEstimado: valores[6] || "",
              notaIA: valores[7] || "",
            });
            break;
          }
        }

        // 3. Establecer el lugar encontrado (o null si no se encontró)
        setLugar(lugarEncontrado);

        // 4. Verificar si está en favoritos
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
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 2,
            padding: '0 5rem',
            pointerEvents: 'none',
          }}
        >
          <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: 1.3 }}>
            {lugar.nombre}
          </p>
        </div>
        <div className={styles.heroContent}>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                if (fromItinerario && backUrl) {
                  window.location.href = decodeURIComponent(backUrl);
                } else {
                  router.back();
                }
              }}
              className={styles.backBtn}
            >
              <FiArrowLeft />
            </button>
            {fromItinerario && (
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.2 }}>
                Itinerario
              </span>
            )}
          </div>
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
            
            {/* Calificación del lugar */}
            <div style={{ marginTop: '1rem' }}>
              <PlaceRating 
                placeName={lugar.nombre} 
                showLabel={true}
                size="large"
              />
            </div>
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

          {/* Botón de regreso al itinerario */}
          {fromItinerario && backUrl && (
            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={() => { window.location.href = decodeURIComponent(backUrl); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#1A4D2E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  justifyContent: 'center',
                }}
              >
                <FiArrowLeft />
                Volver al itinerario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

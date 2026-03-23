"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiClock, FiDollarSign, FiInfo, FiArrowLeft, FiNavigation, FiHeart, FiShare2, FiPhone, FiGlobe, FiMail } from "react-icons/fi";
import styles from "../informacion.module.css";
import { useFavoritesSync } from "@/lib/favoritesApi";
import PlaceRating from "@/app/components/PlaceRating";
import { usePlaceView } from "@/lib/usePlaceView";
import { getMergedPlaces, PlaceRecord } from "@/lib/placesApi";

const CULTURA_DESCRIPTIONS: Record<string, string> = {
  "Instituto Cultural Cabañas, Guadalajara":
    "Declarado Patrimonio de la Humanidad por la UNESCO en 1997, el Hospicio Cabañas fue fundado en 1810 por el obispo Juan Cruz Ruiz de Cabañas como casa de beneficencia. Su capilla alberga los célebres murales de José Clemente Orozco pintados entre 1938 y 1939, considerados una de las obras cumbres del muralismo mexicano. La figura del Hombre de Fuego en la cúpula central es su imagen más emblemática.",
  "Teatro Degollado, Guadalajara":
    "Inaugurado en 1866, el Teatro Degollado es el principal recinto escénico de Guadalajara y uno de los teatros neoclásicos más importantes de México. Su fachada está coronada por un friso que representa el cuarto acto de Dante en la Divina Comedia. Desde su apertura ha sido sede de la Orquesta Filarmónica de Jalisco y del Ballet Folclórico de la Universidad de Guadalajara, siendo escenario de cientos de eventos culturales internacionales.",
  "Catedral Metropolitana, Guadalajara":
    "Construida entre 1558 y 1618, la Catedral de Guadalajara combina estilos gótico, barroco y neoclásico, resultado de más de cuatro siglos de intervenciones arquitectónicas. Sus torres gemelas son el ícono por excelencia de la ciudad y fueron reconstruidas tras el terremoto de 1818. En su interior se conservan retablos coloniales, pinturas de Murillo y la cripta donde reposan varios obispos y arzobispos de Jalisco.",
  "Palacio de Gobierno de Jalisco, Guadalajara":
    "Edificado a finales del siglo XVII, el Palacio de Gobierno es el centro administrativo del estado de Jalisco y uno de los recintos históricos más significativos de México. En 1810, el cura Miguel Hidalgo firmó aquí el primer decreto de abolición de la esclavitud en América. Su escalinata principal está decorada con el monumental mural de José Clemente Orozco que representa a Hidalgo como figura libertaria.",
  "Plaza de Armas, Guadalajara":
    "Corazón histórico de Guadalajara desde su fundación en 1542, la Plaza de Armas fue durante siglos el espacio público central de la vida colonial tapatía. Flanqueada por la Catedral Metropolitana y el Palacio de Gobierno, fue escenario de proclamaciones, ferias y eventos políticos clave. Su quiosco modernista de hierro, traído desde Francia en 1898, es uno de los elementos más fotogénicos del centro histórico.",
  "Museo del Periodismo y las Artes Gráficas, Guadalajara":
    "Ubicado en la Casa de los Perros, un edificio del siglo XVIII declarado monumento histórico, este museo documenta la historia del periodismo en México desde la época colonial. Aquí se imprimió en 1810 el primer periódico insurgente: El Despertador Americano, voz de la lucha de Independencia. Sus salas exhiben prensas tipográficas históricas, primeras ediciones y la evolución del diseño editorial en Jalisco.",
  "Expiatorio del Santísimo Sacramento, Guadalajara":
    "Considerada la iglesia más bella de Guadalajara, el Expiatorio es un templo neogótico cuya construcción comenzó en 1897 y no concluyó sino hasta 1972, con más de 70 años de trabajo artesanal. Sus vitrales de origen alemán, sus arbotantes y su cripta la convierten en un referente arquitectónico único en México. Cada viernes se realiza el tradicional mercado de artesanías en su atrio, uno de los más populares de la ciudad.",
  "Centro Histórico de Tlaquepaque, Guadalajara":
    "San Pedro Tlaquepaque es reconocido mundialmente como uno de los centros artesanales más importantes de México. Desde el siglo XIX ha sido cuna de maestros vidrieros, alfareros y artesanos textiles cuyas obras llegan a colecciones de todo el mundo. Su centro histórico, con calles empedradas y casonas coloniales, fue declarado Zona de Monumentos Históricos y alberga galerías, talleres y el emblemático El Parián, mercado de artesanías y mariachi.",
};

interface Lugar {
  nombre: string;
  categoria: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono?: string;
  website?: string;
  email?: string;
  codigoPostal?: string;
  tiempoEstancia: number;
  costoEstimado: string;
  notaIA: string;
  fotos: string[];
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapPlaceToPublicDetail(place: PlaceRecord): Lugar {
  const lat = parseFloat(place.latitud || "");
  const lng = parseFloat(place.longitud || "");
  const placeAsAny = place as PlaceRecord & {
    tiempoEstancia?: number;
    costoEstimado?: string;
  };

  return {
    nombre: place.nombre,
    categoria: place.categoria || "Negocio",
    direccion: place.ubicacion || "Ubicacion no disponible",
    latitud: Number.isFinite(lat) ? lat : 0,
    longitud: Number.isFinite(lng) ? lng : 0,
    telefono: place.telefono || (place as PlaceRecord & { phone?: string }).phone,
    website: place.website,
    email:
      place.email ||
      (place as PlaceRecord & { ownerEmail?: string; contactEmail?: string }).ownerEmail ||
      (place as PlaceRecord & { ownerEmail?: string; contactEmail?: string }).contactEmail,
    codigoPostal: place.codigoPostal,
    tiempoEstancia: placeAsAny.tiempoEstancia && placeAsAny.tiempoEstancia > 0 ? placeAsAny.tiempoEstancia : 60,
    costoEstimado: placeAsAny.costoEstimado || "No especificado",
    notaIA: place.descripcion || "",
    fotos: Array.isArray(place.fotos) ? place.fotos : [],
  };
}

function getMapEmbedSrc(lugar: Lugar): string {
  const hasCoordinates = lugar.latitud !== 0 && lugar.longitud !== 0;
  const query = hasCoordinates
    ? `${lugar.latitud},${lugar.longitud}`
    : encodeURIComponent(lugar.direccion || lugar.nombre);

  return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
}

export default function InformacionLugar() {
  const params = useParams();
  const router = useRouter();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoIdx, setFotoIdx] = useState(0);

  const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  // Registrar vista del lugar
  const nombreRaw = params.nombre;
  const nombreLugar = typeof nombreRaw === "string" ? decodeURIComponent(nombreRaw) : null;
  usePlaceView(nombreLugar);

  useEffect(() => {
    const cargarLugar = async () => {
      if (!nombreLugar) {
        setLugar(null);
        setFotos([]);
        setLoading(false);
        return;
      }

      try {
        const mergedPlaces = await getMergedPlaces();
        const lugarRecord = mergedPlaces.find(
          (candidate) => normalizeName(candidate.nombre) === normalizeName(nombreLugar)
        );

        const lugarEncontrado = lugarRecord ? mapPlaceToPublicDetail(lugarRecord) : null;
        setLugar(lugarEncontrado);
        setFotos((lugarEncontrado?.fotos || []).slice(0, 6));

        // Verificar si esta en favoritos
        try {
          if (isAuthenticated()) {
            await syncLocalFavorites();
          }
          const favorites = await getFavorites();
          setIsFavorite(favorites.includes(nombreLugar));
        } catch (error) {
          console.error("Error al cargar favoritos:", error);
          // Fallback a localStorage
          const storedFavorites = localStorage.getItem("pitzbol_favorites");
          if (storedFavorites) {
            const favorites = JSON.parse(storedFavorites);
            setIsFavorite(favorites.includes(nombreLugar));
          }
        }
      } catch (error) {
        console.error("Error al cargar el lugar:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarLugar();
  }, [nombreLugar, getFavorites, isAuthenticated, syncLocalFavorites]);

  const abrirEnMaps = () => {
    if (lugar) {
      const hasCoordinates = lugar.latitud !== 0 && lugar.longitud !== 0;
      const query = hasCoordinates
        ? `${lugar.latitud},${lugar.longitud}`
        : encodeURIComponent(lugar.direccion || lugar.nombre);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, "_blank");
    }
  };

  const toggleFavorite = async () => {
    if (!nombreLugar) return;
    
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

  const normalizedWebsite = lugar?.website
    ? (lugar.website.startsWith("http://") || lugar.website.startsWith("https://")
        ? lugar.website
        : `https://${lugar.website}`)
    : null;

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
          <h1>Lugar o negocio no encontrado</h1>
          <p>No pudimos encontrar informacion publica sobre este lugar.</p>
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
        {fotos.length > 0 && (
          <img
            src={fotos[0]}
            alt={lugar.nombre}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, zIndex: 0 }}
          />
        )}
        <div className={styles.heroOverlay} style={{ zIndex: 1 }}></div>
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
            <div className={styles.titleTopRow}>
              <span className={styles.categoryBadge}>{lugar.categoria}</span>
              <div className={styles.titleRatingCorner}>
                <PlaceRating
                  placeName={lugar.nombre}
                  showLabel={true}
                  size="large"
                  displayMode="split"
                />
              </div>
            </div>
            <h1 className={styles.title}>{lugar.nombre}</h1>
          </div>

          {/* Galería dividida: visor principal + miniaturas */}
          {fotos.length > 0 && (
            <section className={styles.gallerySplit}>
              <div className={styles.galleryViewer}>
                <img
                  src={fotos[fotoIdx]}
                  alt={`${lugar.nombre} imagen ${fotoIdx + 1}`}
                  className={styles.galleryMainImage}
                />
              </div>

              {fotos.length > 1 && (
                <aside className={styles.galleryThumbsColumn}>
                  {fotos
                    .map((foto, idx) => ({ foto, idx }))
                    .map((item) => (
                      <button
                        key={`${item.foto}-${item.idx}`}
                        type="button"
                        className={`${styles.galleryThumbButton} ${item.idx === fotoIdx ? styles.galleryThumbButtonActive : ''}`}
                        onClick={() => setFotoIdx(item.idx)}
                        aria-label={`Ver imagen ${item.idx + 1}`}
                        aria-pressed={item.idx === fotoIdx}
                      >
                        <img
                          src={item.foto}
                          alt={`${lugar.nombre} miniatura ${item.idx + 1}`}
                          className={styles.galleryThumbImage}
                        />
                      </button>
                    ))}
                </aside>
              )}
            </section>
          )}

          {/* Descripcion + panel derecho (tiempo/costo/contacto) */}
          <div className={styles.overviewLayout}>
            <section className={styles.descriptionColumn}>
              <div className={styles.descriptionCard}>
                <div className={styles.infoHeader}>
                  <FiInfo />
                  <h2>Descripción</h2>
                </div>
                <p className={styles.infoText}>
                  {lugar.notaIA || "Este lugar o negocio no tiene descripción pública disponible por el momento."}
                </p>
              </div>
            </section>

            <aside className={styles.quickInfoColumn}>
              <div className={styles.quickInfoStack}>
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

              {(lugar.telefono || normalizedWebsite || lugar.email) && (
                <div className={styles.quickContactCard}>
                  <div className={styles.infoHeader}>
                    <FiInfo />
                    <h2>Contacto</h2>
                  </div>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {lugar.telefono && (
                      <a
                        href={`tel:${lugar.telefono}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600 }}
                      >
                        <FiPhone /> {lugar.telefono}
                      </a>
                    )}

                    {normalizedWebsite && (
                      <a
                        href={normalizedWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600, wordBreak: "break-all" }}
                      >
                        <FiGlobe /> {lugar.website}
                      </a>
                    )}

                    {lugar.email && (
                      <a
                        href={`mailto:${lugar.email}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600, wordBreak: "break-all" }}
                      >
                        <FiMail /> {lugar.email}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Descripción cultural */}
          {CULTURA_DESCRIPTIONS[lugar.nombre] && (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <FiInfo />
                <h2>Significado cultural</h2>
              </div>
              <p className={styles.infoText}>{CULTURA_DESCRIPTIONS[lugar.nombre]}</p>
            </div>
          )}

          {/* Mapa + Sidebar de ubicacion */}
          <section className={styles.mapSection}>
            <h2 className={styles.mapTitle}>Mapa</h2>
            <div className={styles.mapAndSidebar}>
              <div className={styles.mapColumn}>
                <div className={styles.mapContainer}>
                  <iframe
                    src={getMapEmbedSrc(lugar)}
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

              <aside className={styles.sidebarColumn}>
                <div className={styles.locationCard}>
                  <div className={styles.locationHeader}>
                    <FiMapPin />
                    <h2>Ubicación</h2>
                  </div>
                  <p className={styles.locationAddress}>{lugar.direccion}</p>
                  {lugar.codigoPostal && (
                    <p className={styles.locationMeta}>CP: {lugar.codigoPostal}</p>
                  )}
                  <button onClick={abrirEnMaps} className={styles.directionsBtn}>
                    <FiNavigation /> Cómo llegar
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

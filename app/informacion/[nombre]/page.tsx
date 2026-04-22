"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiClock, FiDollarSign, FiInfo, FiArrowLeft, FiNavigation, FiHeart, FiShare2, FiPhone, FiGlobe, FiMail, FiPlus, FiX, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getHorario, getDiaIdx, formatRango, DIAS_ES, NOMBRE_DIA } from "../horariosData";
import styles from "../informacion.module.css";
import { useFavoritesSync } from "@/lib/favoritesApi";
import DeletedBusinessModal from "@/app/components/DeletedBusinessModal";
import PlaceRating from "@/app/components/PlaceRating";
import { usePlaceView } from "@/lib/usePlaceView";
import { getMergedPlaces, PlaceRecord } from "@/lib/placesApi";

const APPROVED_TOAST_DISMISSED_BY_BUSINESS_KEY = "pitzbol_approved_business_toast_dismissed_by_business_v2";
const APPROVED_TOAST_PENDING_KEY = "pitzbol_approved_business_toast_pending_v2";
const DELETED_BUSINESS_NOTIFICATIONS_KEY_PREFIX = "pitzbol_deleted_business_notifications_";

type ApprovedToastPendingPayload = {
  businessId?: string;
  businessName?: string;
};

type DeletedBusinessNotification = {
  titulo: string;
  mensaje: string;
  fecha: string;
};

function getApprovedToastPendingPayload(): ApprovedToastPendingPayload | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(APPROVED_TOAST_PENDING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ApprovedToastPendingPayload;
    if (!parsed || (typeof parsed !== "object")) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getApprovedToastDismissedMap(): Record<string, true> {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(APPROVED_TOAST_DISMISSED_BY_BUSINESS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, true>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

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
  "El Parián de Tlaquepaque, Guadalajara":
    "El Parián en Tlaquepaque es principalmente un lugar emblemático y un complejo turístico, conocido como la cantina más grande del mundo. Se trata de un edificio histórico rodeado de arcadas que alberga en su interior 18 o 19 restaurantes y bares distintos alrededor de un quiosco central. Es un punto de encuentro clásico para escuchar mariachi, comer platillos típicos y beber cazuelas de tequila.",
};

interface Lugar {
  nombre: string;
  categoria: string;
  etiquetas: string[];
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
  negocioId?: string;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getDeletedBusinessNotificationsStorageKey(userId: string): string {
  return `${DELETED_BUSINESS_NOTIFICATIONS_KEY_PREFIX}${userId}`;
}

function getPersistedDeletedBusinessNotification(businessName: string): DeletedBusinessNotification | null {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("pitzbol_user");
  if (!storedUser) return null;

  try {
    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser?.uid;
    if (!userId) return null;

    const raw = localStorage.getItem(getDeletedBusinessNotificationsStorageKey(userId));
    if (!raw) return null;

    const map = JSON.parse(raw) as Record<string, DeletedBusinessNotification>;
    const businessKey = `name:${normalizeName(businessName)}`;
    return map[businessKey] || null;
  } catch {
    return null;
  }
}

function mapPlaceToPublicDetail(place: PlaceRecord): Lugar {
  const lat = parseFloat(place.latitud || "");
  const lng = parseFloat(place.longitud || "");
  const placeAsAny = place as PlaceRecord & {
    tiempoEstancia?: number;
    costoEstimado?: string;
  };

  const etiquetas = (place as PlaceRecord & { rawCategoria?: string }).rawCategoria
    ? (place as PlaceRecord & { rawCategoria?: string }).rawCategoria!
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : place.categoria
    ? [place.categoria]
    : [];

  return {
    nombre: place.nombre,
    categoria: place.categoria || "Negocio",
    etiquetas,
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
    negocioId: place.negocioId,
  };
}

function getMapEmbedSrc(lugar: Lugar): string {
  const hasCoordinates = lugar.latitud !== 0 && lugar.longitud !== 0;
  if (hasCoordinates) {
    const delta = 0.005;
    const left = lugar.longitud - delta;
    const right = lugar.longitud + delta;
    const top = lugar.latitud + delta;
    const bottom = lugar.latitud - delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lugar.latitud}%2C${lugar.longitud}`;
  }

  const query = encodeURIComponent(lugar.direccion || lugar.nombre);
  return `https://www.openstreetmap.org/export/embed.html?bbox=-103.45%2C20.59%2C-103.25%2C20.76&layer=mapnik&query=${query}`;
}

const EMAIL_ADMIN_LUGARES = "cua@hotmail.com";

const TODAS_CATEGORIAS = [
  "Gastronomía", "Cultura", "Vida Nocturna", "Cafetería", "Futbol",
  "Arte", "Deporte", "Turismo", "Compras", "Hotel", "Transporte",
  "Salud", "Hospital", "Entretenimiento", "Museos", "Naturaleza",
  "Mercado", "Bar", "Restaurante", "Museo", "Parque", "Estadio",
];

export default function InformacionLugar() {
  const params = useParams();
  const router = useRouter();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoIdx, setFotoIdx] = useState(0);
  const [deletedBusinessNotification, setDeletedBusinessNotification] = useState<DeletedBusinessNotification | null>(null);
  const [showDeletedBusinessModal, setShowDeletedBusinessModal] = useState(false);
  const [esAdminLugares, setEsAdminLugares] = useState(false);
  const [etiquetasEdit, setEtiquetasEdit] = useState<string[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [guardandoCats, setGuardandoCats] = useState(false);
  const [mensajeCats, setMensajeCats] = useState("");
  const [editTiempo, setEditTiempo] = useState('');
  const [editCosto, setEditCosto] = useState('');
  const [editandoInfo, setEditandoInfo] = useState(false);
  const [guardandoInfo, setGuardandoInfo] = useState(false);
  const [mensajeInfo, setMensajeInfo] = useState('');
  // Registrar vista del lugar
  const nombreRaw = params.nombre;
  const nombreLugar = typeof nombreRaw === "string" ? decodeURIComponent(nombreRaw) : null;
  const normalizedBusinessName = nombreLugar ? normalizeName(nombreLugar) : "";
  usePlaceView(nombreLugar);

  const [showApprovedToast, setShowApprovedToast] = useState(false);
  // Estado de depuración para mostrar condiciones del toast
  const [debugToast, setDebugToast] = useState({
    cameFromBusinessManagement: false,
    hasPendingTrigger: false,
    dismissed: false,
    nombreLugar: nombreLugar || '',
    urlParams: '',
    localStoragePending: '',
    localStorageDismissed: '',
  });

  const { getFavorites, addFavorite, removeFavorite: removeFavoriteApi, syncLocalFavorites, isAuthenticated } = useFavoritesSync();

  useEffect(() => {
    if (fotos.length <= 1) return;
    const timer = setInterval(() => setFotoIdx(i => (i + 1) % fotos.length), 4000);
    return () => clearInterval(timer);
  }, [fotos.length]);


  useEffect(() => {
    if (!nombreLugar || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const cameFromBusinessManagement = urlParams.get("origen") === "gestion-negocios-activo";
    const pendingPayload = getApprovedToastPendingPayload();
    const pendingBusinessName = pendingPayload?.businessName ? normalizeName(pendingPayload.businessName) : "";
    const hasPendingTrigger = !!pendingBusinessName && pendingBusinessName === normalizedBusinessName;
    const dismissedMap = getApprovedToastDismissedMap();
    const dismissed = !!dismissedMap[normalizedBusinessName];

    setDebugToast({
      cameFromBusinessManagement,
      hasPendingTrigger,
      dismissed,
      nombreLugar: nombreLugar || '',
      urlParams: window.location.search,
      localStoragePending: localStorage.getItem(APPROVED_TOAST_PENDING_KEY) || '',
      localStorageDismissed: dismissed ? "1" : "",
    });

    if ((cameFromBusinessManagement || hasPendingTrigger) && !dismissed) {
      setShowApprovedToast(true);
    }

    if (pendingPayload) {
      localStorage.removeItem(APPROVED_TOAST_PENDING_KEY);
    }
  }, [nombreLugar, normalizedBusinessName]);

  const dismissApprovedToast = () => {
    setShowApprovedToast(false);
    if (typeof window !== "undefined") {
      const dismissedMap = getApprovedToastDismissedMap();
      dismissedMap[normalizedBusinessName] = true;
      localStorage.setItem(APPROVED_TOAST_DISMISSED_BY_BUSINESS_KEY, JSON.stringify(dismissedMap));
    }
  };

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
        if (lugarEncontrado) {
          setEtiquetasEdit(lugarEncontrado.etiquetas);
          setEditTiempo(String(lugarEncontrado.tiempoEstancia));
          setEditCosto(lugarEncontrado.costoEstimado);
        }

        const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
        setEsAdminLugares(userLocal.email === EMAIL_ADMIN_LUGARES);

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

  useEffect(() => {
    if (!nombreLugar || typeof window === "undefined") return;

    const deletedNotification = getPersistedDeletedBusinessNotification(nombreLugar);
    if (deletedNotification) {
      setDeletedBusinessNotification(deletedNotification);
      setShowDeletedBusinessModal(true);
      return;
    }

    setDeletedBusinessNotification(null);
    setShowDeletedBusinessModal(false);
  }, [nombreLugar, lugar]);

  const abrirEnMaps = () => {
    if (lugar) {
      const hasCoordinates = lugar.latitud !== 0 && lugar.longitud !== 0;
      const query = encodeURIComponent(lugar.direccion || lugar.nombre);
      const url = hasCoordinates
        ? `https://www.openstreetmap.org/?mlat=${lugar.latitud}&mlon=${lugar.longitud}#map=17/${lugar.latitud}/${lugar.longitud}`
        : `https://www.openstreetmap.org/search?query=${query}`;
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

  const guardarCategorias = async () => {
    if (!nombreLugar || etiquetasEdit.length === 0) return;
    setGuardandoCats(true);
    setMensajeCats("");
    const token = localStorage.getItem("pitzbol_token");
    try {
      const res = await fetch(`/api/lugares/${encodeURIComponent(nombreLugar)}/categorias`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ categorias: etiquetasEdit }),
      });
      if (res.ok) {
        setLugar(prev => prev ? { ...prev, etiquetas: etiquetasEdit } : prev);
        setMensajeCats("✓ Guardado");
        setMostrarSelector(false);
      } else {
        setMensajeCats("Error al guardar");
      }
    } catch {
      setMensajeCats("Error de conexión");
    } finally {
      setGuardandoCats(false);
      setTimeout(() => setMensajeCats(""), 3000);
    }
  };

  const guardarInfo = async () => {
    if (!nombreLugar) return;
    setGuardandoInfo(true);
    setMensajeInfo("");
    const token = localStorage.getItem("pitzbol_token");
    try {
      const res = await fetch(`/api/lugares/${encodeURIComponent(nombreLugar)}/info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          tiempoEstancia: Number(editTiempo),
          costoEstimado: editCosto,
        }),
      });
      if (res.ok) {
        setLugar(prev => prev ? { ...prev, tiempoEstancia: Number(editTiempo), costoEstimado: editCosto } : prev);
        setMensajeInfo("✓ Guardado");
        setEditandoInfo(false);
      } else {
        setMensajeInfo("Error al guardar");
      }
    } catch {
      setMensajeInfo("Error de conexión");
    } finally {
      setGuardandoInfo(false);
      setTimeout(() => setMensajeInfo(""), 3000);
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

  if (!lugar && !showDeletedBusinessModal) {
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

  if (showDeletedBusinessModal && deletedBusinessNotification) {
    return (
      <DeletedBusinessModal
        isOpen={showDeletedBusinessModal}
        onClose={() => router.push("/negocio/mis-solicitudes")}
        notification={deletedBusinessNotification}
        businessName={nombreLugar || undefined}
      />
    );
  }

  const lugarSeguro = lugar as Lugar;

  return (
    <div className={styles.container}>
      {showApprovedToast && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={styles.toastAprobado}
          role="status"
          aria-live="polite"
        >
          <div className={styles.toastAprobadoIcon}>✓</div>
          <div className={styles.toastAprobadoContent}>
            <p className={styles.toastAprobadoTitle}>Negocio aprobado y publicado</p>
            <p className={styles.toastAprobadoMessage}>
              Tu negocio fue aprobado por el admin y ahora se encuentra visible para todos los usuarios.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissApprovedToast}
            className={styles.toastAprobadoClose}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </motion.div>
      )}


      {/* Header con imagen de fondo */}
      <div className={styles.heroHeader}>
        {fotos.length > 0 && (
          <img
            src={fotos[0]}
            alt={lugarSeguro.nombre}
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
            {lugarSeguro.nombre}
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
              whileHover={{ scale: 1.1 }}
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
              <span className={styles.categoryBadge}>{lugarSeguro.categoria}</span>
              {lugarSeguro.categoria === "Transporte" && lugarSeguro.negocioId && (
                <a
                  href={`/empresa/transportes/${lugarSeguro.negocioId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A4D2E] text-white text-xs font-semibold hover:bg-[#0D601E] transition-colors"
                >
                  Ver perfil de empresa
                </a>
              )}
              <div className={styles.titleRatingCorner}>
                <PlaceRating
                  placeName={lugarSeguro.nombre}
                  showLabel={true}
                  size="large"
                  displayMode="split"
                />
              </div>
            </div>
            <h1 className={styles.title}>{lugarSeguro.nombre}</h1>
          </div>

          {/* Galería: carrusel + panel de horario */}
          <section className={styles.gallerySplit}>
            {/* Carrusel */}
            <div className={styles.galleryViewer} style={{ position: 'relative' }}>
              {fotos.length > 0 ? (
                <img
                  key={fotoIdx}
                  src={fotos[fotoIdx]}
                  alt={`${lugarSeguro.nombre} imagen ${fotoIdx + 1}`}
                  className={styles.galleryMainImage}
                  style={{ animation: 'fadeInPhoto 0.5s ease' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 180, background: '#E0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.875rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>📷</span>
                </div>
              )}
              {fotos.length > 1 && (
                <>
                  <button
                    onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                    aria-label="Imagen anterior"
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <FiChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setFotoIdx(i => (i + 1) % fotos.length)}
                    aria-label="Imagen siguiente"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <FiChevronRight size={18} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                    {fotoIdx + 1}/{fotos.length}
                  </div>
                </>
              )}
            </div>

            {/* Panel horario por día */}
            {(() => {
              const horario = getHorario(lugarSeguro.nombre);
              const hoy = getDiaIdx();
              return (
                <div style={{ background: '#F7F9F4', borderRadius: '0.875rem', padding: '1.1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <FiClock color="#1A4D2E" size={16} />
                    <span style={{ fontWeight: 700, color: '#1A4D2E', fontSize: '0.88rem' }}>Horario</span>
                  </div>
                  {horario ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                      {DIAS_ES.map(dia => {
                        const esHoy = dia === hoy;
                        const rango = formatRango(horario[dia]);
                        const cerrado = rango === 'Cerrado';
                        return (
                          <div key={dia} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.18rem 0.35rem', borderRadius: '0.4rem', background: esHoy ? '#E8F5E9' : 'transparent' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: esHoy ? 700 : 500, color: esHoy ? '#1A4D2E' : '#4b5563', minWidth: 72 }}>
                              {NOMBRE_DIA[dia]}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: esHoy ? 700 : 400, color: cerrado ? '#dc2626' : esHoy ? '#0D601E' : '#374151', textAlign: 'right' }}>
                              {rango}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ color: '#9ca3af', fontSize: '0.83rem', fontWeight: 500 }}>Horario no disponible</span>
                      <span style={{ color: '#d1d5db', fontSize: '0.72rem' }}>Consulta directamente al lugar</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Etiquetas + panel derecho (tiempo/costo/contacto) */}
          <div className={styles.overviewLayout}>
            <section className={styles.descriptionColumn}>
              {(lugarSeguro.etiquetas.length > 0 || esAdminLugares) && (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    {(esAdminLugares ? etiquetasEdit : lugarSeguro.etiquetas).map((etiqueta) => (
                      <span
                        key={etiqueta}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          background: "#E0F2F1",
                          color: "#1A4D2E",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "999px",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {etiqueta}
                        {esAdminLugares && (
                          <button
                            onClick={() => setEtiquetasEdit(prev => prev.filter(e => e !== etiqueta))}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#1A4D2E", display: "flex", alignItems: "center" }}
                            title="Eliminar etiqueta"
                          >
                            <FiX size={11} />
                          </button>
                        )}
                      </span>
                    ))}

                    {esAdminLugares && (
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setMostrarSelector(prev => !prev)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            background: "#1A4D2E", color: "white", border: "none",
                            fontWeight: 600, fontSize: "0.75rem", padding: "0.3rem 0.65rem",
                            borderRadius: "999px", cursor: "pointer",
                          }}
                          title="Agregar etiqueta"
                        >
                          <FiPlus size={11} /> Agregar
                        </button>

                        {mostrarSelector && (
                          <div style={{
                            position: "absolute", top: "2rem", left: 0, zIndex: 50,
                            background: "white", border: "1px solid #e5e7eb",
                            borderRadius: "0.75rem", padding: "0.75rem",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                            display: "flex", flexWrap: "wrap", gap: "0.4rem", maxWidth: "280px",
                          }}>
                            {TODAS_CATEGORIAS.filter(c => !etiquetasEdit.includes(c)).map(cat => (
                              <button
                                key={cat}
                                onClick={() => { setEtiquetasEdit(prev => [...prev, cat]); }}
                                style={{
                                  background: "#f3f4f6", color: "#374151", border: "none",
                                  fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.6rem",
                                  borderRadius: "999px", cursor: "pointer",
                                }}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {esAdminLugares && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                      <button
                        onClick={guardarCategorias}
                        disabled={guardandoCats}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.4rem",
                          background: "#1A4D2E", color: "white", border: "none",
                          fontSize: "0.75rem", fontWeight: 600, padding: "0.4rem 1rem",
                          borderRadius: "0.5rem", cursor: "pointer", opacity: guardandoCats ? 0.6 : 1,
                        }}
                      >
                        <FiCheck size={12} /> {guardandoCats ? "Guardando..." : "Guardar categorías"}
                      </button>
                      {mensajeCats && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: mensajeCats.startsWith("✓") ? "#16a34a" : "#dc2626" }}>
                          {mensajeCats}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <aside className={styles.quickInfoColumn}>
              <div className={styles.quickInfoStack}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FiClock />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Tiempo sugerido</span>
                    {esAdminLugares && editandoInfo ? (
                      <input
                        type="number"
                        value={editTiempo}
                        onChange={e => setEditTiempo(e.target.value)}
                        min={1}
                        style={{ width: "80px", fontSize: "0.9rem", fontWeight: 700, border: "1px solid #1A4D2E", borderRadius: "6px", padding: "2px 6px", color: "#1A4D2E" }}
                      />
                    ) : (
                      <span className={styles.statValue}>{lugarSeguro.tiempoEstancia} min</span>
                    )}
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FiDollarSign />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Costo estimado</span>
                    {esAdminLugares && editandoInfo ? (
                      <input
                        type="text"
                        value={editCosto}
                        onChange={e => setEditCosto(e.target.value)}
                        placeholder="ej. $100 – $300"
                        style={{ width: "120px", fontSize: "0.9rem", fontWeight: 700, border: "1px solid #1A4D2E", borderRadius: "6px", padding: "2px 6px", color: "#1A4D2E" }}
                      />
                    ) : (
                      <span className={styles.statValue}>{lugarSeguro.costoEstimado}</span>
                    )}
                  </div>
                </div>
              </div>

              {esAdminLugares && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                  {editandoInfo ? (
                    <>
                      <button
                        onClick={guardarInfo}
                        disabled={guardandoInfo}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#1A4D2E", color: "white", border: "none", fontSize: "0.75rem", fontWeight: 600, padding: "0.4rem 1rem", borderRadius: "0.5rem", cursor: "pointer", opacity: guardandoInfo ? 0.6 : 1 }}
                      >
                        <FiCheck size={12} /> {guardandoInfo ? "Guardando..." : "Guardar info"}
                      </button>
                      <button
                        onClick={() => { setEditandoInfo(false); setEditTiempo(String(lugarSeguro.tiempoEstancia)); setEditCosto(lugarSeguro.costoEstimado); }}
                        style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditandoInfo(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f3f4f6", color: "#1A4D2E", border: "1px solid #d1d5db", fontSize: "0.75rem", fontWeight: 600, padding: "0.4rem 1rem", borderRadius: "0.5rem", cursor: "pointer" }}
                    >
                      ✏️ Editar tiempo / costo
                    </button>
                  )}
                  {mensajeInfo && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: mensajeInfo.startsWith("✓") ? "#16a34a" : "#dc2626" }}>
                      {mensajeInfo}
                    </span>
                  )}
                </div>
              )}

              {(lugarSeguro.telefono || normalizedWebsite || lugarSeguro.email) && (
                <div className={styles.quickContactCard}>
                  <div className={styles.infoHeader}>
                    <FiInfo />
                    <h2>Contacto</h2>
                  </div>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {lugarSeguro.telefono && (
                      <a
                        href={`tel:${lugarSeguro.telefono}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600 }}
                      >
                        <FiPhone /> {lugarSeguro.telefono}
                      </a>
                    )}

                    {normalizedWebsite && (
                      <a
                        href={normalizedWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600, wordBreak: "break-all" }}
                      >
                        <FiGlobe /> {lugarSeguro.website}
                      </a>
                    )}

                    {lugarSeguro.email && (
                      <a
                        href={`mailto:${lugarSeguro.email}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A4D2E", fontWeight: 600, wordBreak: "break-all" }}
                      >
                        <FiMail /> {lugarSeguro.email}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Descripción cultural */}
          {CULTURA_DESCRIPTIONS[lugarSeguro.nombre] && (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <FiInfo />
                <h2>Significado cultural</h2>
              </div>
              <p className={styles.infoText}>{CULTURA_DESCRIPTIONS[lugarSeguro.nombre]}</p>
            </div>
          )}

          {/* Mapa + Sidebar de ubicacion */}
          <section className={styles.mapSection}>
            <h2 className={styles.mapTitle}>Mapa</h2>
            <div className={styles.mapAndSidebar}>
              <div className={styles.mapColumn}>
                <div className={styles.mapContainer}>
                  <iframe
                    src={getMapEmbedSrc(lugarSeguro)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${lugarSeguro.nombre}`}
                  />
                </div>
              </div>

              <aside className={styles.sidebarColumn}>
                <div className={styles.locationCard}>
                  <div className={styles.locationHeader}>
                    <FiMapPin />
                    <h2>Ubicación</h2>
                  </div>
                  <p className={styles.locationAddress}>{lugarSeguro.direccion}</p>
                  {lugarSeguro.codigoPostal && (
                    <p className={styles.locationMeta}>CP: {lugarSeguro.codigoPostal}</p>
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

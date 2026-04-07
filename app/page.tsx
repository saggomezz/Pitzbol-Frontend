"use client";
import { generarItinerarioManual, Lugar } from '@/lib/pitzbol-engine';
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { Suspense, useEffect, useRef, useState } from "react";
import { FiBriefcase, FiCalendar, FiChevronLeft, FiChevronRight, FiHeart, FiMapPin, FiMenu, FiRefreshCw, FiSearch, FiUser, FiX } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";
import WelcomeNotification from './components/WelcomeNotification';
import { getPlaceImageByCategory } from '@/lib/placeImages';
import PlaceRating from './components/PlaceRating';
import { getMergedPlaces } from '@/lib/placesApi';
import AuthModal from './components/AuthModal';

type Category = { name: string; img: string; };
type DateInfo = { day: string; weekday: string; fullDate: string; isGdlMatch: boolean; isActive: boolean; };
type RecommendedPlace = { name: string; img: string | null; categoria?: string; };

const INTERES_TO_CATEGORIES: Record<string, string[]> = {
  "Arte e Historia": ["Arte e Historia"],
  "Arquitectura": ["Arquitectura"],
  "Cultura": ["Cultura"],
  "Gastronomía": ["Gastronomía", "Gastronomía Mexicana"],
  "Deporte Fútbol": ["Fútbol"],
  "Música": ["Música"],
  "Naturaleza": ["Naturaleza"],
  "Fotografía": ["Fotografía"],
  "Vida Nocturna": ["Vida Nocturna"],
  "Compras": ["Compras"],
  "Museos": ["Museos"],
  "Tours Guiados": ["Cultura", "Arte e Historia", "Museos"],
  "Aventura": ["Aventura"],
  "Religión": ["Cultura"],
  "Mercados Locales": ["Mercados Locales"],
};

const DEFAULT_RECOMMENDATIONS: RecommendedPlace[] = [
  { name: "Centro de Guadalajara", img: "https://www.liderempresarial.com/wp-content/uploads/2025/07/Asi-se-transformara-el-centro-de-Guadalajara-%C2%BFcuando-estara-listo.jpg" },
  { name: "Tlaquepaque", img: "https://image-tc.galaxy.tf/wijpeg-5ifzorsfl8d2dm64kutj586du/tlaquepaque.jpg" },
  { name: "Tequila, Jalisco", img: "https://visitmexico.com/media/usercontent/67fd7d33baf74-Tequila-2_gmxdot_jpeg" },
  { name: "Hueso Restaurante", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800", categoria: "Gastronomía" },
  { name: "Mutante Restaurante", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800", categoria: "Gastronomía" },
  { name: "Cuerno Andares", img: "https://images.unsplash.com/photo-1484659619207-9165d119dafe?auto=format&fit=crop&q=80&w=800", categoria: "Gastronomía" },
];

const ALL_CATEGORIES: Category[] = [
  { name: "Fútbol", img: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=2070" },
  { name: "Gastronomía", img: "https://images.unsplash.com/photo-1711306722944-70b776bb4394?auto=format&fit=crop&q=80&w=1528" },
  { name: "Arte", img: "https://museocabanas.jalisco.gob.mx/wp-content/uploads/2024/08/1.png" },
  { name: "Cultura", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Voladores_de_Papantla.png/1200px-Voladores_de_Papantla.png" },
  { name: "Eventos", img: "https://www.buenosviajes.co/wp-content/uploads/2024/03/Guadalajara2.jpg" },
  { name: "Casas de Cambio", img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1528" },
  { name: "Hospitales", img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1700" },
  { name: "Médico", img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&q=80&w=1528" },
];

type Partido = { fecha: string; fechaDisplay: string; hora: string; equipo1: string; bandera1: string; equipo2: string; bandera2: string; sede?: string; };

const PARTIDOS_GDL: Partido[] = [
  { fecha: "2026-06-11", fechaDisplay: "11 de Junio", hora: "20:00", equipo1: "Corea del Sur", bandera1: "https://flagcdn.com/kr.svg", equipo2: "Dinamarca", bandera2: "https://flagcdn.com/dk.svg" },
  { fecha: "2026-06-15", fechaDisplay: "15 de Junio", hora: "16:00", equipo1: "Portugal", bandera1: "https://flagcdn.com/pt.svg", equipo2: "Marruecos", bandera2: "https://flagcdn.com/ma.svg" },
  { fecha: "2026-06-19", fechaDisplay: "19 de Junio", hora: "19:00", equipo1: "Argentina", bandera1: "https://flagcdn.com/ar.svg", equipo2: "Chile", bandera2: "https://flagcdn.com/cl.svg" },
  { fecha: "2026-06-22", fechaDisplay: "22 de Junio", hora: "20:00", equipo1: "España", bandera1: "https://flagcdn.com/es.svg", equipo2: "Croacia", bandera2: "https://flagcdn.com/hr.svg" },
  { fecha: "2026-06-26", fechaDisplay: "26 de Junio", hora: "18:00", equipo1: "Brasil", bandera1: "https://flagcdn.com/br.svg", equipo2: "Uruguay", bandera2: "https://flagcdn.com/uy.svg" },
  { fecha: "2026-07-02", fechaDisplay: "2 de Julio", hora: "20:00", equipo1: "Por definir", bandera1: "https://flagcdn.com/un.svg", equipo2: "Por definir", bandera2: "https://flagcdn.com/un.svg" },
];

const PARTIDOS_CDMX: Partido[] = [
  { fecha: "2026-06-11", fechaDisplay: "11 de Junio", hora: "13:00", equipo1: "México", bandera1: "https://flagcdn.com/mx.svg", equipo2: "Sudáfrica", bandera2: "https://flagcdn.com/za.svg" },
  { fecha: "2026-06-17", fechaDisplay: "17 de Junio", hora: "16:00", equipo1: "Colombia", bandera1: "https://flagcdn.com/co.svg", equipo2: "Bélgica", bandera2: "https://flagcdn.com/be.svg" },
  { fecha: "2026-06-22", fechaDisplay: "22 de Junio", hora: "19:00", equipo1: "México", bandera1: "https://flagcdn.com/mx.svg", equipo2: "Ecuador", bandera2: "https://flagcdn.com/ec.svg" },
  { fecha: "2026-06-26", fechaDisplay: "26 de Junio", hora: "13:00", equipo1: "México", bandera1: "https://flagcdn.com/mx.svg", equipo2: "Polonia", bandera2: "https://flagcdn.com/pl.svg" },
  { fecha: "2026-07-02", fechaDisplay: "2 de Julio", hora: "20:00", equipo1: "Por definir", bandera1: "https://flagcdn.com/un.svg", equipo2: "Por definir", bandera2: "https://flagcdn.com/un.svg" },
];

const PARTIDOS_MTY: Partido[] = [
  { fecha: "2026-06-12", fechaDisplay: "12 de Junio", hora: "13:00", equipo1: "Uruguay", bandera1: "https://flagcdn.com/uy.svg", equipo2: "Bolivia", bandera2: "https://flagcdn.com/bo.svg" },
  { fecha: "2026-06-16", fechaDisplay: "16 de Junio", hora: "19:00", equipo1: "Holanda", bandera1: "https://flagcdn.com/nl.svg", equipo2: "Senegal", bandera2: "https://flagcdn.com/sn.svg" },
  { fecha: "2026-06-20", fechaDisplay: "20 de Junio", hora: "16:00", equipo1: "Uruguay", bandera1: "https://flagcdn.com/uy.svg", equipo2: "Irak", bandera2: "https://flagcdn.com/iq.svg" },
  { fecha: "2026-06-24", fechaDisplay: "24 de Junio", hora: "19:00", equipo1: "Holanda", bandera1: "https://flagcdn.com/nl.svg", equipo2: "Por definir", bandera2: "https://flagcdn.com/un.svg" },
  { fecha: "2026-07-01", fechaDisplay: "1 de Julio", hora: "20:00", equipo1: "Por definir", bandera1: "https://flagcdn.com/un.svg", equipo2: "Por definir", bandera2: "https://flagcdn.com/un.svg" },
];

const dates: DateInfo[] = [
  { day: "10", weekday: "MIE", fullDate: "2026-06-10", isGdlMatch: false, isActive: false },
  { day: "11", weekday: "JUE", fullDate: "2026-06-11", isGdlMatch: true, isActive: true },
  { day: "12", weekday: "VIE", fullDate: "2026-06-12", isGdlMatch: false, isActive: false },
  { day: "13", weekday: "SAB", fullDate: "2026-06-13", isGdlMatch: false, isActive: false },
  { day: "14", weekday: "DOM", fullDate: "2026-06-14", isGdlMatch: false, isActive: false },
];

interface MatchProps {
  location: string;
  date: string;
  team1: string;
  flag1: string;
  team2: string;
  flag2: string;
  time: string;
}

const DateSlider = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Estado para el modal

  const getDates = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        day: date.getDate().toString(),
        weekday: date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const dynamicDates = getDates();

return (
    <>
      <div className="bg-white md:bg-transparent py-2 md:py-1 w-full overflow-hidden">
        <div className="flex gap-2 md:gap-0 px-3 md:px-0 justify-center items-center w-full max-w-7xl mx-auto">
          {dynamicDates.map((date, index) => {
            let bgColor = index === 0 ? "bg-[#0D601E]" : index === 1 ? "bg-white border-y border-gray-100 shadow-sm" : "bg-[#B90808]";
            let textColor = index === 1 ? "text-[#6F4545]" : "text-white";

            return (
              <div
                key={date.fullDate}
                className={`
                  relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all
                  h-14 md:h-12 min-w-[70px]
                  ${index === 0 ? "rounded-l-[12px] md:rounded-l-[20px]" : ""}
                  ${index === 2 ? "rounded-r-[12px] md:rounded-r-[20px]" : ""}
                  ${bgColor}
                `}
              >
                <div 
                  className={`text-xl md:text-2xl font-normal leading-tight ${textColor}`}
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {date.day}
                </div>
                <div 
                  className={`text-[10px] md:text-xs font-normal uppercase ${textColor}`}
                  style={{ fontFamily: "var(--font-jockey)" }}
                >
                  {date.weekday}
                </div>

                {index === 0 && (
                  <div className="absolute -top-1 -left-1 md:top-0 md:left-2 z-10">
                    <GiSoccerBall size={16} className="text-black bg-white rounded-full p-0.5 shadow-md animate-bounce md:w-[18px] md:h-[18px]" style={{ animationDuration: '3s' }} />
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/calendario">
            <button className="ml-1 md:ml-2 p-2 md:p-3 text-black hover:scale-110 transition-transform flex-shrink-0">
              <FiChevronRight size={28} className="md:w-[35px] md:h-[35px]" />
            </button>
          </Link>
        </div>
      </div>

    </>
  );
};

const GdlMatchCarousel = ({ partidos, sede, tHome }: { partidos: Partido[]; sede: string; tHome: any }) => {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const current = partidos[idx];
  const prev = () => { setDir(-1); setIdx(i => Math.max(0, i - 1)); };
  const next = () => { setDir(1); setIdx(i => Math.min(partidos.length - 1, i + 1)); };
  return (
    <div className="w-full mb-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-center text-[#0D601E] text-xs md:text-sm font-medium flex-1" style={{ fontFamily: 'var(--font-roboto)' }}>
          {tHome('nextMatchIn')} <span className="font-bold">{sede}</span> - {current.fechaDisplay}
        </h3>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button onClick={prev} disabled={idx === 0} className="p-0.5 rounded-full hover:bg-[#E0F2F1] disabled:opacity-30 transition-all text-[#0D601E]"><FiChevronLeft size={14} /></button>
          <span className="text-[10px] text-[#769C7B] font-medium">{idx + 1}/{partidos.length}</span>
          <button onClick={next} disabled={idx === partidos.length - 1} className="p-0.5 rounded-full hover:bg-[#E0F2F1] disabled:opacity-30 transition-all text-[#0D601E]"><FiChevronRight size={14} /></button>
        </div>
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={idx}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-4 md:gap-8 bg-[#B3ACAC] text-white rounded-[15px] md:rounded-[20px] px-3 md:px-5 py-2 shadow-md min-h-[60px] md:min-h-[50px]"
          >
            <div className="flex flex-1 items-center justify-end gap-2">
              <span className="text-xs md:text-base font-normal text-right leading-tight" style={{ fontFamily: 'var(--font-roboto)' }}>{current.equipo1}</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-white/30">
                <Image src={current.bandera1} alt={current.equipo1} fill className="object-cover" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-2 md:px-4 border-x border-white/20 mx-2">
              <span className="text-base md:text-xl font-bold text-black leading-none" style={{ fontFamily: 'var(--font-roboto)' }}>{current.hora}</span>
              <span className="text-[10px] md:text-xs font-medium text-black" style={{ fontFamily: 'var(--font-roboto)' }}>{tHome('hours')}</span>
            </div>
            <div className="flex flex-1 items-center justify-start gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-white/30">
                <Image src={current.bandera2} alt={current.equipo2} fill className="object-cover" />
              </div>
              <span className="text-xs md:text-base font-normal text-left leading-tight" style={{ fontFamily: 'var(--font-roboto)' }}>{current.equipo2}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const MatchItem = ({ location, date, team1, flag1, team2, flag2, time, tHome }: any) => (
  <div className="w-full mb-2"> {/* Reduje el margen inferior de mb-6 a mb-3 */}
    <h3 className="text-center text-[#0D601E] text-xs md:text-sm mb-1 font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>
      {tHome('nextMatchIn')} <span className="font-bold">{location}</span> - {date}:
    </h3>
    <div className="flex items-center gap-4 md:gap-8 bg-[#B3ACAC] text-white rounded-[15px] md:rounded-[20px] px-3 md:px-5 py-2 shadow-md min-h-[60px] md:min-h-[50px]">
      {/* Equipo 1 */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <span className="text-xs md:text-base font-normal text-right leading-tight" style={{ fontFamily: 'var(--font-roboto)' }}>
          {team1}
        </span>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-white/30">
          <Image src={flag1} alt={team1} fill className="object-cover" />
        </div>
      </div>

      {/* Hora Central */}
      <div className="flex flex-col items-center justify-center px-2 md:px-4 border-x border-white/20 mx-2">
        <span className="text-base md:text-xl font-bold text-black leading-none" style={{ fontFamily: 'var(--font-roboto)' }}>
          {time}
        </span>
        <span className="text-[10px] md:text-xs font-medium text-black" style={{ fontFamily: 'var(--font-roboto)' }}>
          {tHome('hours')}
        </span>
      </div>

      {/* Equipo 2 */}
      <div className="flex flex-1 items-center justify-start gap-2">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-white/30">
          <Image src={flag2} alt={team2} fill className="object-cover" />
        </div>
        <span className="text-xs md:text-base font-normal text-left leading-tight" style={{ fontFamily: 'var(--font-roboto)' }}>
          {team2}
        </span>
      </div>
    </div>
  </div>
);

// Componente de tarjeta con fotos ciclables en hover
function PlaceCard2({ place, photos, noImageText }: {
  place: RecommendedPlace;
  photos: string[];
  noImageText: string;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!isHovered || photos.length <= 1) { setPhotoIdx(0); return; }
    const len = photos.length;
    const t = setInterval(() => setPhotoIdx(p => (p + 1) % len), 900);
    return () => clearInterval(t);
  }, [isHovered, photos]);

  const displayImg = photos.length > 0 ? photos[photoIdx] : place.img;
  const infoHref = `/informacion/${encodeURIComponent(place.name)}`;
  const handleCardNavigation = () => router.push(infoHref);

  return (
    <div
      className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 w-56 sm:w-64 md:w-auto group transition-transform duration-300 md:hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setPhotoIdx(0); }}
      onClick={handleCardNavigation}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardNavigation();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Ver información de ${place.name}`}
    >
      <div className="w-full relative overflow-hidden pb-[75%] sm:pb-[56.25%] md:pb-[100%]">
        {displayImg
          ? <div className="absolute inset-0">
              <img src={displayImg} alt={place.name} className="w-full h-full object-cover transition-opacity duration-500" />
            </div>
          : <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-sm">{noImageText}</div>
        }
        <div className="absolute top-3 right-3 z-20 bg-white/95 border border-[#E8E8E8] rounded-full px-2 py-1 shadow-md empty:hidden">
          <PlaceRating
            placeName={place.name}
            showLabel={true}
            size="small"
            readonly={true}
          />
        </div>
        {/* Dots indicador (solo con múltiples fotos y hover) */}
        {isHovered && photos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
            {photos.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === photoIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`} />
            ))}
          </div>
        )}
        {/* Botón Ubicar */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 z-10">
          <Link
            href="/mapa"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1A4D2E] text-white px-4 py-2 rounded-full text-sm flex items-center gap-1.5 shadow-lg hover:bg-[#0D601E] transition-colors"
            aria-label="Abrir mapa"
          >
            <FiMapPin size={14} />
            Ubicar
          </Link>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-[#1A4D2E] truncate text-center uppercase text-xs">{place.name}</h3>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center font-bold">Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [isLogged, setIsLogged] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuthForIA, setShowAuthForIA] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasCheckedWelcome = useRef(false);
  const [isNewWelcome, setIsNewWelcome] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>(DEFAULT_RECOMMENDATIONS);
  const [recommendedPhotos, setRecommendedPhotos] = useState<Record<string, string[]>>({});

  // Traducciones
  const tCat = useTranslations('categories');
  const tHome = useTranslations('home');
  const tPlaces = useTranslations('places');
  const tCommon = useTranslations('common');

  // Componentes internos que usan las traducciones
  const CategoryCarousel = ({ categories }: { categories: Category[] }) => {
    const categoryRoutes: { [key: string]: string } = {
      "Fútbol": "/futbol",
      "Gastronomía": "/gastronomia",
      "Arte": "/arte",
      "Cultura": "/cultura",
      "Eventos": "/eventos",
      "Casas de Cambio": "/casas-cambio",
      "Hospitales": "/hospitales",
      "Médico": "/medico"
    };

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [direction, setDirection] = useState(1);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const allCategories = categories.length ? categories : ALL_CATEGORIES;

    const getCategoryName = (name: string) => {
      const categoryMap: { [key: string]: string } = {
        "Fútbol": tCat('soccer'),
        "Gastronomía": tCat('gastronomy'),
        "Arte": tCat('art'),
        "Cultura": tCat('culture'),
        "Eventos": tCat('events')
      };
      return categoryMap[name] || name;
    };

    const handleNext = () => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % allCategories.length);
    };

    const handlePrev = () => {
      setDirection(-1);
      setCurrentIndex((prev) => (prev - 1 + allCategories.length) % allCategories.length);
    };

    const resetAutoPlay = () => {
      setIsAutoPlay(true);
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };

    useEffect(() => {
      if (!isAutoPlay) return;

      autoPlayRef.current = setTimeout(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % allCategories.length);
      }, 5000);

      return () => {
        if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
      };
    }, [isAutoPlay, allCategories.length]);

    if (!allCategories.length) return null;
    const activeCategory = allCategories[currentIndex];
    const prevIndex = (currentIndex - 1 + allCategories.length) % allCategories.length;
    const nextIndex = (currentIndex + 1) % allCategories.length;
    const prevCategory = allCategories[prevIndex];
    const nextCategory = allCategories[nextIndex];

    return (
      <section className="relative bg-gradient-to-r from-[#FDFCF9] via-white to-[#FDFCF9] py-3 md:py-5 px-3 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-1 md:mb-2">
            <h2 className="text-2xl md:text-4xl font-black text-[#1A4D2E] uppercase mb-2" style={{ fontFamily: "var(--font-jockey)" }}>
              Categorías
            </h2>
            <p className="text-[#769C7B] text-xs md:text-base font-medium px-2">Explora nuestras categorías y descubre nuevas experiencias</p>
          </div>

          {/* Carrusel */}
          <div className="relative flex items-center justify-center">
            {/* Botón Anterior */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handlePrev();
                setIsAutoPlay(false);
              }}
              onMouseEnter={() => setIsAutoPlay(false)}
              onMouseLeave={resetAutoPlay}
              className="absolute left-0 z-20 p-2 md:p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all text-[#1A4D2E]"
            >
              <FiChevronRight size={24} className="transform rotate-180" />
            </motion.button>

            {/* Contenedor de Categorías */}
            <div className="w-full px-8 sm:px-12 md:px-16 pt-4" style={{ overflowX: 'hidden' }}>
              <div className="mx-auto w-full max-w-3xl relative" onMouseEnter={() => setIsAutoPlay(false)} onMouseLeave={resetAutoPlay}>
                <div className="hidden lg:block pointer-events-none">
                  <motion.div
                    key={`peek-left-${prevCategory.name}-${currentIndex}`}
                    initial={{ x: direction > 0 ? -30 : 10, opacity: 0.2, scale: 0.9 }}
                    animate={{ x: direction > 0 ? -18 : -24, opacity: 0.45, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[30%] w-[28%] h-32 rounded-[24px] overflow-hidden saturate-50 blur-[1px] shadow-lg"
                  >
                    <img src={prevCategory.img} alt={getCategoryName(prevCategory.name)} className="w-full h-full object-cover" loading="lazy" />
                  </motion.div>
                  <motion.div
                    key={`peek-right-${nextCategory.name}-${currentIndex}`}
                    initial={{ x: direction > 0 ? -10 : 30, opacity: 0.2, scale: 0.9 }}
                    animate={{ x: direction > 0 ? 24 : 18, opacity: 0.45, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[30%] w-[28%] h-32 rounded-[24px] overflow-hidden saturate-50 blur-[1px] shadow-lg"
                  >
                    <img src={nextCategory.img} alt={getCategoryName(nextCategory.name)} className="w-full h-full object-cover" loading="lazy" />
                  </motion.div>
                </div>
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={activeCategory.name}
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className="w-full"
                  >
                    <Link href={categoryRoutes[activeCategory.name] || "/mapa"}>
                      <motion.div
                        whileHover={{ y: -12, scale: 1.01 }}
                        className="relative h-36 md:h-44 rounded-[28px] overflow-hidden shadow-xl border-2 border-[#F6F0E6] cursor-pointer group"
                      >
                        <img
                          src={activeCategory.img}
                          alt={getCategoryName(activeCategory.name)}
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${activeCategory.name === "Fútbol" ? "[object-position:center_75%]" : activeCategory.name === "Arte" ? "[object-position:center_60%]" : "object-center"}`}
                          loading="lazy"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300"></div>

                        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                          <h3 className="text-xl md:text-2xl font-black text-white uppercase drop-shadow-lg leading-tight tracking-wide" style={{ fontFamily: "var(--font-jockey)" }}>
                            {getCategoryName(activeCategory.name)}
                          </h3>
                          <p className="text-xs md:text-sm text-white/80 mt-2 font-medium">Descubre más →</p>
                        </div>

                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0D601E] shadow-md">
                          {currentIndex + 1}/{allCategories.length}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Botón Siguiente */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleNext();
                setIsAutoPlay(false);
              }}
              onMouseEnter={() => setIsAutoPlay(false)}
              onMouseLeave={resetAutoPlay}
              className="absolute right-0 z-20 p-2 md:p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all text-[#1A4D2E]"
            >
              <FiChevronRight size={24} />
            </motion.button>
          </div>

          {/* Indicadores */}
          <div className="flex justify-center items-center gap-2 mt-3 md:mt-4">
            {allCategories.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsAutoPlay(false);
                }}
                className={`rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-[#0D601E] w-6 md:w-8 h-2.5 md:h-3"
                    : "bg-[#F6F0E6] w-2.5 md:w-3 h-2.5 md:h-3 hover:bg-[#1A4D2E]"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const RecommendationsComponent = ({ places, onRefresh }: { places: RecommendedPlace[]; onRefresh: () => void }) => {
    const [refreshing, setRefreshing] = useState(false);
    const handleRefresh = async () => {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 600);
    };
    return (
      <div className="flex flex-col w-full md:w-3/5">
        <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
          <h2 className="text-xl md:text-2xl font-bold text-[#1A4D2E]">{tHome('recommendations')}</h2>
          <button
            onClick={handleRefresh}
            title="Recargar recomendaciones"
            className="p-1.5 rounded-full text-[#1A4D2E] hover:bg-[#E0F2F1] transition-colors"
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex overflow-x-auto scrollbar-hidden md:overflow-visible md:grid md:grid-cols-3 gap-4 md:gap-6 pb-2 px-1">
          {places.map((place) => (
            <PlaceCard2
              key={place.name}
              place={place}
              photos={recommendedPhotos[place.name] || []}
              noImageText={tCommon('noImage')}
            />
          ))}
        </div>
      </div>
    );
  };

  // ESTADOS PARA LA IA
  const [itinerarioTxt, setItinerarioTxt] = useState("");
  const [loadingIA, setLoadingIA] = useState(true);

  // Detectar si el usuario acaba de iniciar sesión
  useEffect(() => {
    if (hasCheckedWelcome.current) return;
    hasCheckedWelcome.current = true;

    const userLocal = localStorage.getItem("pitzbol_user");
    const token = localStorage.getItem("pitzbol_token");

    if (userLocal && token) {
      const user = JSON.parse(userLocal);
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      const justRegistered = sessionStorage.getItem("justRegistered");

      if (justLoggedIn === "true" || justRegistered === "true") {
        setWelcomeMessage(user.nombre || "Usuario");
        setShowWelcome(true);
        setIsNewWelcome(justRegistered === "true");
        sessionStorage.removeItem("justLoggedIn");
        sessionStorage.removeItem("justRegistered");
        setIsLogged(true);
      }
    }
  }, []);

  const cargarRecomendaciones = async () => {
    try {
      const userLocal = localStorage.getItem('pitzbol_user');
      if (!userLocal) return;

      const user = JSON.parse(userLocal);
      const intereses: string[] = user["07_intereses"] || user.especialidades || user["07_especialidades"] || [];
      if (!intereses.length) return;

      const targetCategories = new Set<string>();
      intereses.forEach((interes: string) => {
        (INTERES_TO_CATEGORIES[interes] || []).forEach((cat: string) => targetCategories.add(cat));
      });
      if (targetCategories.size === 0) return;

      const res = await fetch('/datosLugares.csv');
      const text = await res.text();
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

      const scored = (data as any[])
        .filter((row) => row['Nombre del Lugar'] && row['Categoría'])
        .map((row) => {
          const placeCategories = (row['Categoría'] as string).split(',').map((c: string) => c.trim());
          const matches = placeCategories.filter((c: string) => targetCategories.has(c)).length;
          return { row, matches };
        })
        .filter(({ matches }) => matches > 0)
        .sort((a, b) => b.matches - a.matches);

      if (scored.length === 0) return;

      // Mezclar dentro del mismo puntaje para variar resultados
      const shuffled: typeof scored = [];
      let i = 0;
      while (i < scored.length) {
        const score = scored[i].matches;
        const group: typeof scored = [];
        while (i < scored.length && scored[i].matches === score) { group.push(scored[i]); i++; }
        for (let j = group.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [group[j], group[k]] = [group[k], group[j]];
        }
        shuffled.push(...group);
      }

      const top6: RecommendedPlace[] = shuffled.slice(0, 6).map(({ row }) => {
        const firstCat = (row['Categoría'] as string).split(',')[0].trim();
        const csvImg = (row['Imagen'] as string)?.trim() || null;
        return { name: row['Nombre del Lugar'] as string, img: csvImg || getPlaceImageByCategory(firstCat), categoria: firstCat };
      });

      if (top6.length < 6) {
        top6.push(...DEFAULT_RECOMMENDATIONS.slice(0, 6 - top6.length));
      }

      setRecommendedPlaces(top6);
    } catch {
      // Mantener defaults en caso de error
    }
  };

  const cargarItinerarioHome = async () => {
    setLoadingIA(true);
    
    // Coordenadas por defecto (Centro de GDL)
    let ubicacionUsuario = { lat: 20.6767, lng: -103.3371 };

    // INTENTAR DETECTAR UBICACIÓN REAL
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        ubicacionUsuario = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("Ubicación detectada con éxito");
      } catch (error) {
        console.log("Usando ubicación por defecto (GPS desactivado o timeout)");
      }
    }

    try {
      const res = await fetch('/datosLugares.csv');
      const reader = res.body?.getReader();
      const result = await reader?.read();
      const csv = new TextDecoder('utf-8').decode(result?.value);

      const { data } = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
      const dataLimpia = (data as Lugar[]).filter(l => l.nombre && l.lat);

      const resultIA = generarItinerarioManual(
        dataLimpia, 
        ["futbol", "gastronomia", "postres"], 
        300, 
        ubicacionUsuario 
      );

      setItinerarioTxt(resultIA);
    } catch (error) {
      setItinerarioTxt("Error al sincronizar con Pitzbol.");
    } finally {
      setLoadingIA(false);
    }
  };
  useEffect(() => {
    cargarItinerarioHome();
    cargarRecomendaciones();

    // Detectar si viene de un login exitoso
    const checkWelcome = () => {
      if (hasCheckedWelcome.current) return;
      
      const shouldShowWelcome = localStorage.getItem("pitzbol_showWelcome");
      const welcomeName = localStorage.getItem("pitzbol_welcomeName");
      
      console.log("🔍 Verificando bienvenida en home:", { shouldShowWelcome, welcomeName });
      
      if (shouldShowWelcome === "true" && welcomeName) {
        hasCheckedWelcome.current = true;
        
        console.log("✅ Mostrando mensaje de bienvenida");
        
        // Mostrar inmediatamente
        setWelcomeMessage(welcomeName);
        setShowWelcome(true);
        
        // Limpiar las flags
        localStorage.removeItem("pitzbol_showWelcome");
        localStorage.removeItem("pitzbol_welcomeName");
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
          console.log("⏰ Ocultando mensaje");
          setShowWelcome(false);
        }, 3000);
      }
    };
    
    // Verificar inmediatamente
    checkWelcome();

    // También verificar con un pequeño delay
    const timer = setTimeout(checkWelcome, 100);

    // Re-sincronizar recomendaciones cuando el usuario actualiza sus intereses
    const handleInteresesChange = () => cargarRecomendaciones();
    window.addEventListener("especialidadesActualizadas", handleInteresesChange);
    window.addEventListener("storage", handleInteresesChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("especialidadesActualizadas", handleInteresesChange);
      window.removeEventListener("storage", handleInteresesChange);
    };
  }, []);

  // Fetch fotos de backend cuando cambian las recomendaciones
  useEffect(() => {
    if (!recommendedPlaces.length) return;
    let cancelled = false;

    const normalizeName = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const loadRecommendedPhotos = async () => {
      try {
        const mergedPlaces = await getMergedPlaces();
        if (cancelled) return;

        const photosByNormalizedName = new Map<string, string[]>();
        mergedPlaces.forEach((place) => {
          if (Array.isArray(place.fotos) && place.fotos.length > 0) {
            photosByNormalizedName.set(normalizeName(place.nombre), place.fotos.slice(0, 3));
          }
        });

        const nextPhotos: Record<string, string[]> = {};
        recommendedPlaces.forEach((place) => {
          const photos = photosByNormalizedName.get(normalizeName(place.name));
          if (photos && photos.length > 0) {
            nextPhotos[place.name] = photos;
          }
        });

        setRecommendedPhotos(nextPhotos);
      } catch {
        if (!cancelled) {
          setRecommendedPhotos({});
        }
      }
    };

    loadRecommendedPhotos();

    return () => {
      cancelled = true;
    };
  }, [recommendedPlaces]);

  return (
    <div className="min-h-screen bg-white md:bg-[#f5f5f5] font-sans">
      {/* Notificación de Bienvenida */}
       <WelcomeNotification
         userName={welcomeMessage}
         isVisible={showWelcome}
         onClose={() => setShowWelcome(false)}
         duration={5000}
         isNew={isNewWelcome}
       />
      
      <CategoryCarousel categories={ALL_CATEGORIES} />
      <DateSlider />
      <main className="flex flex-col md:flex-row gap-4 md:gap-8 py-4 md:py-10 px-3 md:px-8 lg:px-22 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 md:gap-4 w-full md:w-1/2 lg:w-2/5 flex-shrink-0 md:py-3">
          <GdlMatchCarousel partidos={PARTIDOS_GDL} sede="GDL" tHome={tHome} />
          <GdlMatchCarousel partidos={PARTIDOS_CDMX} sede="CDMX" tHome={tHome} />
          <GdlMatchCarousel partidos={PARTIDOS_MTY} sede="MTY" tHome={tHome} />
          {/* PITZBOT — IA de Itinerarios */}
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100 relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#1A4D2E]" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                    PitzBot
                  </h2>
                  <p className="text-xs text-gray-600 font-medium">Crear itinerario con IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#769C7B]">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>IA disponible</span>
              </div>
              <button
                onClick={() => {
                  const IA_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://69.30.204.56:3003';
                  try {
                    const raw = localStorage.getItem('pitzbol_user');
                    if (raw) {
                      const uid = JSON.parse(raw).uid;
                      const url = uid ? `${IA_URL}?uid=${uid}` : IA_URL;
                      window.open(url, '_blank');
                      return;
                    }
                  } catch {}
                  setShowAuthForIA(true);
                }}
                className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#1A4D2E] hover:bg-[#0D601E] transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Crear Itinerario</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <RecommendationsComponent places={recommendedPlaces} onRefresh={cargarRecomendaciones} />
      </main>

      <AnimatePresence>
        {showAuthForIA && (
          <AuthModal
            isOpen={showAuthForIA}
            onClose={() => {
              setShowAuthForIA(false);
              // Si tras cerrar ya está logeado, abrir la IA
              const IA_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://69.30.204.56:3003';
              try {
                const raw = localStorage.getItem('pitzbol_user');
                if (raw) {
                  const uid = JSON.parse(raw).uid;
                  const url = uid ? `${IA_URL}?uid=${uid}` : IA_URL;
                  window.open(url, '_blank');
                }
              } catch {}
            }}
            intendedRole="turista"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
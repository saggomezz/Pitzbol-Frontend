"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiBriefcase, FiCalendar, FiChevronRight, FiInfo, FiMapPin, FiMenu, FiMessageCircle, FiSearch, FiUser, FiX } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi"; // Importamos un balón de fútbol
import AuthModal from "./components/AuthModal";
import GuideModal from "./components/GuideModal";
import BusinessModal from "./components/BusinessModal";
import imglogo from "./components/logoPitzbol.png";
import imgPasto from "./components/pastoVerde.png";

type Category = { name: string; img: string; };
type DateInfo = { day: string; weekday: string; fullDate: string; isGdlMatch: boolean; isActive: boolean; };
type Recommendation = { name: string; img: string | null; };

const categories: Category[] = [
  { name: "Fútbol", img: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=2070" },
  { name: "Gastronomía", img: "https://images.unsplash.com/photo-1711306722944-70b776bb4394?auto=format&fit=crop&q=80&w=1528" },
  { name: "Arte", img: "https://museocabanas.jalisco.gob.mx/wp-content/uploads/2024/08/1.png" },
  { name: "Cultura", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Voladores_de_Papantla.png/1200px-Voladores_de_Papantla.png" },
  { name: "Eventos", img: "https://www.debate.com.mx/img/2020/09/01/reabre_expo_gdl_invierten_25__1180283_crop1598978065412.jpg?__scale=w:1200,h:675,t:2,fpx:519,fpy:533" },
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
const recommendations: Recommendation[] = [
  { name: "Centro de Guadalajara", img: "https://www.liderempresarial.com/wp-content/uploads/2025/07/Asi-se-transformara-el-centro-de-Guadalajara-%C2%BFcuando-estara-listo.jpg" },
  { name: "Tlaquepaque", img: "https://image-tc.galaxy.tf/wijpeg-5ifzorsfl8d2dm64kutj586du/tlaquepaque.jpg" },
  { name: "Tequila, Jalisco", img: "https://visitmexico.com/media/usercontent/67fd7d33baf74-Tequila-2_gmxdot_jpeg" },
];

const Header = ({ 
  onOpenAuth, 
  onOpenGuide,
  onOpenBusiness
}: { 
  onOpenAuth: () => void; 
  onOpenGuide: () => void; 
  onOpenBusiness: () => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex justify-between items-center bg-[#F6F0E6] px-4 md:px-8 h-20 md:h-24 sticky top-0 z-50 shadow-sm text-[#1A4D2E]">
      <div className="flex items-center h-full">
        <div className="relative h-20 w-20 md:h-32 md:w-32 flex-shrink-0">
          <Image src={imglogo} alt="logoPitzbol" fill className="object-contain" priority />
        </div>
        <div className="relative flex items-center h-full ml-1">
          <div className="absolute inset-y-0 -left-6 md:-left-9 md:top-10 top-6 z-0 flex items-center w-[120%] min-w-[150px] md:min-w-[350px]">
            <Image src={imgPasto} alt="pastoVerde" className="object-contain" />
          </div>
          <h1 className="relative z-10 text-[35px] md:text-[70px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            <span className="text-[#FFFFFF]">PITZ</span>
            <span className="text-[#F00808]">BOL</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative">
        <Link href="/calendario">
          <button className="p-2 hover:bg-white/60 rounded-full transition-all text-[#1A4D2E] hover:text-[#F00808]" title="Calendario">
            <FiCalendar size={24} className="md:w-7 md:h-7" />
          </button>
        </Link>
        <button className="p-2 hover:bg-white/60 rounded-full transition-all text-[#1A4D2E] hover:text-[#F00808]">
          <FiSearch size={24} className="md:w-7 md:h-7" />
        </button>
        <button className="p-2 hover:bg-white/60 rounded-full transition-all text-[#1A4D2E] hover:text-[#F00808]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FiX size={24} className="md:w-7 md:h-7" /> : <FiMenu size={24} className="md:w-7 md:h-7" />}
        </button>

        {isMenuOpen && (
          <div ref={menuRef} className="absolute top-[110%] right-0 w-64 md:w-72 bg-white/95 backdrop-blur-sm rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 flex flex-col gap-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold px-4 mb-2">Usuario</p>
              <button onClick={() => { setIsMenuOpen(false); onOpenAuth(); }} className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left">
                <FiUser size={18} className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors" />
                <span className="font-semibold text-sm italic group-hover:translate-x-1 transition-transform">Identificarse</span>
              </button>
              <div className="h-[1px] bg-gray-100 my-2 mx-4" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold px-4 mb-2">Socios Pitzbol</p>
              
              <button 
                onClick={() => { setIsMenuOpen(false); onOpenGuide(); }}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left"
              >
                <FiMapPin size={18} className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors" />
                <span className="font-semibold text-sm  group-hover:translate-x-1 transition-transform">Afiliación de Guías</span>
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); onOpenBusiness(); }}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left"
              >
                <FiBriefcase size={18} className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors" />
                <span className="font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Alianzas Comerciales
                </span>
              </button>
              <div className="h-[1px] bg-gray-100 my-2 mx-4" />
              <button className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left font-medium text-sm">Nosotros</button>
              <button className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left font-medium text-sm">Soporte y Contacto</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const CategoryCarousel = ({ categories }: { categories: Category[] }) => (
  <section className="flex gap-4 p-4 md:py-6 md:px-8 overflow-x-auto md:justify-center bg-white">
    {categories.map((category) => (
      <div key={category.name} className="relative w-40 h-24 md:w-64 md:h-34 rounded-xl overflow-hidden shadow-lg cursor-pointer group flex-shrink-0 transition-transform duration-300 md:hover:scale-105">
        <Image
          src={category.img}
          alt={category.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <span className="text-white text-xl font-bold text-center drop-shadow-md">{category.name}</span>
        </div>
      </div>
    ))}
  </section>
);

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
      <div className="bg-white md:bg-transparent py-1 w-full overflow-hidden">
        <div className="flex gap-1 md:gap-0 px-2 md:px-0 justify-center items-center w-full max-w-7xl mx-auto">
          {dynamicDates.map((date, index) => {
            let bgColor = index === 0 ? "bg-[#0D601E]" : index === 1 ? "bg-white border-y border-gray-100 shadow-sm" : "bg-[#B90808]";
            let textColor = index === 1 ? "text-[#6F4545]" : "text-white";

            return (
              <div
                key={date.fullDate}
                className={`
                  relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all
                  h-12 md:h-12
                  ${index === 0 ? "rounded-l-[12px] md:rounded-l-[20px]" : ""}
                  ${index === 2 ? "rounded-r-[12px] md:rounded-r-[20px]" : ""}
                  ${bgColor}
                `}
              >
                <div 
                  className={`text-lg md:text-2xl font-normal leading-tight ${textColor}`}
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {date.day}
                </div>
                <div 
                  className={`text-[9px] md:text-xs font-normal uppercase ${textColor}`}
                  style={{ fontFamily: "var(--font-jockey)" }}
                >
                  {date.weekday}
                </div>

                {index === 0 && (
                  <div className="absolute -top-1 -left-1 md:top-0 md:left-2 z-10">
                    <GiSoccerBall size={18} className="text-black bg-white rounded-full p-0.5 shadow-md animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/calendario">
            <button className="ml-2 p-3 text-black hover:scale-110 transition-transform flex-shrink-0">
              <FiChevronRight size={35} />
            </button>
          </Link>
        </div>
      </div>

    </>
  );
};

const MatchItem = ({ location, date, team1, flag1, team2, flag2, time }: any) => (
  <div className="w-full mb-2"> {/* Reduje el margen inferior de mb-6 a mb-3 */}
    <h3 className="text-center text-[#0D601E] text-xs md:text-sm mb-1 font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>
      Próximo partido en <span className="font-bold">{location}</span> - {date}:
    </h3>

    {/* CAMBIO 1: Altura del banner (de min-h-[100px] a min-h-[60px]) y redondeado más sutil */}
    <div className="flex items-center gap-4 md:gap-8 bg-[#B3ACAC] text-white rounded-[15px] md:rounded-[20px] px-3 md:px-5 py-2 shadow-md min-h-[60px] md:min-h-[50px]">
      
      {/* Equipo 1 */}
      <div className="flex flex-1 items-center justify-end gap-2">
        {/* CAMBIO 2: Tamaño de fuente del nombre del país (text-xs a text-base) */}
        <span className="text-xs md:text-base font-normal text-right leading-tight" style={{ fontFamily: 'var(--font-roboto)' }}>
          {team1}
        </span>
        {/* CAMBIO 3: Tamaño de la bandera (de w-16 a w-10) */}
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative flex-shrink-0 border border-white/30">
          <Image src={flag1} alt={team1} fill className="object-cover" />
        </div>
      </div>

      {/* Hora Central */}
      <div className="flex flex-col items-center justify-center px-2 md:px-4 border-x border-white/20 mx-2">
        {/* CAMBIO 4: Tamaño de la hora (de text-3xl a text-xl) */}
        <span className="text-base md:text-xl font-bold text-black leading-none" style={{ fontFamily: 'var(--font-roboto)' }}>
          {time}
        </span>
        <span className="text-[10px] md:text-xs font-medium text-black" style={{ fontFamily: 'var(--font-roboto)' }}>
          hrs
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

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white md:bg-[#f5f5f5] font-sans">
      <Header 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenBusiness={() => setIsBusinessOpen(true)}
      />
      <CategoryCarousel categories={categories} />
      <DateSlider />
      <main className="flex flex-col md:flex-row gap-8 py-6 md:py-10 pl-4 pr-4 md:pl-22 md:pr-22 w-full">
        <div className="flex flex-col gap-4 w-full md:w-1/2 lg:w-2/5 flex-shrink-0 md:py-3">
          <MatchItem 
            location="CDMX"
            date="11 de Junio"
            team1="México"
            flag1="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/1024px-Flag_of_Mexico.svg.png"
            team2="Sudáfrica"
            flag2="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/1200px-Flag_of_South_Africa.svg.png"
            time="13:00"
          />

          <MatchItem 
            location="GDL"
            date="11 de Junio"
            team1="Corea"
            flag1="https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_South_Korea.svg"
            team2="Dinamarca"
            flag2="https://img.freepik.com/foto-gratis/fondo-textura-bandera-nacional-dinamarca-ia-generativa_169016-29875.jpg"
            time="20:00"
          />

          <div className="bg-[#FAF9F2] rounded-xl p-4 shadow-sm min-h-[180px] border border-gray-200">
            <h2 className="font-bold mb-2 text-gray-800" style={{ fontFamily: 'var(--font-roboto)' }}>
              Itinerario de hoy:
            </h2>
            <div className="h-40 border-t border-gray-100 p-3 text-sm text-gray-500 text-center pt-10">
              Cargando itinerario...
            </div>
          </div>
        </div>

        <Recommendations recommendations={recommendations} />
      </main>
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
      
      <GuideModal    
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)} 
        isAlreadyUser={isLogged} 
      />

      <BusinessModal 
        isOpen={isBusinessOpen} 
        onClose={() => setIsBusinessOpen(false)} 
      />
      </div>
  );
}

const Recommendations = ({ recommendations }: { recommendations: Recommendation[] }) => (
  <div className="flex flex-col w-full md:w-3/5">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Recomendaciones</h2>
    <div className="flex overflow-x-auto md:overflow-visible md:grid md:grid-cols-3 gap-6">
      {recommendations.map((place) => (
        <div key={place.name} className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 w-64 md:w-auto group transition-transform duration-300 md:hover:scale-105">
          <div className="w-full relative overflow-hidden pb-[56.25%] md:pb-[100%]">
            {place.img ? <div className="absolute inset-0"><Image src={place.img} alt={place.name} fill className="object-cover" /></div> : <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-sm">Sin imagen</div>}
            <div className="absolute bottom-2 right-2 z-10"><button className="text-xs bg-[#0B2C3D] text-white px-3 py-1 rounded-full shadow-lg">Ubicar</button></div>
          </div>
          <div className="p-4"><h3 className="font-semibold text-gray-800 truncate text-center">{place.name}</h3></div>
        </div>
      ))}
    </div>
  </div>
);
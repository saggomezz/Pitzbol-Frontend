"use client";
import { generarItinerarioManual, Lugar } from '@/lib/pitzbol-engine';
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from 'papaparse';
import { Suspense, useEffect, useRef, useState } from "react";
import { FiBriefcase, FiCalendar, FiChevronRight, FiHeart, FiMapPin, FiMenu, FiSearch, FiUser, FiX } from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";
import { construirItinerarioElegido, ordenarPorCercania } from '../lib/pitzbol-engine';
import WelcomeNotification from './components/WelcomeNotification';

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

const CategoryCarousel = ({ categories }: { categories: Category[] }) => (
  <section className="flex gap-4 p-4 md:py-6 md:px-8 overflow-x-auto md:justify-center bg-white">
    {categories.map((category) => (
      <Link 
        key={category.name} 
        href={category.name === "Fútbol" ? "/futbol" : "#"} 
        className="flex-shrink-0"
      >
        <div className="relative w-40 h-24 md:w-64 md:h-34 rounded-xl overflow-hidden shadow-lg cursor-pointer group transition-transform duration-300 md:hover:scale-105">
          <Image src={category.img} alt={category.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="text-white text-xl font-bold text-center drop-shadow-md">{category.name}</span>
          </div>
        </div>
      </Link>
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasCheckedWelcome = useRef(false);

  // ESTADOS PARA LA IA
  const [itinerarioTxt, setItinerarioTxt] = useState("Cargando itinerario...");
  const [loadingIA, setLoadingIA] = useState(true);
  const [lugaresBD, setLugaresBD] = useState<Lugar[]>([]);
  const [seleccionados, setSeleccionados] = useState<Lugar[]>([]);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [itinerarioFinal, setItinerarioFinal] = useState("");

  // Cargar la base de datos al inicio
  useEffect(() => {
    const cargarDatos = async () => {
      const res = await fetch('/datosLugares.csv');
      const reader = res.body?.getReader();
      const result = await reader?.read();
      const csv = new TextDecoder('utf-8').decode(result?.value);
      const { data } = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
      setLugaresBD((data as Lugar[]).filter(l => l.nombre));
    };
    cargarDatos();
  }, []);

  // Estado para saber si la bienvenida es de cuenta nueva
  const [isNewWelcome, setIsNewWelcome] = useState(false);
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

  const toggleLugar = (lugar: Lugar) => {
    setSeleccionados(prev => {
      const existe = prev.find(s => s.nombre === lugar.nombre);
      
      if (existe) {
        return prev.filter(s => s.nombre !== lugar.nombre);
      } else {
        return [...prev, lugar];
      }
    });
  };

  const finalizarRuta = () => {
    const texto = construirItinerarioElegido(seleccionados);
    setItinerarioFinal(texto);
    setMostrarOpciones(false);
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
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (mostrarOpciones && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const miPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLugaresBD((prevLugares) => ordenarPorCercania(prevLugares, miPos));
          console.log("Lugares ordenados por tu GPS");
        },
        (error) => {
          console.log("No se pudo obtener ubicación, usando orden alfabético.");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [mostrarOpciones]); 

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
          {/* CONTENEDOR DE ITINERARIO */}
          <div className="bg-[#FAF9F2] rounded-3xl p-6 shadow-sm min-h-[300px] border border-[#1A4D2E]/10 flex flex-col relative">
            <h2 className="font-black text-[#1A4D2E] uppercase text-xs tracking-widest mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              {itinerarioFinal ? "Tu Ruta Elegida" : "Arma tu Itinerario"}
            </h2>

            {!itinerarioFinal && !mostrarOpciones && (
              <button 
                onClick={() => setMostrarOpciones(true)}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#769C7B]/30 rounded-2xl hover:bg-[#F6F0E6] transition-all group"
              >
                <FiMapPin className="text-[#769C7B] group-hover:text-[#F00808] mb-2" size={24} />
                <p className="text-[11px] font-bold text-[#769C7B] uppercase">Presiona para elegir lugares</p>
              </button>
            )}

            {mostrarOpciones && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto max-h-60 mb-4 space-y-2 pr-2 custom-scrollbar">
                  {lugaresBD.map((lugar) => (
                    <div 
                      key={lugar.nombre}
                      onClick={() => toggleLugar(lugar)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all flex justify-between items-center ${
                        seleccionados.find(s => s.nombre === lugar.nombre) 
                        ? "bg-[#1A4D2E] border-[#1A4D2E] text-white" 
                        : "bg-white border-[#F6F0E6] text-[#1A4D2E]"
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase">{lugar.nombre}</span>
                      <span className="text-[9px] opacity-70">{lugar.tiempoEstancia} min</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={finalizarRuta}
                  disabled={seleccionados.length === 0} 
                  className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                    seleccionados.length > 0
                      ? "bg-[#F00808] text-white shadow-lg active:scale-95" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {seleccionados.length > 0
                    ? `Generar Itinerario (${seleccionados.length})`
                    : "Selecciona al menos 1 lugar"}
                </button>
              </div>
            )}

            {itinerarioFinal && (
              <div className="flex-1 flex flex-col">
                <div className="text-[13px] leading-relaxed text-[#1A4D2E]/80 font-medium whitespace-pre-wrap flex-1 overflow-y-auto max-h-64">
                  {itinerarioFinal}
                </div>
                <button 
                  onClick={() => {setItinerarioFinal(""); setSeleccionados([]);}}
                  className="mt-4 text-[10px] font-bold text-[#769C7B] uppercase hover:text-[#F00808]"
                >
                  Reiniciar selección
                </button>
              </div>
            )}
          </div>
        </div>

        <Recommendations recommendations={recommendations} />
      </main>
    </div>
  );
}

const Recommendations = ({ recommendations }: { recommendations: any[] }) => (
  <div className="flex flex-col w-full md:w-3/5">
    <h2 className="text-2xl font-bold mb-4 text-[#1A4D2E]">Recomendaciones</h2>
    <div className="flex overflow-x-auto md:overflow-visible md:grid md:grid-cols-3 gap-6">
      {recommendations.map((place) => (
        <div key={place.name} className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 w-64 md:w-auto group transition-transform duration-300 md:hover:scale-105">
          <div className="w-full relative overflow-hidden pb-[56.25%] md:pb-[100%]">
            {place.img ? <div className="absolute inset-0"><Image src={place.img} alt={place.name} fill className="object-cover" /></div> : <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-sm">Sin imagen</div>}
            <div className="absolute bottom-2 right-2 z-10"><button className="text-xs bg-[#1A4D2E] text-white px-3 py-1 rounded-full shadow-lg">Ubicar</button></div>
          </div>
          <div className="p-4"><h3 className="font-semibold text-[#1A4D2E] truncate text-center uppercase text-xs">{place.name}</h3></div>
        </div>
      ))}
    </div>
  </div>
);
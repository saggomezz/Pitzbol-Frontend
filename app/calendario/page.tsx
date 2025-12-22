"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiSmile,
  FiSun,
  FiX,
  FiZap
} from "react-icons/fi";
import imglogo from "../components/logoPitzbol.png";

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); 
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const worldCupEvents: { [key: string]: string[] } = {
    "6-11": ["MÉX VS SUDAFRICA", "INAUGURAL GDL"],
    "6-18": ["COREA VS DINAMARCA"],
    "6-24": ["MÉXICO VS RIVAL"],
    "6-30": ["DIECISEISAVOS"]
  };

  const planCategories = [
    { id: 'gastro', title: 'Gastronomía', img: 'https://cdn-icons-png.flaticon.com/128/4372/4372203.png', desc: 'Sabor local' },
    { id: 'cultura', title: 'Cultura', img: 'https://cdn-icons-png.flaticon.com/512/3659/3659831.png', desc: 'Museos y más' },
    { id: 'noche', title: 'Fiesta', img: 'https://cdn-icons-png.flaticon.com/128/1355/1355079.png', desc: 'Vida nocturna' },
    { id: 'guia', title: 'Guías', img: 'https://cdn-icons-png.flaticon.com/128/3284/3284649.png', desc: 'Expertos' },
    { id: 'tequila', title: 'Tequila', img: 'https://cdn-icons-png.flaticon.com/512/920/920605.png', desc: 'Catas y ruta' },
    { id: 'shop', title: 'Compras', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081648.png', desc: 'Artesanías' }
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">
      {/* HEADER CON LOGO QUE GIRA AL PASAR EL MOUSE */}
      <header className="bg-[#F6F0E6] px-8 py-0 flex justify-between items-center border-b border-[#1A4D2E]/10 flex-shrink-0 z-50 h-20 md:h-24">
        <div className="flex items-center h-full">
          {/* LOGO CON EFECTO DE GIRO */}
          <Link href="/" className="h-full flex items-center">
            <motion.div 
              whileHover={{ rotate: 190 }} // Gira 360 grados al poner el cursor
              transition={{ duration: 2.0, ease: "easeInOut" }} // Duración del giro
              className="relative h-20 w-20 md:h-32 md:w-32 flex-shrink-0 cursor-pointer"
            >
              <Image 
                src={imglogo} 
                alt="logoPitzbol" 
                fill 
                className="object-contain" 
                priority 
              />
            </motion.div>
          </Link>
          
          <div className="flex flex-col ml-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase leading-none" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              Calendario
            </h1>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-[#769C7B] font-bold uppercase tracking-widest mt-1">
              <FiSun size={10} className="text-[#F00808]" /> GDL 28°C • Soleado
            </div>
          </div>
        </div>

        <button className="bg-[#0D601E] hover:bg-[#094d18] text-white px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold shadow-xl shadow-[#0D601E]/20 transition-all flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em]">
          <FiPlus size={16} /> Crear Plan
        </button>
      </header>

      <main className="flex-1 p-4 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* SECCIÓN CALENDARIO */}
        <div className="lg:col-span-3 h-full flex flex-col">
          <div className="bg-white rounded-[40px] p-5 shadow-[0_15px_40px_rgba(26,77,46,0.05)] border border-[#F6F0E6] flex-1 flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-[#FDFCF9] border border-[#F6F0E6] rounded-xl transition-all text-[#1A4D2E]">
                <FiChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-[#1A4D2E] tracking-tight">
                {months[currentDate.getMonth()]} <span className="text-[#769C7B] font-light">{currentDate.getFullYear()}</span>
              </h2>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-[#FDFCF9] border border-[#F6F0E6] rounded-xl transition-all text-[#1A4D2E]">
                <FiChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1">
              {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map(d => (
                <div key={d} className="text-center text-[#769C7B] font-bold text-[10px] uppercase tracking-[0.2em]">{d}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${currentDate.getMonth() + 1}-${day}`;
                const events = currentDate.getFullYear() === 2026 ? worldCupEvents[dateKey] : null;

                return (
                  <motion.div 
                    key={i} 
                    whileHover={{ 
                      scale: 1.02, 
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => { setSelectedDay(day); setShowOptions(true); }} 
                    className={`min-h-0 rounded-[25px] p-2 transition-all cursor-pointer relative flex flex-col justify-between border shadow-sm ${
                      events 
                      ? 'bg-[#FDF2F2] border-[#F00808]/20 hover:shadow-[0_10px_20px_rgba(240,8,8,0.15)]' 
                      : 'bg-white border-[#FDFCF9] hover:border-[#1A4D2E]/20 hover:shadow-[0_10px_25px_rgba(26,77,46,0.1)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-lg font-black tracking-tighter ${events ? 'text-[#F00808]' : 'text-[#1A4D2E]/20'}`}>{day}</span>
                      {events && <FiZap className="text-[#F00808] animate-pulse" size={10} />}
                    </div>
                    
                    <div className="space-y-1 overflow-hidden">
                      {events && events.map((event, idx) => (
                        <div 
                          key={idx} 
                          className="bg-gradient-to-r from-[#F00808] to-[#D60707] text-white text-[7px] md:text-[8px] px-2 py-1 rounded-md font-bold uppercase truncate tracking-widest text-center shadow-sm border border-white/10"
                        >
                          {event}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL LATERAL */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
          {/* Mood */}
          <section className="bg-white rounded-[30px] p-5 border border-[#F6F0E6] shadow-sm flex-shrink-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#769C7B] mb-3 block">Plan del día</span>
            <div className="flex justify-between gap-1">
              {['Chill', 'Explorar', 'Fiesta'].map(mood => (
                <button key={mood} className="flex-1 py-2 rounded-xl border border-[#F6F0E6] text-[8px] font-bold uppercase hover:bg-[#1A4D2E] hover:text-white transition-all">
                  {mood}
                </button>
              ))}
            </div>
          </section>

          {/* Próximas Citas */}
          <section className="bg-[#1A4D2E] rounded-[35px] p-6 text-white shadow-xl flex-1 overflow-y-auto">
            <h3 className="text-xl mb-4 uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>Próximas Citas</h3>
            <div className="space-y-4">
              <div className="group relative pl-5 border-l-2 border-[#769C7B]">
                <div className="absolute w-2 h-2 bg-[#F00808] rounded-full -left-[5px] top-1 shadow-[0_0_8px_#F00808]" />
                <p className="font-bold text-base mb-0.5">Arribo a GDL</p>
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-medium">Aeropuerto • 11:30 AM</p>
              </div>
              <div className="group relative pl-5 border-l-2 border-white/10">
                <p className="font-bold text-base mb-0.5">Cena Chapu</p>
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-medium">Av. Chapu • 08:00 PM</p>
              </div>
            </div>
          </section>

          {/* Tip de GDL */}
          <section className="bg-[#F6F0E6]/60 rounded-[30px] p-6 border border-[#1A4D2E]/5 relative overflow-hidden flex-shrink-0">
            <div className="relative z-10">
              <h4 className="text-[#1A4D2E] font-black uppercase text-[10px] mb-2 flex items-center gap-2">
                <FiSmile className="text-[#F00808]" size={12} /> Pitzbol Tip
              </h4>
              <p className="text-xs text-[#1A4D2E]/80 leading-snug italic">
                "El sol en el Estadio Akron pega fuerte en la zona Oriente. No olvides tus lentes de sol y bloqueador si tu partido es antes de las 6:00 PM."
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE OPCIONES */}
      <AnimatePresence>
        {showOptions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A4D2E]/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-5xl rounded-[50px] shadow-3xl overflow-hidden"
            >
              <div className="p-8 flex justify-between items-center bg-[#FDFCF9]">
                <div>
                  <h2 className="text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>¿Qué sigue, Pitzboler?</h2>
                  <p className="text-[#769C7B] font-bold uppercase tracking-widest text-xs mt-1">Día {selectedDay} de {months[currentDate.getMonth()]}</p>
                </div>
                <button onClick={() => setShowOptions(false)} className="bg-[#F6F0E6] p-3 rounded-full text-[#F00808] hover:rotate-90 transition-all duration-300">
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-10 grid grid-cols-2 md:grid-cols-3 gap-6">
                {planCategories.map((cat) => (
                  <button key={cat.id} className="group bg-white p-6 rounded-[40px] border-2 border-[#F6F0E6] hover:border-[#0D601E] transition-all hover:shadow-xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#FDFCF9] rounded-full p-3 shadow-inner group-hover:scale-110 transition-transform">
                      <img src={cat.img} alt={cat.title} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-lg font-black text-[#1A4D2E] uppercase block" style={{ fontFamily: "'Jockey One', sans-serif" }}>{cat.title}</span>
                    <span className="text-[9px] text-[#769C7B] font-bold uppercase tracking-widest mt-1 block">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
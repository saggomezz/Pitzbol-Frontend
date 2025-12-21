"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiPlus, FiChevronRight, FiX, FiClock } from "react-icons/fi";

export default function CalendarioPage() {
  // Iniciamos en Junio 2026 para visualizar los partidos
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); 
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Eventos múltiples para el día 11 y otros días del mundial
  const worldCupEvents: { [key: string]: string[] } = {
    "6-11": ["MÉX VS SUDAFRICA (CDMX)", "PARTIDO INAUGURAL (GDL)"],
    "6-14": ["FASE DE GRUPOS (MTY)"],
    "6-15": ["FASE DE GRUPOS (CDMX)"],
    "6-17": ["FASE DE GRUPOS (MTY)"],
    "6-18": ["COREA VS DINAMARCA (GDL)"],
    "6-23": ["FASE DE GRUPOS (GDL)"],
    "6-24": ["MÉXICO VS RIVAL (CDMX)"],
    "6-26": ["FASE DE GRUPOS (GDL)"],
    "6-30": ["DIECISEISAVOS (CDMX)"]
  };

  const planCategories = [
    { id: 'gastro', title: 'Plan Gastronómico', img: 'https://cdn-icons-png.flaticon.com/128/4372/4372203.png', desc: 'Restaurantes mexicanos' },
    { id: 'cultura', title: 'Ruta Cultural', img: 'https://cdn-icons-png.flaticon.com/512/3659/3659831.png', desc: 'Museos y Centro Histórico' },
    { id: 'noche', title: 'Vida Nocturna', img: 'https://cdn-icons-png.flaticon.com/128/1355/1355079.png', desc: 'Antros, bares y fiesta' }, // Bola de disco
    { id: 'guia', title: 'Reservar Guía', img: 'https://cdn-icons-png.flaticon.com/128/3284/3284649.png', desc: 'Expertos locales para ti' }, // Guía con mapa
    { id: 'tequila', title: 'Ruta del Tequila', img: 'https://cdn-icons-png.flaticon.com/512/920/920605.png', desc: 'Paisaje agavero y catas' },
    { id: 'shop', title: 'Compras y Artesanías', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081648.png', desc: 'Tlaquepaque y Tonalá' }
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans relative">
      {/* HEADER */}
      <header className="bg-[#F6F0E6] text-[#0D601E] p-6 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/"><button className="p-2 hover:bg-white/50 rounded-full transition-colors"><FiChevronLeft size={30} /></button></Link>
          <h1 className="text-3xl font-normal" style={{ fontFamily: 'var(--font-jockey)' }}>Calendario</h1>
        </div>
        <button className="bg-[#B90808] hover:bg-[#a00707] text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all">
          <FiPlus className="inline mr-2" /> Crear Itinerario
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECCIÓN CALENDARIO */}
        <div className="lg:col-span-2 bg-[#F6F0E6] rounded-[30px] p-6 border border-gray-200 shadow-[0_10px_25px_-5px_rgba(13,96,30,0.3)]">
          <div className="flex justify-between items-center mb-8 bg-white/50 p-4 rounded-2xl text-[#6F4545]">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><FiChevronLeft size={25} /></button>
            <h2 className="text-2xl font-normal w-[280px] text-center" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><FiChevronRight size={25} /></button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map(d => (
              <div key={d} className="text-center text-[#0D601E] font-bold text-sm mb-4">{d}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${currentDate.getMonth() + 1}-${day}`;
              const events = currentDate.getFullYear() === 2026 ? worldCupEvents[dateKey] : null;

              return (
                <div 
                  key={i} 
                  onClick={() => { setSelectedDay(day); setShowOptions(true); }} 
                  className={`min-h-[80px] md:h-32 bg-white border border-gray-100 rounded-xl p-2 transition-all hover:shadow-[0_4px_12px_rgba(13,96,30,0.2)] cursor-pointer relative flex flex-col gap-1 ${events ? 'ring-2 ring-[#B90808]/40' : ''}`}
                >
                  <span className={`text-lg font-normal ${events ? 'text-[#B90808]' : 'text-gray-400'}`}>{day}</span>
                  {events && events.map((event, idx) => (
                    <div key={idx} className="bg-[#B90808] text-white text-[7px] md:text-[8px] p-1 rounded-sm leading-tight text-center truncate font-normal uppercase">
                      {event}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA ACTIVIDADES */}
        <div className="flex flex-col gap-6">
          <section className="bg-[#F6F0E6] rounded-[30px] p-6 border border-gray-200 shadow-[0_10px_25px_-5px_rgba(13,96,30,0.3)]">
            <h3 className="text-[#0D601E] text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-jockey)' }}>Actividades</h3>
            <div className="bg-white p-4 rounded-2xl border-l-4 border-[#0D601E] shadow-sm">
              <p className="font-normal text-[#6F4545]">Tour GDL Centro</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-2"><FiClock /> 10:00 AM</div>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE CATEGORÍAS */}
      {showOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#F6F0E6] w-full max-w-3xl rounded-[40px] shadow-[0_20px_50px_rgba(13,96,30,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 flex justify-between items-center bg-white/30 text-[#0D601E]">
              <div>
                <h2 className="text-3xl font-normal" style={{ fontFamily: 'var(--font-jockey)' }}>¿Cuál es el plan?</h2>
                <p className="text-[#6F4545] font-normal" style={{ fontFamily: 'var(--font-jetbrains)' }}>Día {selectedDay} de {months[currentDate.getMonth()]}</p>
              </div>
              <button onClick={() => setShowOptions(false)} className="bg-white p-2 rounded-full shadow-md text-red-500 hover:scale-110 transition-all"><FiX size={24} /></button>
            </div>

            <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              {planCategories.map((cat) => (
                <button key={cat.id} className="bg-white p-6 rounded-[30px] shadow-sm hover:shadow-[0_8px_20px_rgba(13,96,30,0.15)] transition-all flex flex-col items-center group active:scale-95 border border-transparent hover:border-[#0D601E]/30">
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <img src={cat.img} alt={cat.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-sm font-normal text-[#0D601E] mb-1" style={{ fontFamily: 'var(--font-jetbrains)' }}>{cat.title}</span>
                  <span className="text-[10px] text-gray-400 text-center leading-tight">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
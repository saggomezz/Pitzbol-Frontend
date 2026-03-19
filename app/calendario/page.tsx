"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  FiChevronLeft, FiChevronRight, FiPlus, FiSun, FiX, FiTrash2, FiClock, FiMapPin, FiDollarSign
} from "react-icons/fi";

interface SavedStop {
  place: {
    nombre: string;
    categoria: string;
    direccion: string;
    costo: string;
    isMatch?: boolean;
  };
  horaLlegada: string;
  horaSalida: string;
  traslado: string;
}

interface CalendarEntry {
  id: string;
  nombre: string;
  fecha: string; // YYYY-MM-DD
  meta: { title: string; budget: string; groupSize: string; duration: string };
  stops: SavedStop[];
}

function formatTime12(t: string) {
  if (!t) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [itinerarios, setItinerarios] = useState<CalendarEntry[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const t = useTranslations('calendar');
  const tMonths = useTranslations('calendar.months');
  const tCat = useTranslations('calendar.planCategories');

  const months = [
    tMonths('january'), tMonths('february'), tMonths('march'), tMonths('april'),
    tMonths('may'), tMonths('june'), tMonths('july'), tMonths('august'),
    tMonths('september'), tMonths('october'), tMonths('november'), tMonths('december')
  ];

  const worldCupEvents: { [key: string]: string[] } = {
    "6-11": ["MÉX VS SUDAFRICA", "INAUGURAL GDL"],
    "6-18": ["COREA VS DINAMARCA"],
    "6-24": ["MÉXICO VS RIVAL"],
    "6-30": ["DIECISEISAVOS"]
  };

  const planCategories = [
    { id: 'gastro', title: tCat('gastronomy'), img: 'https://cdn-icons-png.flaticon.com/128/4372/4372203.png', desc: tCat('gastronomyDesc') },
    { id: 'cultura', title: tCat('culture'), img: 'https://cdn-icons-png.flaticon.com/512/3659/3659831.png', desc: tCat('cultureDesc') },
    { id: 'noche', title: tCat('party'), img: 'https://cdn-icons-png.flaticon.com/128/1355/1355079.png', desc: tCat('partyDesc') },
    { id: 'guia', title: tCat('guides'), img: 'https://cdn-icons-png.flaticon.com/128/3284/3284649.png', desc: tCat('guidesDesc') },
    { id: 'tequila', title: tCat('tequila'), img: 'https://cdn-icons-png.flaticon.com/512/920/920605.png', desc: tCat('tequilaDesc') },
    { id: 'shop', title: tCat('shopping'), img: 'https://cdn-icons-png.flaticon.com/512/3081/3081648.png', desc: tCat('shoppingDesc') }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saveParam = params.get('save');
    let stored: CalendarEntry[] = [];
    try {
      stored = JSON.parse(localStorage.getItem('pitzbol_calendario') || '[]');
    } catch {}

    if (saveParam) {
      try {
        const raw = JSON.parse(decodeURIComponent(saveParam));
        const entry: CalendarEntry = {
          id: raw.id,
          nombre: '',
          fecha: raw.fecha,
          meta: raw.meta,
          stops: (raw.stops || []).map((s: any) => ({
            place: { nombre: s.n, direccion: s.d, costo: s.c, isMatch: s.m, categoria: '' },
            horaLlegada: s.a,
            horaSalida: s.z,
            traslado: '',
          })),
        };
        if (!stored.find(e => e.id === entry.id)) {
          entry.nombre = `Itinerario #${stored.length + 1}`;
          stored = [...stored, entry];
          localStorage.setItem('pitzbol_calendario', JSON.stringify(stored));
        }
        setItinerarios(stored);
        const [y, m] = entry.fecha.split('-').map(Number);
        if (y && m) setCurrentDate(new Date(y, m - 1, 1));
        window.history.replaceState(null, '', '/calendario');
      } catch {
        setItinerarios(stored);
      }
    } else {
      setItinerarios(stored);
    }
  }, []);

  const deleteItinerario = (id: string) => {
    const updated = itinerarios.filter(e => e.id !== id);
    localStorage.setItem('pitzbol_calendario', JSON.stringify(updated));
    setItinerarios(updated);
    setDeleteConfirm(null);
    // Si no hay más itinerarios en ese día, deseleccionar
    const remaining = updated.filter(e => {
      const [y, m, d] = e.fecha.split('-').map(Number);
      return m - 1 === currentDate.getMonth() && d === selectedDay && y === currentDate.getFullYear();
    });
    if (remaining.length === 0) setSelectedDay(null);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Itinerarios del día seleccionado
  const selectedDateStr = selectedDay
    ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedItinerarios = selectedDateStr
    ? itinerarios.filter(e => e.fecha === selectedDateStr)
    : [];

  // Días con itinerarios este mes
  const daysWithItinerary = new Set(
    itinerarios
      .filter(e => {
        const [y, m] = e.fecha.split('-').map(Number);
        return y === currentDate.getFullYear() && m - 1 === currentDate.getMonth();
      })
      .map(e => parseInt(e.fecha.split('-')[2]))
  );

  return (
    <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">

      <div className="px-8 py-6 flex justify-between items-center flex-shrink-0">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black text-[#1A4D2E] uppercase leading-none" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            {t('title')}
          </h1>
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#769C7B] font-bold uppercase tracking-widest mt-2">
            <FiSun size={12} className="text-[#F00808]" /> GDL 28°C • Soleado
          </div>
        </div>
        <button
          onClick={() => { setSelectedDay(null); setShowOptions(true); }}
          className="bg-[#0D601E] hover:bg-[#094d18] text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all flex items-center gap-3 text-xs uppercase tracking-[0.2em]"
        >
          <FiPlus size={16} /> {t('createPlan')}
        </button>
      </div>

      <main className="flex-1 p-4 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">

        {/* Calendario */}
        <div className="lg:col-span-3 h-full flex flex-col">
          <div className="bg-white rounded-[40px] p-5 shadow-[0_15px_40px_rgba(26,77,46,0.05)] border border-[#F6F0E6] flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
              <button onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDay(null); }} className="p-2 hover:bg-[#FDFCF9] border border-[#F6F0E6] rounded-xl transition-all text-[#1A4D2E]">
                <FiChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-[#1A4D2E] tracking-tight">
                {months[currentDate.getMonth()]} <span className="text-[#769C7B] font-light">{currentDate.getFullYear()}</span>
              </h2>
              <button onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDay(null); }} className="p-2 hover:bg-[#FDFCF9] border border-[#F6F0E6] rounded-xl transition-all text-[#1A4D2E]">
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
                const hasItinerary = daysWithItinerary.has(day);
                const isSelected = selectedDay === day;

                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => { setSelectedDay(day); if (!hasItinerary) setShowOptions(true); }}
                    className={`rounded-[25px] p-2 transition-all cursor-pointer relative flex flex-col justify-between border
                      ${isSelected && hasItinerary ? 'bg-[#1A4D2E] border-[#1A4D2E]' : ''}
                      ${!isSelected && hasItinerary ? 'bg-[#E0F2F1] border-[#81C784]' : ''}
                      ${events && !hasItinerary ? 'bg-[#FDF2F2] border-[#F00808]/20' : ''}
                      ${!hasItinerary && !events ? 'bg-white border-[#FDFCF9]' : ''}
                    `}
                  >
                    <span className={`text-lg font-black
                      ${isSelected && hasItinerary ? 'text-white' : ''}
                      ${!isSelected && hasItinerary ? 'text-[#1A4D2E]' : ''}
                      ${events && !hasItinerary ? 'text-[#F00808]' : ''}
                      ${!hasItinerary && !events ? 'text-[#1A4D2E]/20' : ''}
                    `}>{day}</span>
                    {hasItinerary && (
                      <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-0.5 ${isSelected ? 'bg-white' : 'bg-[#1A4D2E]'}`} />
                    )}
                    {events && !hasItinerary && (
                      <div className="space-y-1">
                        {events.map((e, idx) => <div key={idx} className="bg-[#F00808] text-white text-[7px] p-1 rounded font-bold uppercase truncate">{e}</div>)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel lateral: Próximas Citas */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
          <section className="bg-white rounded-[30px] p-5 border border-[#F6F0E6] shadow-sm flex-shrink-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#769C7B] mb-3 block">Plan del día</span>
            <div className="flex justify-between gap-1">
              {['Chill', 'Explorar', 'Fiesta'].map(mood => (
                <button key={mood} className="flex-1 py-2 rounded-xl border border-[#F6F0E6] text-[8px] font-bold uppercase hover:bg-[#1A4D2E] hover:text-white transition-all">{mood}</button>
              ))}
            </div>
          </section>

          <section className="bg-[#1A4D2E] rounded-[35px] p-5 text-white shadow-xl flex-1 overflow-y-auto">
            <h3 className="text-xl mb-3 uppercase flex-shrink-0" style={{ fontFamily: "'Jockey One', sans-serif" }}>Próximas Citas</h3>

            {selectedItinerarios.length > 0 ? (
              <div className="space-y-4">
                {selectedItinerarios.map(entry => (
                  <div key={entry.id} className="bg-white/10 rounded-2xl p-3">
                    {/* Header del itinerario */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm">{entry.nombre}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">💰 {entry.meta.budget}</span>
                          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">⏱ {entry.meta.duration}</span>
                        </div>
                      </div>
                      {deleteConfirm === entry.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => deleteItinerario(entry.id)} className="text-[9px] bg-red-500 hover:bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">Sí</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-bold">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(entry.id)} className="p-1 hover:bg-white/20 rounded-lg transition-colors text-green-200 hover:text-red-300" title="Eliminar">
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Paradas */}
                    <div className="space-y-2">
                      {entry.stops.map((stop, i) => (
                        <div key={i} className="flex gap-2 items-start pl-1 border-l-2 border-[#769C7B] relative">
                          <div className="absolute w-2 h-2 bg-[#F00808] rounded-full -left-[5px] top-1" />
                          <div className="flex-1 min-w-0 pl-1">
                            <p className="font-bold text-xs text-white leading-snug">{stop.place.nombre}</p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[9px] text-green-200 flex items-center gap-1">
                                <FiClock size={8} /> {formatTime12(stop.horaLlegada)} → {formatTime12(stop.horaSalida)}
                              </span>
                              {stop.place.direccion && (
                                <span className="text-[9px] text-green-200 flex items-center gap-1 truncate">
                                  <FiMapPin size={8} /> {stop.place.direccion}
                                </span>
                              )}
                              {stop.place.costo && (
                                <span className="text-[9px] text-green-200 flex items-center gap-1">
                                  <FiDollarSign size={8} /> {stop.place.costo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-200 text-xs">
                {itinerarios.length === 0
                  ? 'Genera un itinerario en la IA y agrégalo aquí.'
                  : 'Selecciona un día marcado para ver tu itinerario.'}
              </p>
            )}
          </section>
        </div>
      </main>

      {/* Modal de opciones */}
      <AnimatePresence>
        {showOptions && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#1A4D2E]/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-5xl rounded-[50px] shadow-3xl overflow-hidden">
              <div className="p-8 flex justify-between items-center bg-[#FDFCF9]">
                <h2 className="text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>¿Qué sigue, Pitzboler?</h2>
                <button onClick={() => setShowOptions(false)} className="bg-[#F6F0E6] p-3 rounded-full text-[#F00808]"><FiX size={24} /></button>
              </div>
              <div className="p-10 grid grid-cols-2 md:grid-cols-3 gap-6">
                {planCategories.map((cat) => (
                  <button key={cat.id} className="group bg-white p-6 rounded-[40px] border-2 border-[#F6F0E6] hover:border-[#0D601E] transition-all text-center">
                    <img src={cat.img} alt={cat.title} className="w-12 h-12 mx-auto mb-4" />
                    <span className="text-lg font-black text-[#1A4D2E] uppercase block" style={{ fontFamily: "'Jockey One', sans-serif" }}>{cat.title}</span>
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


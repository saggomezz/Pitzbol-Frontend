"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  FiChevronLeft, FiChevronRight, FiPlus, FiSun, FiX, FiTrash2, FiClock, FiMapPin, FiDollarSign
} from "react-icons/fi";
import { usePitzbolUser } from "@/lib/usePitzbolUser";

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

interface FirestoreEntry {
  id: string;
  tipo: 'itinerario' | 'nota';
  fecha: string;
  meta?: { title: string; budget: string; groupSize: string; duration: string };
  stops?: SavedStop[];
  texto?: string;
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [itinerarios, setItinerarios] = useState<CalendarEntry[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notas, setNotas] = useState<{ [key: string]: string[] }>({});
  const [firestoreEntries, setFirestoreEntries] = useState<FirestoreEntry[]>([]);
  const [notasFirestore, setNotasFirestore] = useState<Array<{id: string; fecha: string; texto: string}>>([]);

  const user = usePitzbolUser();
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://69.30.204.56:3001';
  const IA_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://69.30.204.56:3003';

  const getToken = () => {
    try { return JSON.parse(localStorage.getItem('pitzbol_token') || 'null'); } catch { return null; }
  };

  const fetchFirestore = async () => {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resIts, resNotas] = await Promise.all([
        fetch(`${BACKEND}/api/itinerarios/itinerarios`, { headers }),
        fetch(`${BACKEND}/api/itinerarios/notas`, { headers }),
      ]);
      if (resIts.ok) {
        const its: FirestoreEntry[] = await resIts.json();
        setFirestoreEntries(its);
        setItinerarios(its.map(e => ({ id: e.id, nombre: e.meta?.title || 'Itinerario', fecha: e.fecha, meta: e.meta!, stops: e.stops || [] })));
      }
      if (resNotas.ok) {
        const notasData: Array<{id: string; fecha: string; texto: string}> = await resNotas.json();
        setNotasFirestore(notasData);
        const notasMap: { [key: string]: string[] } = {};
        notasData.forEach(e => {
          if (!notasMap[e.fecha]) notasMap[e.fecha] = [];
          notasMap[e.fecha].push(e.texto || '');
        });
        setNotas(notasMap);
      }
    } catch {}
  };

  const t = useTranslations('calendar');
  const tMonths = useTranslations('calendar.months');

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

  useEffect(() => {
    const saveParam = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null;

    const loadLocal = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('pitzbol_calendario') || '[]');
        setItinerarios(stored);
      } catch {}
      try {
        const storedNotas = JSON.parse(localStorage.getItem('pitzbol_notas') || '{}');
        setNotas(storedNotas);
      } catch {}
    };

    const handleHashEntry = async (raw: any, token: string | null) => {
      const stop: SavedStop[] = (raw.stops || []).map((s: any) => ({
        place: { nombre: s.n, direccion: s.d, costo: s.c, isMatch: s.m, categoria: '' },
        horaLlegada: s.a, horaSalida: s.z, traslado: '',
      }));
      if (token) {
        await fetch(`${BACKEND}/api/itinerarios/itinerarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fecha: raw.fecha, meta: raw.meta, stops: stop }),
        });
        await fetchFirestore();
      } else {
        const stored: CalendarEntry[] = JSON.parse(localStorage.getItem('pitzbol_calendario') || '[]');
        if (!stored.find(e => e.id === raw.id)) {
          const entry: CalendarEntry = { id: raw.id, nombre: `Itinerario #${stored.length + 1}`, fecha: raw.fecha, meta: raw.meta, stops: stop };
          stored.push(entry);
          localStorage.setItem('pitzbol_calendario', JSON.stringify(stored));
        }
        loadLocal();
      }
      const [y, m] = raw.fecha.split('-').map(Number);
      if (y && m) setCurrentDate(new Date(y, m - 1, 1));
      window.history.replaceState(null, '', window.location.pathname);
    };

    const token = getToken();
    if (saveParam) {
      try { handleHashEntry(JSON.parse(saveParam), token); } catch { loadLocal(); }
    } else if (token) {
      fetchFirestore();
    } else {
      loadLocal();
    }
  }, []);

  const deleteItinerario = async (id: string) => {
    const token = getToken();
    if (token) {
      await fetch(`${BACKEND}/api/itinerarios/itinerarios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await fetchFirestore();
    } else {
      const updated = itinerarios.filter(e => e.id !== id);
      localStorage.setItem('pitzbol_calendario', JSON.stringify(updated));
      setItinerarios(updated);
    }
    setDeleteConfirm(null);
  };

  const saveNota = async () => {
    if (!noteText.trim() || !selectedDateStr) return;
    const token = getToken();
    if (token) {
      await fetch(`${BACKEND}/api/itinerarios/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha: selectedDateStr, texto: noteText.trim() }),
      });
      await fetchFirestore();
    } else {
      const updated = { ...notas, [selectedDateStr]: [...(notas[selectedDateStr] || []), noteText.trim()] };
      setNotas(updated);
      localStorage.setItem('pitzbol_notas', JSON.stringify(updated));
    }
    setNoteText('');
    setAddingNote(false);
  };

  const deleteNota = async (dateStr: string, idx: number) => {
    const token = getToken();
    if (token) {
      const notaEntry = notasFirestore.filter(e => e.fecha === dateStr)[idx];
      if (notaEntry) {
        await fetch(`${BACKEND}/api/itinerarios/notas/${notaEntry.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        await fetchFirestore();
        return;
      }
    }
    const updated = { ...notas };
    updated[dateStr] = updated[dateStr].filter((_, i) => i !== idx);
    if (updated[dateStr].length === 0) delete updated[dateStr];
    setNotas(updated);
    localStorage.setItem('pitzbol_notas', JSON.stringify(updated));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const selectedDateStr = selectedDay
    ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedItinerarios = selectedDateStr
    ? itinerarios.filter(e => e.fecha === selectedDateStr)
    : [];

  const daysWithItinerary = new Set(
    itinerarios
      .filter(e => {
        const [y, m] = e.fecha.split('-').map(Number);
        return y === currentDate.getFullYear() && m - 1 === currentDate.getMonth();
      })
      .map(e => parseInt(e.fecha.split('-')[2]))
  );

  const selectedNotas = selectedDateStr ? (notas[selectedDateStr] || []) : [];

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
        <a
          href={IA_URL}
          className="bg-[#0D601E] hover:bg-[#094d18] text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all flex items-center gap-3 text-xs uppercase tracking-[0.2em]"
        >
          <FiPlus size={16} /> {t('createPlan')}
        </a>
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
                    onClick={() => {
                      setSelectedDay(day);
                      setAddingNote(false);
                      setNoteText('');
                    }}
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

        {/* Panel lateral */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">

          {/* Notas */}
          <section className="bg-white rounded-[30px] p-5 border border-[#F6F0E6] shadow-sm flex-shrink-0" style={{ minHeight: '180px' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#769C7B]">Notas</span>
              {selectedDateStr && !addingNote && (
                <button
                  onClick={() => setAddingNote(true)}
                  className="p-1.5 rounded-lg bg-[#E0F2F1] hover:bg-[#1A4D2E] hover:text-white text-[#1A4D2E] transition-all"
                >
                  <FiPlus size={12} />
                </button>
              )}
            </div>

            {addingNote && (
              <div className="flex flex-col gap-2 mb-3">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Escribe tu nota..."
                  className="w-full border border-[#E0F2F1] rounded-xl p-2 text-xs text-[#1A4D2E] resize-none focus:outline-none focus:border-[#1A4D2E] transition-colors"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => { setAddingNote(false); setNoteText(''); }} className="flex-1 py-1.5 rounded-xl border border-[#F6F0E6] text-[#769C7B] text-[10px] font-bold hover:bg-[#FDFCF9] transition-all">Cancelar</button>
                  <button onClick={saveNota} disabled={!noteText.trim()} className="flex-1 py-1.5 rounded-xl bg-[#1A4D2E] text-white text-[10px] font-bold hover:bg-[#0D601E] transition-all disabled:opacity-40">Guardar</button>
                </div>
              </div>
            )}

            {selectedNotas.length > 0 ? (
              <div className="space-y-2">
                {selectedNotas.map((nota, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 bg-[#FDFCF9] rounded-xl p-2">
                    <p className="text-[11px] text-[#1A4D2E] leading-snug flex-1">{nota}</p>
                    <button onClick={() => deleteNota(selectedDateStr!, i)} className="text-[#769C7B] hover:text-[#F00808] transition-colors flex-shrink-0">
                      <FiX size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#769C7B]">
                {selectedDateStr ? 'No tienes notas para este día.' : 'Selecciona un día para ver notas.'}
              </p>
            )}
          </section>

          {/* Mi itinerario */}
          <section className="bg-[#1A4D2E] rounded-[35px] p-5 text-white shadow-xl flex-1 overflow-y-auto">
            <h3 className="text-xl mb-3 uppercase flex-shrink-0" style={{ fontFamily: "'Jockey One', sans-serif" }}>Mi itinerario</h3>

            {selectedItinerarios.length > 0 ? (
              <div className="space-y-4">
                {selectedItinerarios.map(entry => (
                  <div key={entry.id} className="bg-white/10 rounded-2xl p-3">
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
                {!selectedDateStr
                  ? 'Selecciona un día para ver tu itinerario.'
                  : 'No tienes itinerarios para este día.'}
              </p>
            )}
          </section>
        </div>
      </main>

    </div>
  );
}


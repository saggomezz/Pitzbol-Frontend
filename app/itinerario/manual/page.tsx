"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMergedPlaces, PlaceRecord } from "@/lib/placesApi";
import { useFavoritesSync } from "@/lib/favoritesApi";
import {
  FiPlus, FiX, FiChevronUp, FiChevronDown,
  FiClock, FiSave, FiArrowLeft, FiSearch, FiStar, FiCheck, FiCalendar,
} from "react-icons/fi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDays(inicio: string, fin: string): string[] {
  const days: string[] = [];
  const start = new Date(inicio + "T00:00:00");
  const end = new Date(fin + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }
  return days.slice(0, 14);
}

function formatDate(s: string): string {
  return new Date(s + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function minToStr(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function tiempoLugar(l: PlaceRecord): number {
  return Number((l as any).tiempoEstancia) || 60;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiaItinerario { fecha: string; lugares: PlaceRecord[]; }

const STORAGE_KEY = "pitzbol_itinerario_manual";

// ── Component ────────────────────────────────────────────────────────────────

export default function ItinerarioManualPage() {
  const router = useRouter();

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [dias, setDias] = useState<DiaItinerario[]>([]);
  const [diaIdx, setDiaIdx] = useState(0);
  const [todosLugares, setTodosLugares] = useState<PlaceRecord[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardado, setGuardado] = useState(false);

  const { getFavorites } = useFavoritesSync();

  // Load places + favorites + saved state
  useEffect(() => {
    getMergedPlaces().then(p => { setTodosLugares(p); setLoading(false); });
    getFavorites().then(f => setFavoritos(f)).catch(() => {});

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.fechaInicio) setFechaInicio(saved.fechaInicio);
      if (saved.fechaFin) setFechaFin(saved.fechaFin);
      if (Array.isArray(saved.dias)) setDias(saved.dias);
    } catch {}
  }, []);

  // Rebuild day slots when dates change
  useEffect(() => {
    if (!fechaInicio || !fechaFin || fechaFin < fechaInicio) return;
    const fechas = getDays(fechaInicio, fechaFin);
    setDias(prev =>
      fechas.map((f, i) => ({ fecha: f, lugares: prev[i]?.lugares ?? [] }))
    );
    setDiaIdx(0);
  }, [fechaInicio, fechaFin]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const lugaresVisibles = useMemo(() => {
    let lista = todosLugares;
    if (soloFavoritos) lista = lista.filter(l => favoritos.includes(l.nombre));
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(l =>
        l.nombre.toLowerCase().includes(q) || l.categoria.toLowerCase().includes(q)
      );
    }
    return lista.slice(0, 60);
  }, [todosLugares, favoritos, busqueda, soloFavoritos]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const diaActual = dias[diaIdx];

  const agregarLugar = (lugar: PlaceRecord) => {
    if (!diaActual) return;
    if (diaActual.lugares.some(l => l.nombre === lugar.nombre)) return;
    setDias(prev => prev.map((d, i) =>
      i === diaIdx ? { ...d, lugares: [...d.lugares, lugar] } : d
    ));
  };

  const quitarLugar = (dIdx: number, lIdx: number) => {
    setDias(prev => prev.map((d, i) =>
      i === dIdx ? { ...d, lugares: d.lugares.filter((_, j) => j !== lIdx) } : d
    ));
  };

  const moverLugar = (lIdx: number, dir: -1 | 1) => {
    setDias(prev => prev.map((d, i) => {
      if (i !== diaIdx) return d;
      const arr = [...d.lugares];
      const to = lIdx + dir;
      if (to < 0 || to >= arr.length) return d;
      [arr[lIdx], arr[to]] = [arr[to], arr[lIdx]];
      return { ...d, lugares: arr };
    }));
  };

  const guardar = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fechaInicio, fechaFin, dias }));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const limpiar = () => {
    setFechaInicio(""); setFechaFin(""); setDias([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Computed ─────────────────────────────────────────────────────────────

  const totalLugares = dias.reduce((s, d) => s + d.lugares.length, 0);
  const tiempoTotalDia = (d: DiaItinerario) =>
    d.lugares.reduce((s, l) => s + tiempoLugar(l), 0);
  const today = new Date().toISOString().split("T")[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">

      {/* Header */}
      <div className="bg-[#1A4D2E] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <FiArrowLeft size={18} />
        </button>
        <FiCalendar size={16} className="opacity-80" />
        <h1 className="text-sm font-bold flex-1">Itinerario Manual</h1>
        <div className="flex items-center gap-2">
          {totalLugares > 0 && (
            <>
              <button
                onClick={limpiar}
                className="text-xs text-white/60 hover:text-white/90 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={guardar}
                className="flex items-center gap-1.5 bg-white text-[#1A4D2E] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#E0F2F1] transition-colors"
              >
                {guardado ? <FiCheck size={12} /> : <FiSave size={12} />}
                {guardado ? "Guardado" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date picker */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap gap-4 items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Fecha inicio</label>
          <input
            type="date" min={today} value={fechaInicio}
            onChange={e => {
              setFechaInicio(e.target.value);
              if (e.target.value > fechaFin) setFechaFin(e.target.value);
            }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Fecha fin</label>
          <input
            type="date" min={fechaInicio || today} value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
          />
        </div>
        {dias.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {dias.length} día{dias.length !== 1 ? "s" : ""} · {totalLugares} lugar{totalLugares !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {(!fechaInicio || !fechaFin) ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-300 gap-3 py-20">
          <FiCalendar size={48} />
          <p className="text-sm text-center">Selecciona las fechas de tu viaje<br />para comenzar a planificar</p>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">

          {/* ── Left panel: lugares ─────────────────────────────────────── */}
          <div className="w-[38%] md:w-[32%] border-r border-gray-100 flex flex-col bg-white min-h-0">
            <div className="p-3 border-b border-gray-100 space-y-2 flex-shrink-0">
              <div className="relative">
                <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Buscar lugar..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                />
              </div>
              <button
                onClick={() => setSoloFavoritos(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors w-full justify-center ${soloFavoritos ? "bg-[#1A4D2E] text-white border-[#1A4D2E]" : "bg-white text-gray-500 border-gray-200 hover:border-[#1A4D2E]"}`}
              >
                <FiStar size={11} /> Solo mis favoritos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-xs text-gray-400 text-center">Cargando lugares...</div>
              ) : lugaresVisibles.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center">Sin resultados</div>
              ) : lugaresVisibles.map(lugar => {
                const enEsteDia = diaActual?.lugares.some(l => l.nombre === lugar.nombre);
                const foto = lugar.fotos?.[0];
                return (
                  <div key={lugar.nombre} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    {foto ? (
                      <img src={foto} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 leading-tight truncate">{lugar.nombre}</p>
                      <p className="text-[10px] text-gray-400">{minToStr(tiempoLugar(lugar))}</p>
                    </div>
                    <button
                      onClick={() => agregarLugar(lugar)}
                      disabled={enEsteDia}
                      title={enEsteDia ? "Ya agregado" : `Agregar a Día ${diaIdx + 1}`}
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${enEsteDia ? "bg-[#E0F2F1] text-[#1A4D2E] cursor-default" : "bg-[#1A4D2E] text-white hover:bg-[#0D601E]"}`}
                    >
                      {enEsteDia ? <FiCheck size={10} /> : <FiPlus size={10} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right panel: days ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Day tabs */}
            <div className="flex overflow-x-auto bg-white border-b border-gray-100 flex-shrink-0">
              {dias.map((dia, i) => (
                <button
                  key={dia.fecha}
                  onClick={() => setDiaIdx(i)}
                  className={`flex-shrink-0 px-4 py-2 text-center border-b-2 transition-colors ${diaIdx === i ? "border-[#1A4D2E] text-[#1A4D2E]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  <span className="text-xs font-semibold block">Día {i + 1}</span>
                  <span className="text-[10px] font-normal block whitespace-nowrap">{formatDate(dia.fecha)}</span>
                  {dia.lugares.length > 0 && (
                    <span className="text-[10px] text-[#81C784] block">{dia.lugares.length} lugar{dia.lugares.length !== 1 ? "es" : ""}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Day places */}
            <div className="flex-1 overflow-y-auto p-3">
              {diaActual && (
                diaActual.lugares.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 py-16">
                    <FiPlus size={36} />
                    <p className="text-sm text-center">Agrega lugares desde<br />el panel izquierdo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diaActual.lugares.map((lugar, lIdx) => {
                      const foto = lugar.fotos?.[0];
                      const tiempo = tiempoLugar(lugar);
                      return (
                        <div key={lugar.nombre} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                          <span className="w-6 h-6 rounded-full bg-[#1A4D2E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {lIdx + 1}
                          </span>
                          {foto ? (
                            <img src={foto} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link href={`/informacion/${encodeURIComponent(lugar.nombre)}`} className="text-sm font-medium text-gray-800 truncate block hover:text-[#1A4D2E] transition-colors">
                              {lugar.nombre}
                            </Link>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <FiClock size={10} /> {minToStr(tiempo)}
                              {lugar.categoria && <span className="ml-1 opacity-60">· {lugar.categoria}</span>}
                            </p>
                          </div>
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button onClick={() => moverLugar(lIdx, -1)} disabled={lIdx === 0}
                              className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                              <FiChevronUp size={14} />
                            </button>
                            <button onClick={() => moverLugar(lIdx, 1)} disabled={lIdx === diaActual.lugares.length - 1}
                              className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                              <FiChevronDown size={14} />
                            </button>
                          </div>
                          <button onClick={() => quitarLugar(diaIdx, lIdx)}
                            className="p-1.5 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0">
                            <FiX size={14} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="text-right text-xs text-gray-400 pt-1 pr-1">
                      Tiempo total: <span className="font-medium text-[#1A4D2E]">{minToStr(tiempoTotalDia(diaActual))}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

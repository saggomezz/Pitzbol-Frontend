"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiArrowRight, FiMap, FiUser, FiZap, FiClock,
  FiDollarSign, FiMapPin, FiCalendar, FiDownload, FiX, FiChevronRight,
} from "react-icons/fi";
import AuthModal from "../components/AuthModal";
import { getItinerariosUsuario, type ItinerarioGuardado } from "@/lib/itinerariosApi";

const IA_URL = process.env.NEXT_PUBLIC_IA_URL || "https://ia.pitzbol.me";

const DURATION_LABEL: Record<string, string> = {
  "rapido": "Rápido · 2–3 hrs",
  "medio-dia": "Medio día · 5–6 hrs",
  "dia-completo": "Día completo · 8–9 hrs",
};

function formatFecha(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime12(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

async function downloadPDF(it: ItinerarioGuardado) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header verde
  doc.setFillColor(26, 77, 46);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Pitzbol", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Mundial 2026 Guadalajara", margin, 26);
  doc.setFontSize(10);
  doc.text(it.titulo, pageW - margin, 22, { align: "right" });

  let y = 42;

  if (it.fecha) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(formatFecha(it.fecha).toUpperCase(), margin, y);
    y += 8;
  }

  it.stops.forEach((stop, i) => {
    if (y > 265) { doc.addPage(); y = 20; }

    doc.setFillColor(26, 77, 46);
    doc.circle(margin + 4, y - 2, 4.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(i + 1), margin + 4, y, { align: "center" });

    doc.setTextColor(13, 96, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const horario = [stop.horaLlegada, stop.horaSalida].filter(Boolean).join(" - ");
    if (horario) doc.text(horario, margin + 12, y);

    y += 6;
    doc.setTextColor(26, 77, 46);
    doc.setFontSize(12);
    const nameLines = doc.splitTextToSize(stop.nombre, pageW - margin * 2 - 12);
    doc.text(nameLines, margin + 12, y);
    y += nameLines.length * 5.5;

    if (stop.direccion) {
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dirLines = doc.splitTextToSize(stop.direccion, pageW - margin * 2 - 12);
      doc.text(dirLines, margin + 12, y);
      y += dirLines.length * 4.5;
    }

    if (stop.costo && stop.costo !== "No disponible") {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`Costo aprox: ${stop.costo}`, margin + 12, y);
      y += 4.5;
    }

    y += 4;
    if (i < it.stops.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 12, y - 2, pageW - margin, y - 2);
      y += 4;
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("Generado por Pitzbol — ia.pitzbol.me", margin, doc.internal.pageSize.getHeight() - 8);

  const filename = `itinerario-pitzbol-${it.titulo.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}

export default function ItinerariosPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [itinerarios, setItinerarios] = useState<ItinerarioGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ItinerarioGuardado | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("pitzbol_user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    checkUser();
    window.addEventListener("authStateChanged", checkUser);
    return () => window.removeEventListener("authStateChanged", checkUser);
  }, []);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    getItinerariosUsuario(user.uid, user.role || "turista")
      .then(data => setItinerarios(Array.isArray(data) ? data : []))
      .catch(() => setItinerarios([]))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const handleDownload = async (it: ItinerarioGuardado) => {
    setDownloading(true);
    try { await downloadPDF(it); } finally { setDownloading(false); }
  };

  // ── No autenticado ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 md:p-16 rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full"
          >
            <div className="bg-gradient-to-br from-[#1A4D2E] to-[#0D601E] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiMap size={38} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              Itinerarios
            </h2>
            <p className="text-[#769C7B] text-sm leading-relaxed mb-10 font-medium">
              Inicia sesión para ver y guardar tus itinerarios personalizados generados con{" "}
              <span className="text-[#0D601E] font-bold">IA PITZBOL</span>.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold tracking-[0.1em] text-[14px] shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FiUser size={16} /> Iniciar sesión <FiArrowRight />
              </button>
              <Link href="/" className="block py-2 text-[#769C7B] font-bold text-[14px] hover:text-[#1A4D2E] transition-colors">
                Volver al inicio
              </Link>
            </div>
          </motion.div>
        </main>
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} redirectTo={IA_URL} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Autenticado ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] to-[#F6F0E6] py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#1A4D2E] to-[#0D601E] mb-6 shadow-lg">
            <FiMap size={38} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Mis Itinerarios
          </h1>
          {!loading && itinerarios.length > 0 && (
            <p className="text-[#769C7B] text-lg">
              {itinerarios.length} {itinerarios.length === 1 ? "itinerario guardado" : "itinerarios guardados"}
            </p>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-[#F6F0E6] border-t-[#1A4D2E] rounded-full animate-spin" />
          </div>
        ) : itinerarios.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md mx-auto">
              <FiMap size={64} className="text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#1A4D2E] mb-3">Aún no tienes itinerarios</h3>
              <p className="text-[#769C7B] mb-8 text-sm leading-relaxed">
                Genera tu primer itinerario personalizado con nuestra IA y guárdalo aquí.
              </p>
              <a href={IA_URL} className="inline-flex items-center gap-2 bg-[#0D601E] text-white px-8 py-4 rounded-full font-bold hover:bg-[#1A4D2E] hover:scale-[1.02] transition-all shadow-lg">
                <FiZap size={18} /> Crear itinerario con IA
              </a>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <a href={IA_URL} className="inline-flex items-center gap-2 bg-[#0D601E] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1A4D2E] transition-colors shadow-md">
                <FiZap size={15} /> Crear nuevo con IA
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itinerarios.map((it, index) => (
                <motion.article
                  key={it.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setSelected(it)}
                  className="bg-white rounded-[28px] overflow-hidden border border-[#F6F0E6] shadow-[0_10px_30px_rgba(26,77,46,0.05)] flex flex-col cursor-pointer"
                >
                  <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <FiMap size={20} className="text-white" />
                      </div>
                      <span className="text-white font-black text-xs uppercase tracking-widest">
                        {it.stops.length} {it.stops.length === 1 ? "parada" : "paradas"}
                      </span>
                    </div>
                    {it.meta?.duration && (
                      <span className="text-white/70 text-[10px] font-semibold bg-white/10 px-2 py-1 rounded-full">
                        {DURATION_LABEL[it.meta.duration] || it.meta.duration}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-[#1A4D2E] leading-snug mb-2 capitalize" style={{ fontFamily: "var(--font-jockey)" }}>
                      {it.titulo}
                    </h3>
                    {it.fecha && (
                      <div className="flex items-center gap-1.5 text-[#769C7B] text-xs mb-3">
                        <FiCalendar size={12} className="text-[#0D601E]" />
                        <span className="capitalize">{formatFecha(it.fecha)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      {it.meta?.budget > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FiDollarSign size={11} className="text-[#0D601E]" />
                          ${it.meta.budget.toLocaleString("es-MX")} MXN
                        </span>
                      )}
                      {it.meta?.groupSize > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FiUser size={11} className="text-[#0D601E]" />
                          {it.meta.groupSize} {it.meta.groupSize === 1 ? "persona" : "personas"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {it.stops.slice(0, 3).map((stop, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#E8F5E9] text-[#0D601E] text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-xs text-gray-600 truncate">{stop.nombre}</span>
                          {stop.horaLlegada && (
                            <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                              <FiClock size={9} /> {stop.horaLlegada}
                            </span>
                          )}
                        </div>
                      ))}
                      {it.stops.length > 3 && (
                        <p className="text-[11px] text-[#769C7B] pl-7 font-medium">
                          +{it.stops.length - 3} parada{it.stops.length - 3 !== 1 ? "s" : ""} más
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#F6F0E6] flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#769C7B] bg-[#F6F0E6] px-3 py-1 rounded-full">
                        <FiMapPin size={10} /> Guadalajara
                      </div>
                      <span className="text-[11px] text-[#0D601E] font-semibold flex items-center gap-1">
                        Ver completo <FiChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-12">
              <a href={IA_URL} className="inline-flex items-center gap-2 text-[#1A4D2E] font-bold hover:text-[#0D601E] transition-colors">
                <FiZap size={16} /> Generar otro itinerario
              </a>
            </motion.div>
          </>
        )}
      </div>

      {/* ── Modal detalle de itinerario ─────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] px-6 py-5 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white font-black text-xl leading-snug capitalize">{selected.titulo}</h2>
                    {selected.fecha && (
                      <p className="text-white/70 text-xs mt-1 capitalize">{formatFecha(selected.fecha)}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {selected.meta?.budget > 0 && (
                        <span className="text-white/80 text-xs flex items-center gap-1">
                          <FiDollarSign size={11} /> ${selected.meta.budget.toLocaleString("es-MX")} MXN
                        </span>
                      )}
                      {selected.meta?.groupSize > 0 && (
                        <span className="text-white/80 text-xs flex items-center gap-1">
                          <FiUser size={11} /> {selected.meta.groupSize} {selected.meta.groupSize === 1 ? "persona" : "personas"}
                        </span>
                      )}
                      {selected.meta?.duration && (
                        <span className="text-white/60 text-xs">{DURATION_LABEL[selected.meta.duration] || selected.meta.duration}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Lista de paradas */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                {selected.stops.map((stop, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Indicador */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#1A4D2E] text-white text-xs font-black flex items-center justify-center">
                        {i + 1}
                      </div>
                      {i < selected.stops.length - 1 && (
                        <div className="w-px flex-1 my-1 bg-gray-100 min-h-[16px]" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {stop.horaLlegada && (
                          <span className="text-sm font-black text-[#0D601E]">{formatTime12(stop.horaLlegada)}</span>
                        )}
                        {stop.horaSalida && (
                          <span className="text-xs text-gray-400">→ {formatTime12(stop.horaSalida)}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-[#1A4D2E] text-sm leading-snug">{stop.nombre}</h4>
                      {stop.direccion && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-start gap-1">
                          <FiMapPin size={10} className="mt-0.5 flex-shrink-0" /> {stop.direccion}
                        </p>
                      )}
                      {stop.costo && stop.costo !== "No disponible" && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FiDollarSign size={10} /> {stop.costo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer con botones */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleDownload(selected)}
                  disabled={downloading}
                  className="flex-1 py-3 rounded-2xl bg-[#1A4D2E] text-white font-bold text-sm hover:bg-[#0D601E] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {downloading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><FiDownload size={15} /> Descargar PDF</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

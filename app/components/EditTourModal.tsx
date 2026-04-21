"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FiX, FiMapPin, FiClock, FiUsers, FiPlus, FiTrash2,
} from "react-icons/fi";
import { FaMapMarkedAlt } from "react-icons/fa";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const MinimapaLocationPicker = dynamic(
  () => import("@/app/components/MinimapaLocationPicker"),
  { ssr: false }
);

const DESTINOS = [
  "Centro Histórico", "Tequila", "Tlaquepaque", "Tonalá",
  "Chapala", "Mazamitla", "Tapalpa", "Zona Metropolitana",
  "Puerto Vallarta", "Otro",
];

const DURACIONES = [
  "2 horas", "3 horas", "4 horas", "Medio día (5-6 h)",
  "Día completo (8+ h)", "2 días", "3 días o más",
];

const IDIOMAS = [
  "Español", "Inglés", "Francés", "Alemán", "Italiano",
  "Portugués", "Japonés", "Chino", "Coreano", "Árabe",
  "Ruso", "Holandés", "Polaco", "Turco",
];

const QUE_INCLUYE = [
  "Guía certificado", "Agua", "Transporte", "Comida", "Entradas a museos",
  "Seguro", "Fotografía", "Degustación", "Alojamiento",
];

const VEHICLE_TYPES = ["Auto / SUV", "Van", "Minibús", "Camión", "Otro"];

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => resolve(new File([blob!], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })),
        "image/jpeg", quality
      );
    };
    img.src = url;
  });
}

function Chips({ options, selected, toggle }: { options: string[]; selected: string[]; toggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
              active ? "bg-[#1A4D2E] text-white border-[#1A4D2E]" : "bg-white text-[#245038] border-[#C9D4CB] hover:border-[#1A4D2E]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

interface Tour {
  id: string;
  titulo: string;
  destino: string;
  fotoPrincipal: string;
  duracion: string;
  precio: string;
  queIncluye: string[];
  idiomas: string[];
  descripcion: string;
  puntoRecogida: string;
  capacidad: string;
  incluyeTransporte: boolean;
  tipoVehiculo: string[];
  disponibilidad: string;
}

interface Props {
  tour: Tour;
  guiaId: string;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export default function EditTourModal({ tour, guiaId, onClose, onSuccess }: Props) {
  const rawPrecio = tour.precio?.replace(/[^0-9.]/g, "") || "";
  const rawDestino = DESTINOS.includes(tour.destino) ? tour.destino : "Otro";
  const rawDestinoCalle = DESTINOS.includes(tour.destino) ? "" : tour.destino;

  const [titulo, setTitulo] = useState(tour.titulo);
  const [destino, setDestino] = useState(rawDestino);
  const [destinoCalle, setDestinoCalle] = useState(rawDestinoCalle);
  const [descripcion, setDescripcion] = useState(tour.descripcion || "");
  const [duracion, setDuracion] = useState(tour.duracion || "");
  const [precio, setPrecio] = useState(rawPrecio);
  const [idiomas, setIdiomas] = useState<string[]>(tour.idiomas || []);
  const [queIncluye, setQueIncluye] = useState<string[]>(tour.queIncluye || []);
  const [puntoRecogida, setPuntoRecogida] = useState(tour.puntoRecogida || "");
  const [incluyeTransporte, setIncluyeTransporte] = useState(tour.incluyeTransporte || false);
  const [capacidad, setCapacidad] = useState(tour.capacidad || "");
  const [tipoVehiculo, setTipoVehiculo] = useState<string[]>(tour.tipoVehiculo || []);
  const [disponibilidad, setDisponibilidad] = useState(tour.disponibilidad || "");
  const [fotos, setFotos] = useState<(File | null)[]>([null, null, null]);
  const [fotoPreviews, setFotoPreviews] = useState<(string | null)[]>([
    tour.fotoPrincipal || null, null, null,
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const toggleArr = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handlePhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFotos = [...fotos]; newFotos[index] = file; setFotos(newFotos);
    const reader = new FileReader();
    reader.onload = ev => {
      const p = [...fotoPreviews]; p[index] = ev.target?.result as string; setFotoPreviews(p);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    const f = [...fotos]; f[index] = null; setFotos(f);
    const p = [...fotoPreviews]; p[index] = null; setFotoPreviews(p);
    if (fileRefs.current[index]) fileRefs.current[index]!.value = "";
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("titulo", titulo);
      const destinoFinal = destino === "Otro" && destinoCalle.trim() ? destinoCalle.trim() : destino;
      fd.append("destino", destinoFinal);
      fd.append("descripcion", descripcion);
      fd.append("duracion", duracion);
      fd.append("precio", precio ? `$${precio} MXN` : "");
      fd.append("idiomas", JSON.stringify(idiomas));
      fd.append("queIncluye", JSON.stringify(queIncluye));
      fd.append("puntoRecogida", puntoRecogida);
      fd.append("incluyeTransporte", String(incluyeTransporte));
      if (incluyeTransporte) {
        fd.append("capacidad", capacidad);
        fd.append("tipoVehiculo", JSON.stringify(tipoVehiculo));
      }
      fd.append("disponibilidad", disponibilidad);
      for (const f of fotos) {
        if (f) fd.append("fotos", await compressImage(f));
      }

      const res = await fetchWithAuth(`/api/tours/${tour.id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Error al actualizar");
      onSuccess(data.tour);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar el tour.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[#C9D4CB] bg-white text-sm text-gray-700 focus:outline-none focus:border-[#1A4D2E] transition-all";
  const labelClass = "block text-[11px] font-bold text-[#1A4D2E] mb-1.5";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.97 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] rounded-t-3xl px-6 pt-6 pb-5 text-white">
            <button onClick={onClose} className="absolute top-4 right-5 text-white/70 hover:text-white">
              <FiX size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 p-2.5 rounded-xl">
                <FaMapMarkedAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="font-black text-lg leading-tight">Editar Tour</h2>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{tour.titulo}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Fotos */}
            <div>
              <label className={labelClass}>
                Fotos <span className="text-gray-400 font-normal">(reemplaza las actuales si subes nuevas)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <input ref={el => { fileRefs.current[i] = el; }} type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(i, e)} />
                    {fotoPreviews[i] ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-square">
                        <Image src={fotoPreviews[i]!} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                          <FiTrash2 size={11} />
                        </button>
                        {i === 0 && <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-[#0D601E] text-white px-1.5 py-0.5 rounded-full font-bold">Principal</span>}
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRefs.current[i]?.click()} className="w-full aspect-square rounded-2xl border-2 border-dashed border-[#C9D4CB] hover:border-[#1A4D2E] bg-[#F6F9F6] flex flex-col items-center justify-center gap-1 transition-all">
                        <FiPlus className="text-[#769C7B] text-lg" />
                        <span className="text-[10px] text-[#769C7B]">Foto {i + 1}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className={labelClass}>Título <span className="text-red-500">*</span></label>
              <input className={inputClass} value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>

            {/* Destino + Duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Destino</label>
                <div className="relative">
                  <select className={inputClass + " appearance-none pr-8"} value={destino} onChange={e => setDestino(e.target.value)}>
                    <option value="">Selecciona</option>
                    {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Duración</label>
                <div className="relative">
                  <select className={inputClass + " appearance-none pr-8"} value={duracion} onChange={e => setDuracion(e.target.value)}>
                    <option value="">Selecciona</option>
                    {DURACIONES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
              </div>
            </div>

            {destino === "Otro" && (
              <input className={inputClass} placeholder="Indica el destino" value={destinoCalle} onChange={e => setDestinoCalle(e.target.value)} />
            )}

            {/* Descripción */}
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea className={inputClass + " resize-none"} rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>

            {/* Precio */}
            <div>
              <label className={labelClass}>Precio por persona</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A4D2E] font-bold text-sm pointer-events-none">$</span>
                <input type="text" inputMode="decimal" className={inputClass + " pl-8 pr-14"} placeholder="0.00" value={precio}
                  onChange={e => setPrecio(e.target.value.replace(/[^0-9.]/g, ""))} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#769C7B] text-xs font-medium pointer-events-none">MXN</span>
              </div>
            </div>

            {/* ¿Incluye transporte? */}
            <div className="bg-[#F6F9F6] rounded-2xl p-4 border border-[#C9D4CB]">
              <button type="button" onClick={() => { setIncluyeTransporte(!incluyeTransporte); if (incluyeTransporte) { setCapacidad(""); setTipoVehiculo([]); } }}
                className="flex items-center justify-between w-full"
              >
                <p className="text-sm font-bold text-[#1A4D2E]">¿Incluye transporte propio?</p>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${incluyeTransporte ? "bg-[#0D601E]" : "bg-gray-200"}`}>
                  <motion.div animate={{ x: incluyeTransporte ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </button>
              <AnimatePresence>
                {incluyeTransporte && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4 overflow-hidden">
                    <div>
                      <label className={labelClass}>Tipo de vehículo</label>
                      <Chips options={VEHICLE_TYPES} selected={tipoVehiculo} toggle={v => toggleArr(setTipoVehiculo, v)} />
                    </div>
                    <div>
                      <label className={labelClass}>Capacidad del grupo <FiUsers className="inline mb-0.5 ml-0.5" size={11} /></label>
                      <input className={inputClass} placeholder="Ej: 8 personas" value={capacidad} onChange={e => setCapacidad(e.target.value)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Punto de recogida */}
            <div>
              <label className={labelClass}>Punto de encuentro <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className={inputClass + " mb-3"} placeholder="Ej: Plaza de la Liberación" value={puntoRecogida} onChange={e => setPuntoRecogida(e.target.value)} />
              <div className="rounded-2xl overflow-hidden border border-[#C9D4CB]">
                <MinimapaLocationPicker latitud="" longitud="" onLocationChange={() => {}} height="180px" />
              </div>
            </div>

            {/* Idiomas */}
            <div>
              <label className={labelClass}>Idiomas</label>
              <Chips options={IDIOMAS} selected={idiomas} toggle={v => toggleArr(setIdiomas, v)} />
            </div>

            {/* ¿Qué incluye? */}
            <div>
              <label className={labelClass}>¿Qué incluye?</label>
              <Chips options={QUE_INCLUYE} selected={queIncluye} toggle={v => toggleArr(setQueIncluye, v)} />
            </div>

            {/* Disponibilidad */}
            <div>
              <label className={labelClass}>Disponibilidad</label>
              <input className={inputClass} placeholder="Ej: Lunes a Viernes" value={disponibilidad} onChange={e => setDisponibilidad(e.target.value)} />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 pb-1">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#C9D4CB] text-[#1A4D2E] text-sm font-semibold hover:bg-[#F6F9F6] transition-all">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#1A4D2E] text-white text-sm font-bold hover:bg-[#0D601E] disabled:opacity-60 transition-all">
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

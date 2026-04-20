"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FiX, FiUpload, FiMapPin, FiClock, FiUsers, FiPlus, FiTrash2, FiCheck,
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

interface FormData {
  titulo: string;
  destino: string;
  destinoCalleNum: string;
  destinoCP: string;
  descripcion: string;
  duracion: string;
  precio: string;
  idiomas: string[];
  queIncluye: string[];
  puntoRecogida: string;
  recogidaLat: string;
  recogidaLng: string;
  incluyeTransporte: boolean;
  capacidad: string;
  tipoVehiculo: string[];
  disponibilidad: string;
  fotos: (File | null)[];
}

interface Props {
  guiaId: string;
  guiaNombre: string;
  onClose: () => void;
  onSuccess: (tour: any) => void;
}

function Chips({ options, selected, toggle }: { options: string[]; selected: string[]; toggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <button
            key={o} type="button" onClick={() => toggle(o)}
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

export default function PersonaTourFormModal({ guiaId, guiaNombre, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormData>({
    titulo: "", destino: "", destinoCalleNum: "", destinoCP: "",
    descripcion: "", duracion: "", precio: "",
    idiomas: [], queIncluye: [], puntoRecogida: "",
    recogidaLat: "", recogidaLng: "",
    incluyeTransporte: false,
    capacidad: "", tipoVehiculo: [], disponibilidad: "",
    fotos: [null, null, null],
  });
  const [fotoPreviews, setFotoPreviews] = useState<(string | null)[]>([null, null, null]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleArr = (key: "idiomas" | "queIncluye" | "tipoVehiculo", val: string) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? (f[key] as string[]).filter(v => v !== val) : [...(f[key] as string[]), val],
    }));

  const handlePhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFotos = [...form.fotos];
    newFotos[index] = file;
    set("fotos", newFotos);
    const reader = new FileReader();
    reader.onload = ev => {
      const newPrev = [...fotoPreviews];
      newPrev[index] = ev.target?.result as string;
      setFotoPreviews(newPrev);
    };
    reader.readAsDataURL(file);
    setErrors(e2 => { const n = { ...e2 }; delete n.fotos; return n; });
  };

  const removePhoto = (index: number) => {
    const newFotos = [...form.fotos]; newFotos[index] = null; set("fotos", newFotos);
    const newPrev = [...fotoPreviews]; newPrev[index] = null; setFotoPreviews(newPrev);
    if (fileRefs.current[index]) fileRefs.current[index]!.value = "";
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const clean = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
    set("precio", clean);
  };

  const handleLocationChange = useCallback((lat: string, lng: string) => {
    setForm(f => ({ ...f, recogidaLat: lat, recogidaLng: lng }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    if (!form.destino) e.destino = "Selecciona un destino";
    if (form.destino === "Otro" && !form.destinoCalleNum.trim()) e.destinoCalleNum = "Indica la calle y número";
    if (!form.duracion) e.duracion = "Selecciona la duración";
    if (!form.precio.trim()) e.precio = "Indica el precio";
    if (!form.fotos.some(f => f !== null)) e.fotos = "Sube al menos una foto";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("guiaId", guiaId);
      fd.append("tipoGuia", "persona");
      fd.append("titulo", form.titulo);
      const destinoFinal = form.destino === "Otro" && form.destinoCalleNum.trim()
        ? `${form.destinoCalleNum.trim()}${form.destinoCP ? `, CP ${form.destinoCP}` : ""}`
        : form.destino;
      fd.append("destino", destinoFinal);
      fd.append("descripcion", form.descripcion);
      fd.append("duracion", form.duracion);
      fd.append("precio", form.precio ? `$${form.precio} MXN` : "");
      fd.append("idiomas", JSON.stringify(form.idiomas));
      fd.append("queIncluye", JSON.stringify(form.queIncluye));
      fd.append("puntoRecogida", form.puntoRecogida);
      if (form.recogidaLat) fd.append("recogidaLat", form.recogidaLat);
      if (form.recogidaLng) fd.append("recogidaLng", form.recogidaLng);
      fd.append("incluyeTransporte", String(form.incluyeTransporte));
      if (form.incluyeTransporte) {
        fd.append("capacidad", form.capacidad);
        fd.append("tipoVehiculo", JSON.stringify(form.tipoVehiculo));
      }
      fd.append("disponibilidad", form.disponibilidad);
      form.fotos.forEach(f => { if (f) fd.append("fotos", f); });

      const res = await fetchWithAuth("/api/tours", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || "Error desconocido");
      onSuccess(data.tour);
    } catch (err: any) {
      setSubmitError(err.message || "No se pudo publicar el tour. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[#C9D4CB] bg-white text-sm text-gray-700 focus:outline-none focus:border-[#1A4D2E] transition-all";
  const labelClass = "block text-[11px] font-bold text-[#1A4D2E] mb-1.5";
  const errClass = "text-[10px] text-red-500 mt-0.5 ml-1";

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
          <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] rounded-t-3xl px-6 pt-6 pb-5 text-white">
            <button onClick={onClose} className="absolute top-4 right-5 text-white/70 hover:text-white">
              <FiX size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 p-2.5 rounded-xl">
                <FaMapMarkedAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="font-black text-lg leading-tight">Publicar Experiencia</h2>
                <p className="text-white/70 text-xs mt-0.5">{guiaNombre}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl leading-relaxed">
                <strong>No se pudo publicar:</strong> {submitError}
              </div>
            )}

            {/* Fotos */}
            <div>
              <label className={labelClass}>
                Fotos de la experiencia <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(hasta 3 — la primera es la principal)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <input ref={el => { fileRefs.current[i] = el; }} type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(i, e)} />
                    {fotoPreviews[i] ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-square">
                        <Image src={fotoPreviews[i]!} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-all">
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
              {errors.fotos && <p className={errClass}>{errors.fotos}</p>}
            </div>

            {/* Título */}
            <div>
              <label className={labelClass}>Título de la experiencia <span className="text-red-500">*</span></label>
              <input className={inputClass + (errors.titulo ? " border-red-400" : "")} placeholder="Ej: Recorrido a pie por el Centro Histórico" value={form.titulo} onChange={e => set("titulo", e.target.value)} />
              {errors.titulo && <p className={errClass}>{errors.titulo}</p>}
            </div>

            {/* Destino + Duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Destino <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select className={inputClass + " appearance-none pr-8" + (errors.destino ? " border-red-400" : "")} value={form.destino} onChange={e => { set("destino", e.target.value); set("destinoCalleNum", ""); set("destinoCP", ""); }}>
                    <option value="">Selecciona</option>
                    {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
                {errors.destino && <p className={errClass}>{errors.destino}</p>}
              </div>
              <div>
                <label className={labelClass}>Duración <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select className={inputClass + " appearance-none pr-8" + (errors.duracion ? " border-red-400" : "")} value={form.duracion} onChange={e => set("duracion", e.target.value)}>
                    <option value="">Selecciona</option>
                    {DURACIONES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
                {errors.duracion && <p className={errClass}>{errors.duracion}</p>}
              </div>
            </div>

            {/* Destino personalizado */}
            {form.destino === "Otro" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 bg-[#F6F9F6] rounded-2xl p-4 border border-[#C9D4CB]">
                <p className="text-[11px] text-[#4A7A5A] font-semibold">Indica el destino personalizado:</p>
                <div>
                  <label className={labelClass}>Calle y número <span className="text-red-500">*</span></label>
                  <input className={inputClass + (errors.destinoCalleNum ? " border-red-400" : "")} placeholder="Ej: Av. Hidalgo 123, Col. Centro" value={form.destinoCalleNum} onChange={e => set("destinoCalleNum", e.target.value)} />
                  {errors.destinoCalleNum && <p className={errClass}>{errors.destinoCalleNum}</p>}
                </div>
                <div>
                  <label className={labelClass}>Código postal</label>
                  <input className={inputClass} placeholder="Ej: 44100" value={form.destinoCP} maxLength={5} onChange={e => set("destinoCP", e.target.value.replace(/\D/g, ""))} />
                </div>
              </motion.div>
            )}

            {/* Descripción */}
            <div>
              <label className={labelClass}>Descripción de la experiencia</label>
              <textarea className={inputClass + " resize-none"} rows={3} placeholder="Describe el recorrido, puntos de interés, lo que los turistas vivirán..." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
            </div>

            {/* Precio */}
            <div>
              <label className={labelClass}>Precio por persona <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A4D2E] font-bold text-sm pointer-events-none">$</span>
                <input type="text" inputMode="decimal" className={inputClass + " pl-8 pr-14" + (errors.precio ? " border-red-400" : "")} placeholder="0.00" value={form.precio} onChange={handlePrecioChange} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#769C7B] text-xs font-medium pointer-events-none">MXN</span>
              </div>
              {errors.precio && <p className={errClass}>{errors.precio}</p>}
            </div>

            {/* ¿Incluye transporte? */}
            <div className="bg-[#F6F9F6] rounded-2xl p-4 border border-[#C9D4CB]">
              <button
                type="button"
                onClick={() => { set("incluyeTransporte", !form.incluyeTransporte); if (form.incluyeTransporte) { set("capacidad", ""); set("tipoVehiculo", []); } }}
                className="flex items-center justify-between w-full"
              >
                <div>
                  <p className="text-sm font-bold text-[#1A4D2E] text-left">¿Tu experiencia incluye transporte propio?</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Auto, van, camión u otro vehículo a cargo del guía</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${form.incluyeTransporte ? "bg-[#0D601E]" : "bg-gray-200"}`}>
                  <motion.div animate={{ x: form.incluyeTransporte ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </button>

              <AnimatePresence>
                {form.incluyeTransporte && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4 overflow-hidden">
                    <div>
                      <label className={labelClass}>Tipo de vehículo</label>
                      <Chips options={VEHICLE_TYPES} selected={form.tipoVehiculo} toggle={v => toggleArr("tipoVehiculo", v)} />
                    </div>
                    <div>
                      <label className={labelClass}>Capacidad del grupo <FiUsers className="inline mb-0.5 ml-0.5" size={11} /></label>
                      <input className={inputClass} placeholder="Ej: 8 personas" value={form.capacidad} onChange={e => set("capacidad", e.target.value)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Punto de recogida */}
            <div>
              <label className={labelClass}>Punto de encuentro / recogida <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className={inputClass + " mb-3"} placeholder="Ej: Plaza de la Liberación, frente a la Catedral" value={form.puntoRecogida} onChange={e => set("puntoRecogida", e.target.value)} />
              <div className="rounded-2xl overflow-hidden border border-[#C9D4CB]">
                <MinimapaLocationPicker latitud={form.recogidaLat} longitud={form.recogidaLng} onLocationChange={handleLocationChange} height="200px" />
              </div>
              {(form.recogidaLat && form.recogidaLng) && (
                <p className="text-[10px] text-[#4A7A5A] mt-1 ml-1">Ubicación marcada: {parseFloat(form.recogidaLat).toFixed(5)}, {parseFloat(form.recogidaLng).toFixed(5)}</p>
              )}
            </div>

            {/* Idiomas */}
            <div>
              <label className={labelClass}>Idiomas del guía</label>
              <Chips options={IDIOMAS} selected={form.idiomas} toggle={v => toggleArr("idiomas", v)} />
            </div>

            {/* ¿Qué incluye? */}
            <div>
              <label className={labelClass}>¿Qué incluye?</label>
              <Chips options={QUE_INCLUYE} selected={form.queIncluye} toggle={v => toggleArr("queIncluye", v)} />
            </div>

            {/* Disponibilidad */}
            <div>
              <label className={labelClass}>Disponibilidad</label>
              <input className={inputClass} placeholder="Ej: Lunes a Viernes, previa cita" value={form.disponibilidad} onChange={e => set("disponibilidad", e.target.value)} />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 pb-1">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#C9D4CB] text-[#1A4D2E] text-sm font-semibold hover:bg-[#F6F9F6] transition-all">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#1A4D2E] text-white text-sm font-bold hover:bg-[#0D601E] disabled:opacity-60 transition-all">
                {submitting ? "Publicando..." : "Publicar Experiencia"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

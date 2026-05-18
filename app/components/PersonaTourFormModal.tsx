"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FiX, FiMapPin, FiClock, FiUsers, FiPlus, FiTrash2, FiChevronLeft,
} from "react-icons/fi";
import { FaMapMarkedAlt } from "react-icons/fa";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const MinimapaLocationPicker = dynamic(
  () => import("@/app/components/MinimapaLocationPicker"),
  { ssr: false }
);

const DURACIONES = [
  "2 horas", "3 horas", "4 horas", "Medio día (5-6 h)",
  "Día completo (8+ h)", "2 días", "3 días o más",
];


const QUE_INCLUYE = [
  "Agua", "Transporte", "Comida", "Entradas al lugar",
  "Seguro", "Fotografía", "Degustación", "Alojamiento",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const VEHICLE_TYPES = ["Auto / SUV", "Van", "Minibús", "Camión", "Otro"];
const MAX_FOTOS = 3;

interface FormData {
  titulo: string;
  destino: string;
  destinoLat: string;
  destinoLng: string;
  seVeranAhi: boolean;
  puntoEncuentro: string;
  descripcion: string;
  duracion: string;
  precio: string;
  idiomas: string[];
  queIncluye: string[];
  incluyeTransporte: boolean;
  capacidad: string;
  tipoVehiculo: string[];
  diasDisponibles: string[];
  horaInicio: string;
  horaFin: string;
  fotos: (File | null)[];
}

interface Props {
  guiaId: string;
  guiaNombre: string;
  guiaIdiomas?: string[];
  onClose: () => void;
  onSuccess: (tour: any) => void;
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        resolve(new File([blob!], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
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

export default function PersonaTourFormModal({ guiaId, guiaNombre, guiaIdiomas = [], onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormData>({
    titulo: "", destino: "", destinoLat: "", destinoLng: "",
    seVeranAhi: true, puntoEncuentro: "",
    descripcion: "", duracion: "", precio: "",
    idiomas: [], queIncluye: [],
    incluyeTransporte: false,
    capacidad: "", tipoVehiculo: [], diasDisponibles: [], horaInicio: "09:00", horaFin: "18:00",
    fotos: [null, null, null],
  });
  const [geocoding, setGeocoding] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState(0);
  const [fotoPreviews, setFotoPreviews] = useState<(string | null)[]>([null, null, null]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>(Array(MAX_FOTOS).fill(null));

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

  const handleLocationChange = useCallback(async (lat: string, lng: string) => {
    setForm(f => ({ ...f, destinoLat: lat, destinoLng: lng }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
      const data = await res.json();
      if (data?.display_name) setForm(f => ({ ...f, destino: data.display_name }));
    } catch {}
  }, []);

  const handleDestinoInput = (value: string) => {
    setForm(f => ({ ...f, destino: value }));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (!value.trim()) return;
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1&accept-language=es&countrycodes=mx`);
        const data = await res.json();
        if (data?.[0]) {
          setForm(f => ({ ...f, destinoLat: String(data[0].lat), destinoLng: String(data[0].lon) }));
        }
      } catch {} finally { setGeocoding(false); }
    }, 800);
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.titulo.trim()) e.titulo = "Escribe el nombre del paquete";
      if (!form.destino.trim()) e.destino = "Escribe la dirección o zona principal";
      if (!form.seVeranAhi && !form.puntoEncuentro.trim()) e.puntoEncuentro = "Indica dónde se encontrarán";
      if (!form.duracion) e.duracion = "Selecciona la duración aproximada";
    }
    if (s === 1) {
      if (!form.descripcion.trim()) e.descripcion = "Agrega una descripción del tour";
      if (!form.precio.trim()) e.precio = "Indica el precio por persona";
      if (form.idiomas.length === 0) e.idiomas = "Selecciona al menos un idioma";
      if (form.diasDisponibles.length === 0) e.diasDisponibles = "Selecciona al menos un día disponible";
      if (form.incluyeTransporte && form.tipoVehiculo.length === 0) e.tipoVehiculo = "Selecciona el tipo de vehículo";
      if (form.incluyeTransporte && !form.capacidad.trim()) e.capacidad = "Indica la capacidad";
    }
    if (s === 2) {
      if (!form.fotos.some(f => f !== null)) e.fotos = "Sube al menos una foto";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateStep(2)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("guiaId", guiaId);
      fd.append("tipoGuia", "persona");
      fd.append("titulo", form.titulo);
      fd.append("destino", form.destino);
      if (form.destinoLat) fd.append("destinoLat", form.destinoLat);
      if (form.destinoLng) fd.append("destinoLng", form.destinoLng);
      fd.append("puntoRecogida", form.seVeranAhi ? form.destino : form.puntoEncuentro);
      fd.append("descripcion", form.descripcion);
      fd.append("duracion", form.duracion);
      fd.append("precio", form.precio ? `$${form.precio} MXN` : "");
      fd.append("idiomas", JSON.stringify(form.idiomas));
      fd.append("queIncluye", JSON.stringify(form.queIncluye));
      fd.append("incluyeTransporte", String(form.incluyeTransporte));
      if (form.incluyeTransporte) {
        fd.append("capacidad", form.capacidad);
        fd.append("tipoVehiculo", JSON.stringify(form.tipoVehiculo));
      }
      const disponibilidad = form.diasDisponibles.length > 0
        ? `${form.diasDisponibles.join(", ")} · ${form.horaInicio} – ${form.horaFin}`
        : "";
      fd.append("disponibilidad", disponibilidad);
      for (const f of form.fotos) {
        if (f) fd.append("fotos", await compressImage(f));
      }

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

  const STEP_TITLES = ["Tu Paquete", "Detalles", "Fotos"];

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-[500px] md:max-w-[950px] h-[92vh] md:h-[680px] rounded-t-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="w-full bg-white z-10 pt-4 md:pt-6 px-8 border-b border-gray-50 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto md:hidden mb-4" />
          <div className="absolute top-5 left-6 right-6 flex justify-between items-center">
            {step > 0
              ? <button type="button" onClick={() => setStep(s => s - 1)} className="text-[#1A4D2E] hover:text-[#0D601E] flex items-center gap-1 transition-all">
                  <FiChevronLeft size={26} /> <span className="hidden md:block font-bold text-sm italic">Atrás</span>
                </button>
              : <div />
            }
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-all"><FiX size={26} /></button>
          </div>
          <div className="text-center mt-5 md:mt-2 mb-3">
            <h2 className="text-[26px] md:text-[38px] text-[#8B0000] font-black uppercase leading-tight" style={{ fontFamily: 'var(--font-jockey)' }}>
              {STEP_TITLES[step]}
            </h2>
            <div className="flex justify-center gap-2 mt-3 mb-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="relative h-1.5 w-10 md:w-14 bg-gray-100 rounded-full overflow-hidden">
                  {step >= i && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute inset-0 bg-[#0D601E]" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.2 }} className="w-full space-y-5">

              {/* ── PASO 1: Tu paquete ── */}
              {step === 0 && (<>
                {submitError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">{submitError}</div>}
                <div>
                  <label className={labelClass}>Nombre del paquete <span className="text-red-500">*</span></label>
                  <input className={inputClass + (errors.titulo ? " border-red-400" : "")} placeholder="Ej: Recorrido a pie por el Centro Histórico" value={form.titulo} onChange={e => set("titulo", e.target.value)} />
                  {errors.titulo && <p className={errClass}>{errors.titulo}</p>}
                </div>

                <div>
                  <label className={labelClass}>Zona o destino principal <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input className={inputClass + " pr-10" + (errors.destino ? " border-red-400" : "")} placeholder="Escribe la calle, colonia o zona del tour…" value={form.destino} onChange={e => handleDestinoInput(e.target.value)} />
                    <FiMapPin className={`absolute right-3 top-1/2 -translate-y-1/2 ${geocoding ? "animate-pulse text-[#1A4D2E]" : "text-[#769C7B]"} pointer-events-none`} size={14} />
                  </div>
                  {errors.destino && <p className={errClass}>{errors.destino}</p>}
                  <div className="mt-2 rounded-2xl overflow-hidden border border-[#C9D4CB]">
                    <MinimapaLocationPicker latitud={form.destinoLat} longitud={form.destinoLng} onLocationChange={handleLocationChange} height="180px" />
                  </div>
                  {form.destinoLat && form.destinoLng && <p className="text-[10px] text-[#4A7A5A] mt-1">Pin: {parseFloat(form.destinoLat).toFixed(5)}, {parseFloat(form.destinoLng).toFixed(5)}</p>}
                </div>

                <div className="rounded-2xl border border-[#D9E5DB] bg-white p-4">
                  <button type="button" onClick={() => set("seVeranAhi", !form.seVeranAhi)} className="flex w-full items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[#1A4D2E] text-left">¿Se verán ahí?</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">¿El punto de encuentro es el mismo destino?</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${form.seVeranAhi ? "bg-[#0D601E]" : "bg-gray-200"}`}>
                      <motion.div animate={{ x: form.seVeranAhi ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 rounded-full bg-white shadow" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {!form.seVeranAhi && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                        <label className={labelClass}>Dirección de encuentro <span className="text-red-500">*</span></label>
                        <input className={inputClass + (errors.puntoEncuentro ? " border-red-400" : "")} placeholder="Ej: Plaza de la Liberación, frente a la Catedral" value={form.puntoEncuentro} onChange={e => set("puntoEncuentro", e.target.value)} />
                        {errors.puntoEncuentro && <p className={errClass}>{errors.puntoEncuentro}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className={labelClass}>Duración estimada <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className={inputClass + " appearance-none pr-8" + (errors.duracion ? " border-red-400" : "")} value={form.duracion} onChange={e => set("duracion", e.target.value)}>
                      <option value="">Selecciona</option>
                      {DURACIONES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                  </div>
                  {errors.duracion && <p className={errClass}>{errors.duracion}</p>}
                </div>
              </>)}

              {/* ── PASO 2: Detalles ── */}
              {step === 1 && (<>
                <div>
                  <label className={labelClass}>Descripción del tour <span className="text-red-500">*</span></label>
                  <textarea className={inputClass + " min-h-28 resize-y" + (errors.descripcion ? " border-red-400" : "")} rows={4} placeholder="Describe el recorrido, las paradas y por qué tu experiencia es distinta." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
                  {errors.descripcion && <p className={errClass}>{errors.descripcion}</p>}
                </div>

                <div>
                  <label className={labelClass}>Precio del tour por persona <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A4D2E] font-bold text-sm pointer-events-none">$</span>
                    <input type="text" inputMode="decimal" className={inputClass + " pl-8 pr-14" + (errors.precio ? " border-red-400" : "")} placeholder="0.00" value={form.precio} onChange={handlePrecioChange} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#769C7B] text-xs font-medium pointer-events-none">MXN</span>
                  </div>
                  {errors.precio && <p className={errClass}>{errors.precio}</p>}
                </div>

                <div>
                  <label className={labelClass}>Idiomas del tour <span className="text-red-500">*</span></label>
                  {guiaIdiomas.length === 0
                    ? <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">Ve a <strong>Mi Perfil → Idiomas</strong> y agrégalos antes de publicar un paquete.</p>
                    : <><Chips options={guiaIdiomas} selected={form.idiomas} toggle={v => toggleArr("idiomas", v)} />{errors.idiomas && <p className={errClass}>{errors.idiomas}</p>}</>
                  }
                </div>

                <div>
                  <label className={labelClass}>¿Qué incluye la experiencia?</label>
                  <Chips options={QUE_INCLUYE} selected={form.queIncluye} toggle={v => toggleArr("queIncluye", v)} />
                </div>

                <div>
                  <label className={labelClass}>Días disponibles <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {DIAS_SEMANA.map(dia => {
                      const active = form.diasDisponibles.includes(dia);
                      return (
                        <button key={dia} type="button" onClick={() => setForm(f => ({ ...f, diasDisponibles: active ? f.diasDisponibles.filter(d => d !== dia) : [...f.diasDisponibles, dia] }))}
                          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${active ? "bg-[#1A4D2E] text-white border-[#1A4D2E]" : "bg-white text-[#245038] border-[#C9D4CB] hover:border-[#1A4D2E]"}`}
                        >{dia}</button>
                      );
                    })}
                  </div>
                  {errors.diasDisponibles && <p className={errClass}>{errors.diasDisponibles}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1"><label className={labelClass}>Hora inicio</label><input type="time" value={form.horaInicio} onChange={e => set("horaInicio", e.target.value)} className={inputClass} /></div>
                    <span className="text-[#81C784] font-bold mt-4">–</span>
                    <div className="flex-1"><label className={labelClass}>Hora fin</label><input type="time" value={form.horaFin} onChange={e => set("horaFin", e.target.value)} className={inputClass} /></div>
                  </div>
                  {form.diasDisponibles.length > 0 && <p className="text-[10px] text-[#6C8870] mt-1">{form.diasDisponibles.join(", ")} · {form.horaInicio} – {form.horaFin}</p>}
                </div>

                <div className="rounded-2xl border border-[#D9E5DB] bg-white p-4">
                  <button type="button" onClick={() => { const next = !form.incluyeTransporte; set("incluyeTransporte", next); if (!next) { set("capacidad", ""); set("tipoVehiculo", []); } }} className="flex w-full items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[#1A4D2E] text-left">¿Incluyes transporte?</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Actívalo si trasladas al grupo dentro de la experiencia.</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${form.incluyeTransporte ? "bg-[#0D601E]" : "bg-gray-200"}`}>
                      <motion.div animate={{ x: form.incluyeTransporte ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 rounded-full bg-white shadow" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {form.incluyeTransporte && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4 overflow-hidden">
                        <div><label className={labelClass}>Tipo de vehículo <span className="text-red-500">*</span></label><Chips options={VEHICLE_TYPES} selected={form.tipoVehiculo} toggle={v => toggleArr("tipoVehiculo", v)} />{errors.tipoVehiculo && <p className={errClass}>{errors.tipoVehiculo}</p>}</div>
                        <div><label className={labelClass}>Capacidad <span className="text-red-500">*</span></label><div className="relative"><input className={inputClass + (errors.capacidad ? " border-red-400" : "")} placeholder="Ej: 8 personas" value={form.capacidad} onChange={e => set("capacidad", e.target.value)} /><FiUsers className="absolute right-4 top-1/2 -translate-y-1/2 text-[#769C7B]" size={14} /></div>{errors.capacidad && <p className={errClass}>{errors.capacidad}</p>}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>)}

              {/* ── PASO 3: Fotos ── */}
              {step === 2 && (<>
                {submitError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">{submitError}</div>}
                <p className="text-sm text-[#6C8870] text-center">La primera imagen será la portada del paquete.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: MAX_FOTOS }, (_, i) => (
                    <div key={i} className={i === 0 ? "sm:col-span-2" : ""}>
                      <input ref={el => { fileRefs.current[i] = el; }} type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(i, e)} />
                      {fotoPreviews[i] ? (
                        <div className={`relative overflow-hidden rounded-2xl ${i === 0 ? "aspect-[1.6/1]" : "aspect-square"}`}>
                          <img src={fotoPreviews[i]!} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePhoto(i)} className="absolute top-2 right-2 bg-black/55 text-white rounded-full p-1.5 hover:bg-black/75"><FiTrash2 size={12} /></button>
                          {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-[#0D601E] px-2 py-1 text-[10px] font-bold text-white">Portada</span>}
                        </div>
                      ) : (
                        <button type="button" onClick={() => fileRefs.current[i]?.click()} className={`w-full rounded-2xl border-2 border-dashed border-[#C9D4CB] bg-white text-[#5D8066] hover:border-[#1A4D2E] hover:bg-[#F6F9F6] transition-all ${i === 0 ? "aspect-[1.6/1]" : "aspect-square"}`}>
                          <div className="flex h-full flex-col items-center justify-center gap-2"><FiPlus className="text-lg" /><span className="text-xs font-semibold">{i === 0 ? "Subir portada" : `Foto ${i + 1}`}</span></div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.fotos && <p className={errClass + " text-center"}>{errors.fotos}</p>}
                <div className="bg-[#F7FBF7] rounded-2xl p-4 text-xs text-[#5E7862] space-y-1.5 border border-[#E3ECE4]">
                  <p>✓ Usa una portada limpia y fotos reales del recorrido</p>
                  <p>✓ Describe claramente la experiencia y lo que incluye</p>
                  <p>✓ Indica disponibilidad para evitar dudas al turista</p>
                </div>
              </>)}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className="px-6 md:px-10 py-4 border-t border-gray-100 shrink-0">
          {step < 2
            ? <button type="button" onClick={nextStep} className="w-full md:w-3/4 mx-auto block bg-[#0D601E] text-white py-3 rounded-full font-bold text-sm tracking-wide hover:bg-[#094d18] transition-all shadow-md">
                Siguiente →
              </button>
            : <button type="button" onClick={handleSubmit as any} disabled={submitting} className="w-full md:w-3/4 mx-auto block bg-[#0D601E] text-white py-3 rounded-full font-bold text-sm tracking-wide hover:bg-[#094d18] disabled:opacity-60 transition-all shadow-md">
                {submitting ? "Publicando..." : "Publicar Paquete"}
              </button>
          }
        </div>

      </motion.div>
    </div>
  );
}

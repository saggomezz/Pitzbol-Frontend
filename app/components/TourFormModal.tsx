"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUpload, FiMapPin, FiClock, FiDollarSign, FiUsers, FiChevronDown } from "react-icons/fi";
import { FaBus } from "react-icons/fa";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const DESTINOS = [
  "Centro Histórico", "Tequila", "Tlaquepaque", "Tonalá",
  "Chapala", "Mazamitla", "Tapalpa", "Zona Metropolitana", "Puerto Vallarta", "Otro",
];

const DURACIONES = [
  "2 horas", "3 horas", "4 horas", "Medio día (5-6 h)",
  "Día completo (8+ h)", "2 días", "3 días o más",
];

const PRECIOS = [
  "$300 - $600 MXN", "$600 - $1,200 MXN",
  "$1,200 - $2,500 MXN", "$2,500+ MXN", "Consultar precio",
];

const IDIOMAS = ["Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués", "Japonés", "Chino"];

const QUE_INCLUYE = [
  "Guía certificado", "Agua", "Transporte", "Comida", "Entradas a museos",
  "Seguro", "Fotografía", "Degustación", "Alojamiento",
];

const VEHICLE_TYPES = ["Van", "Camión", "Minibús", "Auto / SUV", "Otro"];

interface TourFormData {
  titulo: string;
  destino: string;
  descripcion: string;
  duracion: string;
  precio: string;
  idiomas: string[];
  queIncluye: string[];
  puntoRecogida: string;
  capacidad: string;
  tipoVehiculo: string[];
  disponibilidad: string;
  fotoPrincipal: File | null;
}

interface Props {
  empresaId: string;
  empresaNombre: string;
  onClose: () => void;
  onSuccess: (tour: any) => void;
}

const chips = (
  options: string[],
  selected: string[],
  toggle: (v: string) => void,
  color = "green"
) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => {
      const active = selected.includes(o);
      return (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
            active
              ? color === "blue"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[#1A4D2E] text-white border-[#1A4D2E]"
              : "bg-white text-[#245038] border-[#C9D4CB] hover:border-[#1A4D2E]"
          }`}
        >
          {o}
        </button>
      );
    })}
  </div>
);

export default function TourFormModal({ empresaId, empresaNombre, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<TourFormData>({
    titulo: "",
    destino: "",
    descripcion: "",
    duracion: "",
    precio: "",
    idiomas: [],
    queIncluye: [],
    puntoRecogida: "",
    capacidad: "",
    tipoVehiculo: [],
    disponibilidad: "",
    fotoPrincipal: null,
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof TourFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof TourFormData, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleArr = (key: "idiomas" | "queIncluye" | "tipoVehiculo", val: string) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("fotoPrincipal", file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    if (!form.destino) e.destino = "Selecciona un destino";
    if (!form.duracion) e.duracion = "Selecciona la duración";
    if (!form.precio) e.precio = "Selecciona el precio";
    if (!form.fotoPrincipal) e.fotoPrincipal = "La foto principal es obligatoria" as any;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("empresaId", empresaId);
      fd.append("titulo", form.titulo);
      fd.append("destino", form.destino);
      fd.append("descripcion", form.descripcion);
      fd.append("duracion", form.duracion);
      fd.append("precio", form.precio);
      fd.append("idiomas", JSON.stringify(form.idiomas));
      fd.append("queIncluye", JSON.stringify(form.queIncluye));
      fd.append("puntoRecogida", form.puntoRecogida);
      fd.append("capacidad", form.capacidad);
      fd.append("tipoVehiculo", JSON.stringify(form.tipoVehiculo));
      fd.append("disponibilidad", form.disponibilidad);
      if (form.fotoPrincipal) fd.append("fotoPrincipal", form.fotoPrincipal);

      const res = await fetchWithAuth("/api/tours", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Error al publicar");
      onSuccess(data.tour);
    } catch (err: any) {
      setSubmitError(err.message || "Error al publicar el tour");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-[#C9D4CB] bg-white text-sm text-gray-700 focus:outline-none focus:border-[#1A4D2E] transition-all";
  const labelClass = "block text-[11px] font-bold text-[#1A4D2E] mb-1.5";
  const errClass = "text-[10px] text-red-500 mt-0.5 ml-1";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
            <button
              onClick={onClose}
              className="absolute top-4 right-5 text-white/70 hover:text-white transition-colors"
            >
              <FiX size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 p-2.5 rounded-xl">
                <FaBus className="text-white text-xl" />
              </div>
              <div>
                <h2 className="font-black text-lg leading-tight">Publicar Tour</h2>
                <p className="text-white/70 text-xs mt-0.5">{empresaNombre}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">
                {submitError}
              </div>
            )}

            {/* Foto principal */}
            <div>
              <label className={labelClass}>
                Foto principal del tour <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
                  fotoPreview ? "border-[#1A4D2E]" : "border-[#C9D4CB] hover:border-[#1A4D2E]"
                } bg-[#F6F9F6]`}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-40 object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <FiUpload className="text-[#769C7B] text-2xl" />
                    <p className="text-xs text-[#769C7B] font-medium">
                      Sube la foto del destino o del tour
                    </p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {errors.fotoPrincipal && <p className={errClass}>{errors.fotoPrincipal as any}</p>}
            </div>

            {/* Título */}
            <div>
              <label className={labelClass}>
                Título del tour <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass + (errors.titulo ? " border-red-400" : "")}
                placeholder="Ej: Tour a Tequila — Día completo con degustación"
                value={form.titulo}
                onChange={e => set("titulo", e.target.value)}
              />
              {errors.titulo && <p className={errClass}>{errors.titulo}</p>}
            </div>

            {/* Destino + Duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Destino principal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={inputClass + " appearance-none pr-8" + (errors.destino ? " border-red-400" : "")}
                    value={form.destino}
                    onChange={e => set("destino", e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
                {errors.destino && <p className={errClass}>{errors.destino}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  Duración <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={inputClass + " appearance-none pr-8" + (errors.duracion ? " border-red-400" : "")}
                    value={form.duracion}
                    onChange={e => set("duracion", e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {DURACIONES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#769C7B] pointer-events-none" size={14} />
                </div>
                {errors.duracion && <p className={errClass}>{errors.duracion}</p>}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className={labelClass}>Descripción del tour</label>
              <textarea
                className={inputClass + " resize-none"}
                rows={3}
                placeholder="Describe la experiencia, puntos de interés, lo que harán durante el recorrido..."
                value={form.descripcion}
                onChange={e => set("descripcion", e.target.value)}
              />
            </div>

            {/* Precio */}
            <div>
              <label className={labelClass}>
                Precio por persona <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PRECIOS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("precio", p)}
                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                      form.precio === p
                        ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                        : "bg-white text-[#245038] border-[#C9D4CB] hover:border-[#1A4D2E]"
                    }`}
                  >
                    <FiDollarSign className="inline mb-0.5 mr-0.5" size={10} />
                    {p}
                  </button>
                ))}
              </div>
              {errors.precio && <p className={errClass}>{errors.precio}</p>}
            </div>

            {/* Punto de recogida + Capacidad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Punto de recogida</label>
                <input
                  className={inputClass}
                  placeholder="Ej: Hotel Crowne Plaza"
                  value={form.puntoRecogida}
                  onChange={e => set("puntoRecogida", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Capacidad <FiUsers className="inline mb-0.5 ml-0.5" size={11} />
                </label>
                <input
                  className={inputClass}
                  placeholder="Ej: 12 personas"
                  value={form.capacidad}
                  onChange={e => set("capacidad", e.target.value)}
                />
              </div>
            </div>

            {/* Idiomas */}
            <div>
              <label className={labelClass}>Idiomas del guía</label>
              {chips(IDIOMAS, form.idiomas, v => toggleArr("idiomas", v))}
            </div>

            {/* Tipo de vehículo */}
            <div>
              <label className={labelClass}>Tipo de vehículo</label>
              {chips(VEHICLE_TYPES, form.tipoVehiculo, v => toggleArr("tipoVehiculo", v))}
            </div>

            {/* ¿Qué incluye? */}
            <div>
              <label className={labelClass}>¿Qué incluye?</label>
              {chips(QUE_INCLUYE, form.queIncluye, v => toggleArr("queIncluye", v))}
            </div>

            {/* Disponibilidad */}
            <div>
              <label className={labelClass}>Disponibilidad</label>
              <input
                className={inputClass}
                placeholder="Ej: Martes a Domingo, salida 8:00 AM"
                value={form.disponibilidad}
                onChange={e => set("disponibilidad", e.target.value)}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#C9D4CB] text-[#1A4D2E] text-sm font-semibold hover:bg-[#F6F9F6] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[#1A4D2E] text-white text-sm font-bold hover:bg-[#0D601E] disabled:opacity-60 transition-all"
              >
                {submitting ? "Publicando..." : "Publicar Tour"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

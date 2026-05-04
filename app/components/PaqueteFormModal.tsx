"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FiX, FiPlus, FiTrash2, FiUpload, FiPackage } from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";

interface PaqueteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (paquete: any) => void;
  guiaId: string;
}

const IDIOMAS = ["Español", "Inglés", "Portugués", "Francés", "Alemán", "Italiano", "Japonés", "Chino Mandarín"];

export default function PaqueteFormModal({ isOpen, onClose, onCreated, guiaId }: PaqueteFormModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destino, setDestino] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  const [puntoSalida, setPuntoSalida] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [incluye, setIncluye] = useState<string[]>([""]);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitulo(""); setDescripcion(""); setDestino(""); setDuracion("");
    setPrecio(""); setPuntoSalida(""); setCapacidad("");
    setIdiomas([]); setIncluye([""]); setFoto(null); setFotoPreview(null);
    setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleIdioma = (idioma: string) => {
    setIdiomas(prev => prev.includes(idioma) ? prev.filter(i => i !== idioma) : [...prev, idioma]);
  };

  const handleGuardar = async () => {
    if (!titulo.trim() || !destino.trim()) { setError("Título y destino son obligatorios"); return; }
    setGuardando(true);
    setError("");
    try {
      const token = localStorage.getItem("pitzbol_token");
      const backendUrl = getBackendOrigin();
      const fd = new FormData();
      fd.append("titulo", titulo);
      fd.append("descripcion", descripcion);
      fd.append("destino", destino);
      fd.append("duracion", duracion);
      fd.append("precio", precio);
      fd.append("puntoSalida", puntoSalida);
      fd.append("capacidad", capacidad);
      fd.append("idiomas", JSON.stringify(idiomas));
      fd.append("queIncluye", JSON.stringify(incluye.filter(Boolean)));
      if (foto) fd.append("foto", foto);

      const res = await fetch(`${backendUrl}/api/paquetes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear paquete");
      onCreated(data.paquete);
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2.5 border border-[#E0F2F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] text-[#1A4D2E] bg-white text-sm";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-2xl max-h-[90vh] rounded-t-[28px] md:rounded-[28px] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] text-white p-6 rounded-t-[28px] flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl"><FiPackage size={20} /></div>
              <div>
                <h2 className="text-lg font-bold">Nuevo Paquete</h2>
                <p className="text-xs text-white/70">Crea un paquete para ofrecer a turistas</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
              <FiX size={24} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Foto */}
            <div>
              <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-2 block">Foto del paquete</label>
              <label className="cursor-pointer block">
                <div className={`border-2 border-dashed rounded-2xl h-36 flex flex-col items-center justify-center transition-all ${fotoPreview ? "border-[#1A4D2E]" : "border-[#E0F2F1] hover:border-[#A5D6A7]"}`}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <FiUpload size={28} className="text-[#81C784] mb-2" />
                      <span className="text-xs text-[#81C784] font-medium">Subir imagen</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </label>
            </div>

            {/* Título y Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Título *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Tour Tlaquepaque al atardecer" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Destino *</label>
                <input value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Tlaquepaque, Jalisco" className={inputCls} />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Describe el recorrido..." className={`${inputCls} resize-none`} />
            </div>

            {/* Duración, Precio, Punto de salida, Capacidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Duración</label>
                <input value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="Ej. 4 horas" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Precio</label>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. $350 MXN" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Punto de salida</label>
                <input value={puntoSalida} onChange={e => setPuntoSalida(e.target.value)} placeholder="Ej. Plaza Tapatía" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-1 block">Capacidad</label>
                <input value={capacidad} onChange={e => setCapacidad(e.target.value)} placeholder="Ej. 10 personas" className={inputCls} />
              </div>
            </div>

            {/* Idiomas */}
            <div>
              <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-2 block">Idiomas</label>
              <div className="flex flex-wrap gap-2">
                {IDIOMAS.map(id => (
                  <button key={id} type="button" onClick={() => toggleIdioma(id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${idiomas.includes(id) ? "bg-[#1A4D2E] text-white border-[#1A4D2E]" : "bg-white text-[#1A4D2E] border-[#E0F2F1] hover:border-[#1A4D2E]"}`}>
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {/* Qué incluye */}
            <div>
              <label className="text-xs font-bold text-[#81C784] uppercase tracking-wide mb-2 block">¿Qué incluye?</label>
              <div className="space-y-2">
                {incluye.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={item} onChange={e => { const n = [...incluye]; n[i] = e.target.value; setIncluye(n); }}
                      placeholder={`Incluye ${i + 1}`} className={`${inputCls} flex-1`} />
                    {incluye.length > 1 && (
                      <button type="button" onClick={() => setIncluye(prev => prev.filter((_, j) => j !== i))}
                        className="p-2.5 text-red-400 hover:text-red-600 transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setIncluye(prev => [...prev, ""])}
                  className="flex items-center gap-2 text-xs text-[#1A4D2E] hover:text-[#0D601E] font-medium transition-colors">
                  <FiPlus size={14} /> Agregar ítem
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-2 border-t border-[#E0F2F1]">
              <button onClick={handleGuardar} disabled={guardando}
                className="flex-1 bg-[#0D601E] hover:bg-[#094d18] text-white py-3 rounded-full font-bold text-sm transition-all disabled:opacity-50">
                {guardando ? "Guardando..." : "Publicar Paquete"}
              </button>
              <button onClick={handleClose} disabled={guardando}
                className="px-6 py-3 bg-[#F1F8F6] text-[#81C784] rounded-full font-bold text-sm hover:bg-[#E0F2F1] transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

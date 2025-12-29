"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FiCheckCircle, FiChevronDown, FiChevronLeft,
  FiCreditCard, FiFileText, FiInfo, FiUser,
  FiX, FiCamera
} from "react-icons/fi";
import imglogo from "./logoPitzbol.png";

const CATEGORIES = [
  "Arte", "Cultural", "Gastronómico", "Vida Nocturna", 
  "Deportiva", "Aventura", "Arquitectura", "Naturaleza"
];

const GuideModal = ({ isOpen, onClose, isAlreadyUser = false }: { isOpen: boolean; onClose: () => void; isAlreadyUser?: boolean; }) => {
  const [step, setStep] = useState(isAlreadyUser ? 1 : 0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [nacionalidad, setNacionalidad] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [rfc, setRfc] = useState("");
  const [rfcError, setRfcError] = useState(false);

  // --- NUEVO: ESTADO PARA CAPTURAR LOS INPUTS ---
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    password: "",
    propuestaTour: "",
    codigoPostal: "",
    clabe: ""
  });

  // Función para actualizar el estado de los textos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateRFC = (valor: string) => {
    const rfcRegex = /^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/i;
    setRfcError(valor !== "" && !rfcRegex.test(valor));
  };

  useEffect(() => {
    if (isOpen) {
      setStep(isAlreadyUser ? 1 : 0);
      setIsFinishing(false);
    }
  }, [isOpen, isAlreadyUser]);

  // --- MODIFICADO: FUNCIÓN DE FINALIZAR CON FETCH ---
  const handleFinish = async () => {
    setIsFinishing(true);

    const payload = {
      ...formData,
      nacionalidad,
      rfc,
      categorias: selectedCats,
      rol: "guia"
    };

    try {
      const response = await fetch('http://localhost:3001/api/guides/register-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        alert("Hubo un error al registrar en la base de datos.");
        setIsFinishing(false);
      }
    } catch (error) {
      console.error("Error conectando al backend:", error);
      alert("No se pudo conectar con el servidor.");
      setIsFinishing(false);
    }
  };

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm";
  const labelClass = "text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-2 block";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-[850px] min-h-[500px] max-h-[90vh] overflow-y-auto rounded-[30px] md:rounded-[50px] shadow-2xl p-8 md:p-12 border border-white/20"
      >
        <AnimatePresence mode="wait">
          {!isFinishing ? (
            <motion.div key="form" exit={{ opacity: 0, scale: 0.9 }}>
              <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-red-500 transition-all z-10"><FiX size={28} /></button>
              <div className="text-center mb-8">
                <h2 className="text-[32px] md:text-[42px] text-[#8B0000] font-black leading-none uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0 ? "Únete como Guía" : step === 1 ? "¿Qué experiencias ofreces?" : step === 2 ? "Documentación" : "Datos de Pago"}
                </h2>
                <p className="text-[#1A4D2E] text-sm italic mt-1">Paso {isAlreadyUser ? step : step + 1} de 4</p>
              </div>
              
              {step > (isAlreadyUser ? 1 : 0) && (
                <button onClick={() => setStep(step - 1)} className="absolute top-8 left-8 text-[#769C7B] hover:text-[#0D601E] flex items-center gap-1 text-xs font-bold uppercase transition-all">
                  <FiChevronLeft size={20} /> Atrás
                </button>
              )}

              <div className="max-w-2xl mx-auto">
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre(s)" className={inputClass} />
                      <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido(s)" className={inputClass} />
                      <div className="relative">
                        <select value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className={inputClass + " appearance-none cursor-pointer pr-10"}>
                          <option value="" disabled>Nacionalidad</option>
                          <option value="México">México</option>
                          <option value="Otro">Otro</option>
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" />
                      </div>
                      <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className={inputClass} />
                    </div>
                    <input name="correo" value={formData.correo} onChange={handleChange} placeholder="Correo electrónico" className={inputClass} />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" className={inputClass} />
                    <button onClick={() => setStep(1)} className="w-full bg-[#0D601E] text-white py-3 rounded-full mt-4 font-bold uppercase tracking-widest text-xs">Siguiente Paso</button>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => toggleCategory(cat)} className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${selectedCats.includes(cat) ? 'bg-[#0D601E] border-[#0D601E] text-white shadow-lg' : 'border-gray-200 text-gray-500 hover:border-[#0D601E]'}`}>{cat}</button>
                      ))}
                    </div>
                    <div className="relative mt-4">
                       <span className={labelClass}>Propuesta de Tour (Editable)</span>
                       <textarea name="propuestaTour" value={formData.propuestaTour} onChange={handleChange} placeholder="Ej: Recorridos históricos y leyendas..." className={inputClass + " rounded-3xl min-h-[100px] py-4 resize-none"} />
                    </div>
                    <button onClick={() => setStep(2)} disabled={selectedCats.length === 0} className="w-full bg-[#0D601E] text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-50">Siguiente: Documentos</button>
                  </div>
                )}

                {step === 2 && (
                  <motion.div className="space-y-6">
                    <span className={labelClass}>Identificación Oficial (INE / Pasaporte)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all">
                        <FiFileText className="text-[#769C7B] mb-3" size={32} />
                        <p className="text-sm text-[#1A4D2E] font-black uppercase italic">Frente</p>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all">
                        <FiFileText className="text-[#769C7B] mb-3" size={32} />
                        <p className="text-sm text-[#1A4D2E] font-black uppercase italic">Reverso</p>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                    </div>
                    <button onClick={() => setStep(3)} className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">Siguiente: Datos Fiscales</button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div className="space-y-6">
                    <div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10">
                      <h4 className="font-bold uppercase text-xs text-[#0D601E] mb-4">Información Fiscal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="RFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} onBlur={(e) => validateRFC(e.target.value)} className={`${inputClass} uppercase ${rfcError ? "border-red-500" : ""}`} maxLength={13} />
                        <input name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} placeholder="Código Postal" className={inputClass} maxLength={5} />
                      </div>
                    </div>

                    <div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10">
                      <h4 className="font-bold uppercase text-xs text-[#0D601E] mb-4">Método de Cobro</h4>
                      <input name="clabe" value={formData.clabe} onChange={handleChange} placeholder="CLABE Interbancaria (18 dígitos)" className={inputClass} maxLength={18} />
                    </div>

                    {/* BOTÓN FINAL QUE LLAMA AL BACKEND */}
                    <button onClick={handleFinish} className="w-full bg-[#8B0000] text-white py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl">
                      Finalizar Afiliación
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="loading" className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative w-32 h-32 mb-8">
                <Image src={imglogo} alt="Cargando" fill className="object-contain" />
              </motion.div>
              <h3 className="text-2xl font-black text-[#1A4D2E] uppercase">Procesando solicitud...</h3>
              <p className="text-[#769C7B] italic mt-2">Estamos guardando tus datos en Pitzbol.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GuideModal;
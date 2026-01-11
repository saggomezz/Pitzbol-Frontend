"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  FiX, FiBriefcase, FiMapPin, FiGlobe, FiImage, 
  FiChevronLeft, FiCheckCircle, FiInfo, FiTag, FiUser, FiChevronDown
} from "react-icons/fi";
import Image from "next/image";
import imglogo from "./logoPitzbol.png";

const BusinessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const [rfc, setRfc] = useState("");
  const [cp, setCp] = useState("");
  const [rfcError, setRfcError] = useState(false);
  const [cpError, setCpError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsFinishing(false);
      setRfc("");
      setCp("");
      setRfcError(false);
      setCpError(false);
    }
  }, [isOpen]);

  const validateRFC = (valor: string) => {
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
    setRfcError(valor !== "" && !rfcRegex.test(valor));
  };

  const validateCP = (valor: string) => {
    setCpError(valor !== "" && !/^\d{5}$/.test(valor));
  };

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => onClose(), 3000);
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm";
  const labelClass = "text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-2 block";
  const cardClass = "bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,96,30,0.1)] hover:border-[#0D601E]/80";
  
  const btnPrimary = "w-full bg-[#0D601E] text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#094d18] transition-all active:scale-95";
  const btnFinish = "w-full bg-[#8B0000] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] transition-transform active:scale-95";
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-[850px] min-h-[500px] max-h-[90vh] overflow-y-auto rounded-[50px] shadow-2xl p-8 md:p-12 border border-white/20"
      >
        <AnimatePresence mode="wait">
          {!isFinishing ? (
            <motion.div key="form" exit={{ opacity: 0, scale: 0.9 }}>
              <button onClick={onClose} className="absolute top-6 right-8 z-[310] text-gray-400 hover:text-red-500 transition-all">
                <FiX size={28} />
              </button>
              
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="absolute top-8 left-10 text-[#769C7B] hover:text-[#0D601E] flex items-center gap-1 text-xs font-bold uppercase transition-all">
                  <FiChevronLeft size={20} /> Atrás
                </button>
              )}

              <div className="text-center mb-10">
                <h2 className="text-[32px] md:text-[42px] text-[#8B0000] font-black uppercase leading-none" style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0 ? "Alianza Comercial" : step === 1 ? "Imagen del Negocio" : step === 2 ? "Galería del Local" : "Información Fiscal"}
                </h2>
                <p className="text-[#1A4D2E] text-sm italic mt-1">Paso {step + 1} de 4</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className={cardClass}>
                      <span className={labelClass}>Identidad de Marca</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Nombre del Negocio" className={inputClass} />
                        
                        <div className="relative">
                          <select 
                            className={inputClass + " appearance-none cursor-pointer pr-10"}
                            defaultValue="" 
                          >
                            <option value="" disabled>Categoría de Socio</option>
                            <option value="Restaurante / Bar">Restaurante / Bar</option>
                            <option value="Cafetería / Desayunos">Cafetería / Desayunos</option>
                            <option value="Hotelería / Hostal / Airbnb">Hotelería / Hostal / Airbnb</option>
                            <option value="Transporte / Traslados">Transporte / Traslados</option>
                            <option value="Renta de Equipo Deportivo">Renta de Equipo Deportivo</option>
                            <option value="Artesanías / Souvenirs">Artesanías / Souvenirs</option>
                            <option value="Vida Nocturna / Club">Vida Nocturna / Club</option>
                          </select>
                          <FiChevronDown 
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" 
                            size={18} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className={cardClass}>
                      <span className={labelClass}>Contacto Oficial</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Correo de Negocios" className={inputClass} />
                        <input placeholder="WhatsApp / Teléfono" className={inputClass} />
                      </div>
                    </div>

                    <button onClick={() => setStep(1)} className={btnPrimary}>
                      Siguiente Paso
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all">
                        <FiImage size={32} className="text-[#769C7B] mb-2"/>
                        <p className="text-sm font-black text-[#1A4D2E] uppercase">Logo del Negocio</p>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                      <div className="space-y-4">
                        <div className="relative">
                          <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
                          <input placeholder="Ubicación Google Maps" className={inputClass + " pl-14"} />
                        </div>
                        <div className="relative">
                          <FiGlobe className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
                          <input placeholder="Sitio Web / Redes" className={inputClass + " pl-14"} />
                        </div>
                        <div className="p-4 bg-[#0D601E]/5 rounded-2xl border border-[#0D601E]/10 italic text-[10px] text-gray-500">
                           <FiInfo className="inline mr-1"/> Esta información ayudará a los turistas a encontrarte fácilmente en el mapa.
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className={btnPrimary}>Siguiente: Fotos</button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className={cardClass}>
                      <span className={labelClass}>Galería del Establecimiento</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                          <label key={i} className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#769C7B]/40 rounded-3xl cursor-pointer hover:bg-[#F6F0E6]/50 transition-all">
                            <FiImage className="text-[#769C7B] mb-1" size={20} />
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Foto {i}</span>
                            <input type="file" className="hidden" accept="image/*" />
                          </label>
                        ))}
                      </div>
                      <div className="mt-6 p-4 bg-[#F6F0E6] rounded-2xl border border-[#1A4D2E]/10">
                        <p className="text-[11px] text-[#1A4D2E] leading-relaxed italic">
                          <FiInfo className="inline mb-1 mr-2 text-[#0D601E]"/> 
                          <strong>Nota:</strong> Estas imágenes son fundamentales para validar la autenticidad de tu perfil. 
                          Podrás subir más fotos detalladas una vez que tu cuenta sea aprobada.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setStep(3)} className={btnPrimary}>Siguiente: Datos Fiscales</button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className={cardClass}>
                      <div className="flex items-center gap-2 mb-4 text-[#0D601E]">
                        <FiUser size={20} />
                        <h4 className="font-bold uppercase text-xs tracking-tighter">Facturación</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input 
                            placeholder="RFC de la Empresa" 
                            className={`${inputClass} uppercase ${rfcError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={rfc}
                            onChange={(e) => setRfc(e.target.value.toUpperCase())}
                            onBlur={() => validateRFC(rfc)}
                            maxLength={13}
                          />
                          {rfcError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic">RFC inválido (13 caracteres)</p>}
                        </div>
                        <div className="relative">
                          <input 
                            placeholder="C.P. Fiscal" 
                            className={`${inputClass} ${cpError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={cp}
                            onChange={(e) => setCp(e.target.value.replace(/\D/g, ''))}
                            onBlur={() => validateCP(cp)}
                            maxLength={5}
                          />
                          {cpError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic">C.P. inválido (5 números)</p>}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFinish} className={btnFinish}>Finalizar Alianza</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
                <Image src={imglogo} alt="Cargando" fill className="object-contain" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>Validando Empresa...</h3>
              <p className="text-[#769C7B] italic mt-2">Estamos revisando tu perfil para conectar con miles de turistas.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BusinessModal;
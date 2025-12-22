"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
	FiCheckCircle,
	FiChevronDown,
	FiChevronLeft,
	FiCreditCard, FiFileText,
	FiInfo,
	FiUser,
	FiX
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

const validateRFC = (valor: string) => {
  // Regex para RFC de persona física: 4 letras, 6 números, 3 alfanuméricos
  const rfcRegex = /^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/i;
  if (valor !== "" && !rfcRegex.test(valor)) {
    setRfcError(true);
  } else {
    setRfcError(false);
  }
};

  useEffect(() => {
    if (isOpen) {
      setStep(isAlreadyUser ? 1 : 0);
      setIsFinishing(false);
    }
  }, [isOpen, isAlreadyUser]);

  const handleFinish = () => {
    setIsFinishing(true);

    setTimeout(() => {
      onClose();
    }, 3000);    //3 segundos
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
				 <button
				 	onClick={() => setStep(step - 1)}
    				className="absolute top-8 left-8 text-[#769C7B] hover:text-[#0D601E] flex items-center gap-1 text-xs font-bold uppercase transition-all"
 		        >
   					<FiChevronLeft size={20} />
					Atrás
				</button>
				)}

              <div className="max-w-2xl mx-auto">
                {/* PASOS DEL FORMULARIO (Igual al anterior) */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input placeholder="Nombre(s)" className={inputClass} />
                      <input placeholder="Apellido(s)" className={inputClass} />
                      <div className="relative">
                        <select value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className={inputClass + " appearance-none cursor-pointer pr-10"}>
                          <option value="" disabled>Nacionalidad</option>
                          <option value="México">México</option>
                          <option value="Otro">Otro</option>
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" />
                      </div>
                      <input placeholder="Teléfono" className={inputClass} />
                    </div>
                    <input placeholder="Correo electrónico" className={inputClass} />
                    <input type="password" placeholder="Contraseña" className={inputClass} />
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
                       <textarea placeholder="Ej: Recorridos históricos y leyendas..." className={inputClass + " rounded-3xl min-h-[100px] py-4 resize-none"} />
                    </div>
                    <button onClick={() => setStep(2)} disabled={selectedCats.length === 0} className="w-full bg-[#0D601E] text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-50">Siguiente: Documentos</button>
                  </div>
                )}

				{/* PASO 2: ESCANEO DE IDENTIFICACIÓN */}
				{step === 2 && (
				<motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
					<div>
					<span className={labelClass}>Identificación Oficial (INE / Pasaporte)</span>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
						{/* Lado Frontal */}
						<label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all group">
						<div className="flex flex-col items-center justify-center text-center px-4">
							<FiFileText className="text-[#769C7B] mb-3" size={32} />
							<p className="text-sm md:text-base text-[#1A4D2E] font-black uppercase italic leading-tight">Frente de la Identificación</p>
							<p className="text-xs text-gray-500 mt-2 font-medium">Haz clic para escanear o subir archivo</p>
						</div>
						<input type="file" className="hidden" accept="image/*" />
						</label>

						{/* Lado Reverso */}
						<label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all group">
						<div className="flex flex-col items-center justify-center text-center px-4">
							<FiFileText className="text-[#769C7B] mb-3" size={32} />
							<p className="text-sm md:text-base text-[#1A4D2E] font-black uppercase italic leading-tight">Reverso de la Identificación</p>
							<p className="text-xs text-gray-500 mt-2 font-medium">Haz clic para escanear o subir archivo</p>
						</div>
						<input type="file" className="hidden" accept="image/*" />
						</label>
					</div>
					</div>

					<button onClick={() => setStep(3)} className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">
					Siguiente: Datos Fiscales y de Pago
					</button>
				</motion.div>
				)}

				{/* PASO 3: DATOS FISCALES Y BANCARIOS (UNIFICADOS) */}
				{step === 3 && (
				<motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
					
				{/* SECCIÓN FISCAL */}
				<div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,96,30,0.1)] hover:border-[#0D601E]/80">
				<div className="flex items-center gap-2 mb-4 text-[#0D601E]">
					<FiUser size={20} />
					<h4 className="font-bold uppercase text-xs tracking-tighter">Información Fiscal</h4>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="relative">
					<input 
						placeholder="RFC con Homoclave" 
						value={rfc}
						onChange={(e) => setRfc(e.target.value.toUpperCase())}
						onBlur={(e) => validateRFC(e.target.value)}
						className={`${inputClass} uppercase ${rfcError ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} 
						maxLength={13} 
					/>
					{rfcError && (
						<span className="text-[11px] text-red-500 ml-4 mt-1 font-bold animate-pulse">
						Formato de RFC inválido (13 caracteres)
						</span>
					)}
					</div>
					<div className="relative">
					<input placeholder="Código Postal Fiscal" className={inputClass} maxLength={5} />
					</div>
				</div>
				<p className="text-[11px] text-gray-500 mt-3 ml-2 flex items-start gap-2 italic leading-relaxed">
					<FiInfo className="mt-0.5 flex-shrink-0" />
					Ingresa tu RFC con homoclave y CP para la correcta emisión de facturas y cumplimiento fiscal.
				</p>
				</div>

				{/* SECCIÓN BANCARIA */}
				<div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,96,30,0.1)] hover:border-[#0D601E]/80 mt-6">
				<div className="flex items-center gap-2 mb-4 text-[#0D601E]">
					<FiCreditCard size={20} />
					<h4 className="font-bold uppercase text-xs tracking-tighter">Método de Cobro</h4>
				</div>
				<input 
					placeholder="CLABE Interbancaria (18 dígitos)" 
					className={inputClass} 
					maxLength={18} 
				/>
				<div className="space-y-2 mt-3 ml-2">
					<p className="text-[12px] text-[#1A4D2E] font-medium flex items-center gap-2">
					<FiCheckCircle className="text-[#0D601E]" /> 
					Aquí es donde depositaremos las ganancias de tus tours vendidos.
					</p>
					<p className="text-[12px] text-gray-500 italic flex items-start gap-2 leading-relaxed">
					<FiInfo className="mt-0.5 flex-shrink-0" />
					Nota: Solicitamos tu CLABE ya que es el método más seguro para transferencias interbancarias en México.
					</p>
				</div>
				</div>
					<button onClick={handleFinish} className="w-full bg-[#8B0000] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] transition-transform">
					Finalizar Afiliación
					</button>
				</motion.div>
				)}
              </div>
            </motion.div>
          ) : (
            /* PASO FINAL: ANIMACIÓN DE CARGA */
            <motion.div 
              key="loading" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="relative w-32 h-32 md:w-48 md:h-48 mb-8"
              >
                <Image src={imglogo} alt="Cargando" fill className="object-contain" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
                Procesando solicitud...
              </h3>
              <p className="text-[#769C7B] italic mt-2">Estamos preparando tu nueva aventura como guía.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GuideModal;
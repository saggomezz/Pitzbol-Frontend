"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FiChevronDown, FiChevronLeft, FiFileText, FiX
} from "react-icons/fi";
import imglogo from "./logoPitzbol.png";

const CATEGORIES = ["Arte", "Cultural", "Gastronómico", "Vida Nocturna", "Deportiva", "Aventura", "Arquitectura", "Naturaleza"];

// Mapeo de Ladas por País
const COUNTRY_DATA: { [key: string]: string } = {
  "México": "+52 ", "Estados Unidos": "+1 ", "Canadá": "+1 ",
  "España": "+34 ", "Argentina": "+54 ", "Colombia": "+57 ", "Chile": "+56 ", "Otro": ""
};

const GuideModal = ({ isOpen, onClose, isAlreadyUser = false }: { isOpen: boolean; onClose: () => void; isAlreadyUser?: boolean; }) => {
  const [step, setStep] = useState(isAlreadyUser ? 1 : 0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [nacionalidad, setNacionalidad] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [rfc, setRfc] = useState("");
  const [rfcError, setRfcError] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    nombre: "", apellido: "", telefono: "", correo: "", password: "", propuestaTour: "", codigoPostal: "", clabe: ""
  });

  useEffect(() => {
    if (isOpen) {
      setStep(isAlreadyUser ? 1 : 0);
      setIsFinishing(false);
      setErrorMsg("");
      setFormData({ nombre: "", apellido: "", telefono: "", correo: "", password: "", propuestaTour: "", codigoPostal: "", clabe: "" });
      setConfirmPassword("");
      setSelectedCats([]);
      setNacionalidad("");
      setRfc("");
    }
  }, [isOpen, isAlreadyUser]);

  const capitalize = (str: string) => str.replace(/\b\w/g, (l) => l.toUpperCase());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setErrorMsg(""); // Limpiar error al escribir

    if (name === "nombre" || name === "apellido") {
      setFormData({ ...formData, [name]: capitalize(value.replace(/[0-9]/g, "")) });
    } else if (name === "telefono") {
      setFormData({ ...formData, [name]: value.replace(/[^\d+ ]/g, "") });
    } else if (name === "codigoPostal" || name === "clabe") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCountryChange = (country: string) => {
    setNacionalidad(country);
    setFormData({ ...formData, telefono: COUNTRY_DATA[country] || "" });
  };

  const validateStep = () => {
    if (step === 0) {
      if (formData.nombre.length < 2) return "Escribe un nombre válido";
      if (formData.apellido.length < 2) return "Escribe un apellido válido";
      if (!nacionalidad) return "Selecciona tu nacionalidad";
      if (formData.telefono.length < 8) return "Introduce un teléfono válido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) return "Correo electrónico inválido";
      if (formData.password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
      if (formData.password !== confirmPassword) return "Las contraseñas no coinciden";
    }
    if (step === 1) {
      if (selectedCats.length === 0) return "Selecciona al menos una categoría";
      if (formData.propuestaTour.length < 10) return "Cuéntanos un poco más sobre tu propuesta";
    }
    if (step === 3) {
      if (rfc.length < 12 || rfcError) return "RFC inválido";
      if (formData.codigoPostal.length !== 5) return "Código postal debe ser de 5 dígitos";
      if (formData.clabe.length !== 18) return "La CLABE debe ser de 18 dígitos";
    }
    return "";
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    
    setIsFinishing(true);

    // --- AQUÍ OBTENEMOS EL UID DEL USUARIO ACTUAL ---
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    const uid = userLocal.uid || userLocal.id; // Extraemos el ID único de Firebase

    if (!uid) {
      alert("Error: No se encontró una sesión activa. Por favor intenta iniciar sesión de nuevo.");
      setIsFinishing(false);
      return;
    }

    // Agregamos el uid al payload que va al backend
    const payload = { 
      ...formData, 
      uid, // <--- Enviamos el UID para que el backend actualice el rol
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
        const data = await response.json();

        // Actualizamos el localStorage con el nuevo rol para que el perfil cambie de inmediato
        const updatedUserData = {
          ...userLocal,
          nombre: formData.nombre,
          apellido: formData.apellido,
          rol: "guia", // Cambiamos el rol localmente
          "07_especialidades": selectedCats
        };
        
        localStorage.setItem("pitzbol_user", JSON.stringify(updatedUserData));
        
        // Avisamos al Navbar que el usuario ahora es guía
        window.dispatchEvent(new Event("storage"));

        setTimeout(() => {
          onClose();
          // Mandamos al perfil detallado
          window.location.href = "/perfil"; 
        }, 2500);
      } else {
        setIsFinishing(false);
        alert("Hubo un error al procesar tu afiliación como guía.");
      }
    } catch (error) {
      setIsFinishing(false);
      alert("Error de conexión con el servidor.");
    }
  };

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm";
  const labelClass = "text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-2 block";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-[850px] min-h-[500px] max-h-[90vh] overflow-y-auto rounded-[30px] md:rounded-[50px] shadow-2xl p-8 md:p-12 border border-white/20">
        <AnimatePresence mode="wait">
          {!isFinishing ? (
            <motion.div key="form">
              <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-red-500 transition-all z-10"><FiX size={28} /></button>
              <div className="text-center mb-8">
                <h2 className="text-[32px] md:text-[42px] text-[#8B0000] font-black leading-none uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0 ? "Únete como Guía" : step === 1 ? "¿Qué experiencias ofreces?" : step === 2 ? "Documentación" : "Datos de Pago"}
                </h2>
                <p className="text-[#1A4D2E] text-sm italic mt-1">Paso {step + 1} de 4</p>
              </div>

              <div className="max-w-2xl mx-auto">
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre(s)" className={inputClass} />
                      <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido(s)" className={inputClass} />
                      <div className="relative">
                        <select value={nacionalidad} onChange={(e) => handleCountryChange(e.target.value)} className={inputClass + " appearance-none cursor-pointer pr-10"}>
                          <option value="" disabled>Nacionalidad</option>
                          {Object.keys(COUNTRY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" />
                      </div>
                      <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className={inputClass} />
                    </div>
                    <input name="correo" value={formData.correo} onChange={handleChange} placeholder="Correo electrónico" className={inputClass} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" className={inputClass} />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" className={inputClass} />
                    </div>
                    {errorMsg && <p className="text-red-500 text-[10px] font-bold ml-4 animate-pulse">{errorMsg}</p>}
                    <button onClick={nextStep} className="w-full bg-[#0D601E] text-white py-3 rounded-full mt-4 font-bold tracking-widest text-xs">Siguiente paso</button>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${selectedCats.includes(cat) ? 'bg-[#0D601E] border-[#0D601E] text-white' : 'border-gray-200 text-gray-500'}`}>{cat}</button>
                      ))}
                    </div>
                    <textarea name="propuestaTour" value={formData.propuestaTour} onChange={handleChange} placeholder="Propuesta de tour..." className={inputClass + " rounded-3xl min-h-[100px] py-4 resize-none"} />
                    {errorMsg && <p className="text-red-500 text-[10px] font-bold animate-pulse">{errorMsg}</p>}
                    <button onClick={nextStep} className="w-full bg-[#0D601E] text-white py-3 rounded-full font-bold tracking-widest text-xs">Siguiente: Documentos</button>
                  </div>
                )}

                {step === 2 && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all">
                          <FiFileText className="text-[#769C7B] mb-3" size={32} />
                          <p className="text-sm text-[#1A4D2E] font-black uppercase italic">Frente</p>
                          <input type="file" className="hidden" />
                        </label>
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all">
                          <FiFileText className="text-[#769C7B] mb-3" size={32} />
                          <p className="text-sm text-[#1A4D2E] font-black uppercase italic">Reverso</p>
                          <input type="file" className="hidden" />
                        </label>
                      </div>
                      <button onClick={nextStep} className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold tracking-widest text-xs">Siguiente: Datos fiscales</button>
                   </div>
                )}

                {step === 3 && (
                  <motion.div className="space-y-6">
                    <div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10">
                      <h4 className="font-bold uppercase text-xs text-[#0D601E] mb-4">Información Fiscal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="RFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} onBlur={(e) => {const r= /^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/i; setRfcError(!r.test(e.target.value))}} className={`${inputClass} uppercase ${rfcError ? "border-red-500" : ""}`} maxLength={13} />
                        <input name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} placeholder="Código Postal" className={inputClass} maxLength={5} />
                      </div>
                    </div>
                    <div className="bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10">
                      <h4 className="font-bold uppercase text-xs text-[#0D601E] mb-4">Método de Cobro</h4>
                      <input name="clabe" value={formData.clabe} onChange={handleChange} placeholder="CLABE Interbancaria (18 dígitos)" className={inputClass} maxLength={18} />
                    </div>
                    {errorMsg && <p className="text-red-500 text-[10px] font-bold animate-pulse text-center">{errorMsg}</p>}
                    <button onClick={handleFinish} className="w-full bg-[#8B0000] text-white py-4 rounded-full font-black tracking-widest text-sm shadow-xl">Finalizar afiliación</button>
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
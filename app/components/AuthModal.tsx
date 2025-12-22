"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiChevronDown, FiLock, FiMail, FiX } from "react-icons/fi";

// Lista de países optimizada para el proyecto
const ALL_COUNTRIES = [
  { name: "Alemania", lada: "+49" }, { name: "Argentina", lada: "+54" },
  { name: "Australia", lada: "+61" }, { name: "Brasil", lada: "+55" },
  { name: "Canadá", lada: "+1" }, { name: "Chile", lada: "+56" },
  { name: "Colombia", lada: "+57" }, { name: "Corea del Sur", lada: "+82" },
  { name: "Dinamarca", lada: "+45" }, { name: "España", lada: "+34" },
  { name: "Estados Unidos", lada: "+1" }, { name: "Francia", lada: "+33" },
  { name: "Italia", lada: "+39" }, { name: "Japón", lada: "+81" },
  { name: "México", lada: "+52" }, { name: "Países Bajos", lada: "+31" },
  { name: "Perú", lada: "+51" }, { name: "Portugal", lada: "+351" },
  { name: "Reino Unido", lada: "+44" }, { name: "Uruguay", lada: "+598" },
].sort((a, b) => a.name.localeCompare(b.name));

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [nacionalidad, setNacionalidad] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    const country = ALL_COUNTRIES.find(c => c.name === nacionalidad);
    if (country) {
      setTelefono(country.lada + " ");
    }
  }, [nacionalidad]);

  if (!isOpen) return null;

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm md:text-base";
  const iconColor = "#769C7B";

  return (
    // SE ELIMINÓ 'backdrop-blur-sm' PARA QUITAR EL BLUR DEL FONDO
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <div className="relative bg-white w-full max-w-[500px] md:max-w-[950px] min-h-[550px] md:h-[600px] rounded-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex border border-white/20">
        
        <button onClick={onClose} className="absolute top-4 md:top-6 right-6 md:right-8 z-[210] text-gray-400 hover:text-red-500 transition-all">
          <FiX size={28} />
        </button>

        {/* --- LADO IZQUIERDO: INICIAR SESIÓN --- */}
        <div className="w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col items-center justify-center bg-white">
          <h2 className="text-[32px] md:text-[42px] text-[#8B0000] mb-8 font-black text-center" style={{ fontFamily: 'var(--font-jockey)' }}>
            INICIAR SESIÓN
          </h2>
          
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="relative text-left">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={18} />
              <input type="email" placeholder="Correo electrónico" className={`${inputClass} pl-14`} style={{ fontFamily: 'Inter, sans-serif' }} />
            </div>
            
            <div className="text-left">
              <div className="relative">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={18} />
                <input 
                  type="password" 
                  placeholder="Contraseña:" 
                  className={`${inputClass} pl-14`} 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                />
              </div>
              <div className="text-right mt-2 px-4">
                <button className="text-[11px] md:text-[13px] text-gray-500 hover:text-[#0D601E] transition-colors italic">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button className="w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium mt-4">
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* --- LADO DERECHO: CREAR UNA CUENTA --- */}
        <div className="hidden md:flex w-1/2 h-full p-8 md:p-12 flex-col items-center justify-center bg-white border-l border-gray-100">
          <h2 className="text-[35px] md:text-[42px] text-[#8B0000] mb-6 font-black text-center" style={{ fontFamily: 'var(--font-jockey)' }}>
            CREAR UNA CUENTA
          </h2>
          
          <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-5">
            <input placeholder="Nombre(s)" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
            <input placeholder="Apellido(s)" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
            <div className="relative col-span-1">
              <select 
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value)}
                className={inputClass + " appearance-none cursor-pointer pr-10"} 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <option value="" disabled>Nacionalidad</option>
                {ALL_COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" />
            </div>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <div className="relative text-left">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
              <input placeholder="Correo electrónico:" className={`${inputClass} pl-14`} style={{ fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div className="relative text-left">
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
              <input type="password" placeholder="Contraseña:" className={`${inputClass} pl-14`} style={{ fontFamily: 'Inter, sans-serif' }} />
            </div>
            
            <div className="w-full flex justify-center mt-2">
              <button className="w-3/4 bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] shadow-md text-sm tracking-wide font-medium">
                Registrar
              </button>
            </div>
          </div>
        </div>

        {/* --- PANEL DESLIZANTE --- */}
        <motion.div 
          animate={{ x: isLogin ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-[#B2C7B5] z-[205] flex flex-col items-center justify-center p-8 md:p-12 text-center"
        >
          <h2 className="text-[40px] md:text-[54px] text-[#1A4D2E] leading-none mb-4" style={{ fontFamily: 'var(--font-jockey)' }}>
            BIENVENIDO
          </h2>
          <p className="text-[#1A4D2E] mb-8 font-medium text-sm md:text-base">
            {isLogin ? "¿Ya tienes una cuenta?" : "¿No te has registrado?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="px-8 md:px-12 py-3 border-2 border-[#8B0000] text-[#8B0000] rounded-full font-bold hover:bg-[#8B0000] hover:text-white transition-all tracking-widest text-[11px] md:text-[12px]"
          >
            {isLogin ? "Iniciar sesión" : "Registrarme"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthModal;
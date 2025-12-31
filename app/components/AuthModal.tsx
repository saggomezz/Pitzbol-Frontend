"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiChevronDown, FiLock, FiMail, FiX, FiEye, FiEyeOff } from "react-icons/fi";

// Solo dejamos hasta /api/auth
const BACKEND_URL = "http://localhost:3001/api/auth";

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

  // --- CAMPOS DEL FORMULARIO ---
  // Datos de Registro
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Datos de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const country = ALL_COUNTRIES.find(c => c.name === nacionalidad);
    if (country) {
      setTelefono(country.lada + " ");
    }
  }, [nacionalidad]);

  // --- FUNCIÓN DE REGISTRO---
  const handleRegister = async () => {
    try {
      console.log(" NTENTANDO CONECTAR A:", `${BACKEND_URL}/register`);
      if (!regEmail || !regPassword || !regNombre) {
        alert("Por favor completa los campos obligatorios");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        alert("Las contraseñas no coinciden. Por favor verifica.");
        return;
      }
      if (regPassword.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          nombre: regNombre,      
          apellido: regApellido,   
          telefono,
          nacionalidad
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("¡Registro exitoso! Por favor inicia sesión.");
        setIsLogin(true); // Cambiar visualmente al panel de login
        // Limpiar todos los campos
        setRegEmail(""); 
        setRegPassword(""); 
        setRegConfirmPassword("");
        setRegNombre(""); 
        setRegApellido(""); // Limpiamos apellido también
        
        // Disparar evento personalizado por si el servidor almacena la sesión automáticamente
        window.dispatchEvent(new Event("authStateChanged"));
      } else {
        alert("Error: " + (data.msg || "Error al registrar"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor.");
    }
  };

  // --- FUNCIÓN DE LOGIN ---
  const handleLogin = async () => {
    try {
      // Asegúrate de que BACKEND_URL termina en puerto 3001
      console.log("📡 Enviando login a:", `${BACKEND_URL}/login`);

      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data); 

      if (response.ok) {
        // Guardamos el token y datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("pitzbol_user", JSON.stringify({ email: data.email, uid: data.uid, nombre: data.nombre }));
        
        alert("¡Bienvenido de nuevo! " + data.email);
        
        // Disparar evento personalizado para actualizar el Navbar
        window.dispatchEvent(new Event("authStateChanged"));
        
        // Aquí podrías redirigir al usuario o actualizar un estado global
        onClose(); 
      } else {
        // Manejo de errores más claro
        alert("Error: " + (data.msg || "Ocurrió un error desconocido"));
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión. Revisa que el Backend (puerto 3001) esté encendido.");
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm md:text-base";
  const iconColor = "#769C7B";

  return (
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
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className={`${inputClass} pl-14`} 
                style={{ fontFamily: 'Inter, sans-serif' }}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            
            <div className="text-left">
              <div className="relative">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={18} />
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  placeholder="Contraseña:" 
                  className={`${inputClass} pl-14 pr-14`} 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E] transition-colors"
                >
                  {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2 px-4">
                <Link
                  href="/forgot-password"
                  onClick={onClose}
                  className="text-[11px] md:text-[13px] text-gray-500 hover:text-[#0D601E] transition-colors italic"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium mt-4"
            >
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
            <input 
              placeholder="Nombre(s)" 
              className={inputClass} 
              style={{ fontFamily: 'Inter, sans-serif' }}
              value={regNombre}
              onChange={(e) => setRegNombre(e.target.value)}
            />
            <input 
              placeholder="Apellido(s)" 
              className={inputClass} 
              style={{ fontFamily: 'Inter, sans-serif' }}
              value={regApellido}
              onChange={(e) => setRegApellido(e.target.value)}
            />
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
            <input 
              value={telefono} 
              onChange={(e) => setTelefono(e.target.value)} 
              placeholder="Teléfono" 
              className={inputClass} 
              style={{ fontFamily: 'Inter, sans-serif' }} 
            />
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <div className="relative text-left">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
              <input 
                placeholder="Correo electrónico:" 
                className={`${inputClass} pl-14`} 
                style={{ fontFamily: 'Inter, sans-serif' }}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="relative text-left">
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
              <input 
                type={showRegPassword ? "text" : "password"} 
                placeholder="Contraseña:" 
                className={`${inputClass} pl-14 pr-12`} 
                style={{ fontFamily: 'Inter, sans-serif' }}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E] transition-colors"
              >
                {showRegPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <div className="relative text-left">
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
              <input 
                type={showRegConfirmPassword ? "text" : "password"} 
                placeholder="Confirmar contraseña:" 
                className={`${inputClass} pl-14 pr-12`} 
                style={{ fontFamily: 'Inter, sans-serif' }}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E] transition-colors"
              >
                {showRegConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            
            <div className="w-full flex justify-center mt-2">
              <button 
                onClick={handleRegister}
                className="w-3/4 bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] shadow-md text-sm tracking-wide font-medium"
              >
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
            className="px-8 md:px-12 py-3 border-2 border-[#8B0000] text-[#8B0000] rounded-full  hover:bg-[#8B0000] hover:text-white transition-all  text-[11px] md:text-[14px]"
          >
            {isLogin ? "Iniciar sesión" : "Registrarme"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthModal;
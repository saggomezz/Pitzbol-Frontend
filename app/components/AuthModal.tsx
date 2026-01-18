"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiMail, FiX } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const BACKEND_URL = `${API_BASE}/api/auth`;

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

declare global {
  interface Window {
    onAuthSuccessShowGuide?: () => void;
    onAuthSuccessShowBusiness?: () => void;
  }
}

const ErrorMsg = ({ text }: { text: string }) => (
  <motion.p 
    initial={{ opacity: 0, y: -10 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="text-[10px] text-red-500 font-bold ml-4 mt-1 text-left"
  >
    {text}
  </motion.p>
);

const AuthModal = ({ isOpen, onClose, intendedRole = "turista" }: { isOpen: boolean; onClose: () => void; intendedRole?: "turista" | "guia" | "negocio" }) => {
  const [isLogin, setIsLogin] = useState(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? true : false;
  }
  return false;
});
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
  const [errors, setErrors] = useState<any>({});
  const [generalError, setGeneralError] = useState("");
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [successUserName, setSuccessUserName] = useState("");
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // y datos de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const country = ALL_COUNTRIES.find(c => c.name === nacionalidad);
    if (country) {
      setTelefono(country.lada + " ");
    }
  }, [nacionalidad]);

  const handleRegister = async () => {
    setErrors({}); 
    setGeneralError("");
    let newErrors: any = {};

    if (!regNombre.trim()) newErrors.nombre = true;
    if (!regApellido.trim()) newErrors.apellido = true;
    if (!nacionalidad) newErrors.nacionalidad = true;
    if (telefono.replace(/\s/g, "").length < 10) {
      newErrors.telefono = "Número incompleto";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) newErrors.email = "Correo no válido";

    if (regPassword.length < 6) newErrors.password = "Mínimo 6 caracteres";
    if (regPassword !== regConfirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (!regEmail || !regPassword || !regNombre) {
        alert("Por favor completa los campos obligatorios");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }
      // Paso 1: Registrar en el backend directamente
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          nombre: regNombre,
          apellido: regApellido,
          telefono: telefono.replace(/\s/g, ""),
          nacionalidad: nacionalidad,
          role: intendedRole,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert("Error: " + (data?.msg || "Error al registrar"));
        return;
      }

      // Paso 2: Iniciar sesión automáticamente para obtener el perfil/token
      const loginRes = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const loginData = await loginRes.json().catch(() => ({}));

      if (!loginRes.ok) {
        alert("Registro completado, pero fallo al iniciar sesión.");
        onClose();
        return;
      }

      // El backend ya normaliza todos los campos
      const userRole = loginData.user?.role || "turista";
      const especialidadesData = loginData.user?.especialidades || [];

      if (loginData.token) {
        localStorage.setItem("pitzbol_token", loginData.token);
      }

      localStorage.setItem("pitzbol_user", JSON.stringify({ 
        email: loginData.user?.email || regEmail, 
        uid: loginData.user?.uid,
        nombre: loginData.user?.nombre || regNombre,
        apellido: loginData.user?.apellido || regApellido,
        fotoPerfil: loginData.user?.fotoPerfil || null,
        telefono: loginData.user?.telefono || telefono || "No registrado",
        nacionalidad: loginData.user?.nacionalidad || nacionalidad || "No registrado",
        especialidades: especialidadesData,
        role: userRole,
        guide_status: loginData.user?.guide_status || "ninguno",
      }));

      window.dispatchEvent(new Event("storage"));

      // Redirección según rol deseado
      if (intendedRole === "guia") {
        alert("Cuenta creada. Ahora completa tu información para ser guía.");
        onClose();
        window.onAuthSuccessShowGuide?.();
      } else if (intendedRole === "negocio") {
        alert("Cuenta creada. Ahora completa tu información de negocio.");
        onClose();
        window.onAuthSuccessShowBusiness?.();
      } else {
        alert("¡Registro exitoso! Bienvenido a Pitzbol.");
        onClose();
        window.location.href = "/perfil";
      }
    } catch (error: any) {
      console.error("Register error:", error);
      alert("Error de conexión con el servidor.");
    }
  };
  
  const handleLogin = async () => {
    try {
      // Autenticar directamente contra el backend
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // El backend ya normaliza todos los campos, usar directamente
        const userRole = data.user.role || "turista";
        const especialidadesData = data.user.especialidades || [];

        const nombre = data.user.nombre || "Usuario";
        const apellido = data.user.apellido || "";
        const telefono = data.user.telefono || "No registrado";
        const nacionalidad = data.user.nacionalidad || "No registrado";

        if (data.token) {
          localStorage.setItem("pitzbol_token", data.token);
        }
        localStorage.setItem("pitzbol_user", JSON.stringify({ 
          email: data.user.email, 
          uid: data.user.uid, 
          nombre,
          apellido,
          fotoPerfil: data.user.fotoPerfil || null,
          telefono,
          nacionalidad,
          especialidades: especialidadesData,
          role: userRole,
          guide_status: data.user.guide_status || "ninguno"
        }));
        
        // Flag para mostrar notificación de bienvenida en la página principal
        sessionStorage.setItem("justLoggedIn", "true");
        
        // Mostrar notificación de éxito en el modal
        setSuccessUserName(data.user.nombre);
        setShowLoginSuccess(true);
      
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("authStateChanged"));
        
        // Redirigir después de mostrar la notificación (2 segundos)
        setTimeout(() => {
          onClose();
          const userRole = data.user.role || data.user.rol || data.user["03_rol"] || "";
          const normalizedRole = userRole.toLowerCase();
                  
          // Redirección
          if (userRole === "admin" || userRole === "admins") {
            window.location.href = "/admin"; 
          } else {
            window.location.href = "/"; 
          }
        }, 2000);

      } else {
        alert("Error: " + (data.msg || "Credenciales inválidas"));
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Mensajes de error más específicos para Firebase Auth
      if (error.code === 'auth/user-not-found') {
        alert("No existe una cuenta con ese correo electrónico.");
      } else if (error.code === 'auth/wrong-password') {
        alert("Contraseña incorrecta.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Formato de correo inválido.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Demasiados intentos. Por favor intenta más tarde.");
      } else {
        alert("Error de conexión. Revisa que el servidor esté encendido.");
      }
    }
  };

if (!isOpen) return null;

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm md:text-base";
  const iconColor = "#769C7B";

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-[500px] md:max-w-[950px] rounded-t-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/20"
        style={{
          height: showLoginSuccess 
            ? typeof window !== 'undefined' && window.innerWidth < 768 
              ? "400px"
              : "280px"
            : typeof window !== 'undefined' && window.innerWidth < 768 
              ? (isLogin ? "75vh" : "85vh") 
              : "600px"
        }}
      >
        {showLoginSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-gradient-to-br from-[#0D601E] to-[#0a4620] flex flex-col items-center justify-center z-50 rounded-t-[30px] md:rounded-[50px] text-center px-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-16 h-16 md:w-18 md:h-18 bg-green-400 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-black/20"
            >
              <svg className="w-9 h-9 text-[#0D601E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-black text-white mb-2"
              style={{ fontFamily: 'var(--font-jockey)' }}
            >
              ¡Bienvenido de nuevo!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-green-100 text-lg md:text-xl font-semibold"
            >
              {successUserName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-green-200 text-sm md:text-base mt-4"
            >
              Redirigiendo...
            </motion.p>
          </motion.div>
        ) : (
          <>
        {/* Barra de arrastre visual solo móvil */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 md:hidden mb-2" />

        <button 
          onClick={onClose} 
          className="absolute top-4 md:top-6 right-6 md:right-8 z-[210] text-gray-400 hover:text-red-500 transition-all"
        >
          <FiX size={28} />
        </button>
        {/* --- LADO IZQUIERDO: INICIAR SESIÓN --- */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          className={`w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${!isLogin && typeof window !== 'undefined' && window.innerWidth < 768 ? 'hidden opacity-0' : 'flex opacity-100'}`}
        >
          <h2 className="text-[32px] md:text-[42px] text-[#8B0000] mb-8 font-black text-center" style={{ fontFamily: 'var(--font-jockey)' }}>
            INICIAR SESIÓN
          </h2>
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="relative text-left">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={18} />
              <input type="email" placeholder="Correo electrónico" className={`${inputClass} pl-14`} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
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
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E]">
                  {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2 px-4">
                <Link href="/forgot-password" onClick={onClose} className="text-[11px] md:text-[13px] text-gray-500 hover:text-[#0D601E] transition-colors italic">¿Olvidaste tu contraseña?</Link>
              </div>
            </div>
            <button type="submit" className="w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium mt-4">Iniciar sesión</button>
            
            {/* Alternar a Registro en móvil*/}
            <div className="md:hidden mt-8 ">
               <p className="text-gray-500 text-xs">¿No te has registrado? <button type="button" onClick={() => setIsLogin(false)} className="text-[#8B0000] font-bold underline italic">Crear cuenta</button></p>
            </div>
          </div>
        </form>

        {/* --- LADO DERECHO: CREAR CUENTA --- */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
          className={`w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col items-center justify-center bg-white border-l border-gray-100 overflow-y-auto transition-opacity duration-300 ${isLogin && typeof window !== 'undefined' && window.innerWidth < 768 ? 'hidden opacity-0' : 'flex opacity-100'}`}
        >
          <h2 className="text-[32px] md:text-[42px] text-[#8B0000] mb-6 font-black text-center uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>CREAR UNA CUENTA</h2>
          <div className="w-full max-w-sm flex flex-col gap-y-5">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nombre(s)" className={inputClass} value={regNombre} onChange={(e) => setRegNombre(capitalize(e.target.value))} />
              <input placeholder="Apellido(s)" className={inputClass} value={regApellido} onChange={(e) => setRegApellido(capitalize(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
                <option value="" disabled>Nacionalidad</option>
                {ALL_COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inputClass} />
            </div>
            <input placeholder="Correo electrónico" className={inputClass} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            {/* Fila 4: Contraseña */}
            <div className="relative">
              <div className="relative text-left">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
                <input 
                  type={showRegPassword ? "text" : "password"} 
                  placeholder="Contraseña:" 
                  className={`${inputClass} pl-14 pr-12 ${errors.password ? 'border-red-500 bg-red-50' : ''}`} 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  tabIndex={-1} 
                  onClick={() => setShowRegPassword(!showRegPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E]"
                >
                  {showRegPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <div className="absolute -bottom-4 left-0 w-full">
                {errors.password && <ErrorMsg text={errors.password} />}
              </div>
            </div>

            {/* Fila 5: Confirmar Contraseña */}
            <div className="relative">
              <div className="relative text-left">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2" color={iconColor} size={16} />
                <input 
                  type={showRegConfirmPassword ? "text" : "password"} 
                  placeholder="Confirmar contraseña:" 
                  className={`${inputClass} pl-14 pr-12 ${errors.confirmPassword ? 'border-red-500 bg-red-50' : ''}`} 
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  tabIndex={-1} 
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D601E]"
                >
                  {showRegConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <div className="absolute -bottom-4 left-0 w-full">
                {errors.confirmPassword && <ErrorMsg text={errors.confirmPassword} />}
              </div>
            </div>
            <button type="submit" className="w-full bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] shadow-md text-sm tracking-wide font-medium">Registrar</button>
            
            {/* Alternar a Login en móvil */}
            <div className="md:hidden text-center mt-4 pb-4">
               <p className="text-gray-500 text-xs">¿Ya tienes cuenta? <button type="button" onClick={() => setIsLogin(true)} className="text-[#8B0000] font-bold underline italic">iniciar sesión</button></p>
            </div>
          </div>
        </form>

        {/* PANEL VERDE DESLIZABLE (Solo Desktop) */}
        <motion.div 
          animate={{ x: isLogin ? 0 : "100%" }} 
          transition={{ type: "spring", stiffness: 300, damping: 30 }} 
          className="hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-[#B2C7B5] z-[205] flex flex-col items-center justify-center p-8 md:p-12 text-center pointer-events-none"
        >
          <div className="pointer-events-auto">
            <h2 className="text-[40px] md:text-[54px] text-[#1A4D2E] leading-none mb-4" style={{ fontFamily: 'var(--font-jockey)' }}>BIENVENIDO</h2>
            <p className="text-[#1A4D2E] mb-8 font-medium text-sm md:text-base">{isLogin ? "¿Ya tienes una cuenta?" : "¿No te has registrado?"}</p>
            <button onClick={() => setIsLogin(!isLogin)} className="px-8 md:px-12 py-3 border-2 border-[#8B0000] text-[#8B0000] rounded-full hover:bg-[#8B0000] hover:text-white transition-all text-[11px] md:text-[14px]">
              {isLogin ? "Iniciar sesión" : "Registrarme"}
            </button>
          </div>
        </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthModal;
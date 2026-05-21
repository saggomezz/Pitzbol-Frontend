"use client";
import { getBackendOrigin } from "@/lib/backendUrl";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiEye, FiEyeOff, FiLock, FiMail, FiX } from "react-icons/fi";

const API_BASE = getBackendOrigin();
const BACKEND_URL = `${API_BASE}/api/auth`;

// Todos los países en español usando la API nativa Intl.DisplayNames
// (soportada en Node.js ≥ 13 y todos los navegadores modernos, sin dependencias)
const ALL_COUNTRIES = (() => {
  try {
    const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
    const codes = [
      'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB',
      'BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH',
      'CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','HR','CU','CY','CZ',
      'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR',
      'GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','VA','HN','HU',
      'IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP',
      'KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY',
      'MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM',
      'NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA',
      'PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM',
      'ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK',
      'SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR',
      'TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW',
    ];
    return codes
      .map(c => regionNames.of(c) || '')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));
  } catch {
    return ['México','Argentina','Colombia','España','Estados Unidos','Francia','Italia'];
  }
})();

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

const AuthModal = ({ isOpen, onClose, intendedRole = "turista", redirectTo, defaultLogin = false }: { isOpen: boolean; onClose: () => void; intendedRole?: "turista" | "guia" | "negocio"; redirectTo?: string; defaultLogin?: boolean }) => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  
  const [isLogin, setIsLogin] = useState(() => {
  if (defaultLogin) {
    return true;
  }
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? true : false;
  }
  return false;
});
  // Datos de Registro
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [generalError, setGeneralError] = useState("");
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Verificación de email
  const [showVerification, setShowVerification] = useState(false);
  const [verifyDigits, setVerifyDigits] = useState(["", "", "", "", "", ""]);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const verifyInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // y datos de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLogin(defaultLogin || (typeof window !== 'undefined' && window.innerWidth < 768));
  }, [defaultLogin, isOpen]);

  const isStrongPassword = (value: string) =>
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  const getPasswordCriteria = (value: string) => [
    { label: "10+ caracteres", met: value.length >= 10 },
    { label: "Mayúscula (A-Z)", met: /[A-Z]/.test(value) },
    { label: "Minúscula (a-z)", met: /[a-z]/.test(value) },
    { label: "Número (0-9)", met: /[0-9]/.test(value) },
    { label: "Símbolo (!@#$...)", met: /[^A-Za-z0-9]/.test(value) },
  ];


  const handleRegister = async () => {
    setErrors({});
    setGeneralError("");
    const newErrors: any = {};
    if (!regNombre.trim()) newErrors.nombre = true;
    if (!regApellido.trim()) newErrors.apellido = true;
    if (!nacionalidad) newErrors.nacionalidad = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) newErrors.email = t('invalidEmail');
    if (!isStrongPassword(regPassword)) newErrors.password = 'Usa una contraseña fuerte: 10+ caracteres, mayúscula, minúscula, número y símbolo.';
    if (regPassword !== regConfirmPassword) newErrors.confirmPassword = t('passwordsNotMatch');
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    // Enviar código y mostrar paso de verificación
    setSendingCode(true);
    try {
      const res = await fetch(`${BACKEND_URL}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, nombre: regNombre }),
      });
      if (res.ok) {
        setShowVerification(true);
        setVerifyDigits(["", "", "", "", "", ""]);
        setVerifyError("");
        setWrongAttempts(0);
        setTimeout(() => verifyInputsRef.current[0]?.focus(), 100);
      } else if (res.status === 404) {
        // Endpoint aún no disponible en el servidor — registrar directamente
        await doActualRegister();
      } else {
        const data = await res.json().catch(() => ({}));
        setGeneralError(data.msg || "No se pudo enviar el código. Intenta de nuevo.");
      }
    } catch {
      // Si falla la conexión al endpoint de código, registrar directamente
      await doActualRegister();
    } finally {
      setSendingCode(false);
    }
  };

  const handleSendCode = async () => {
    setSendingCode(true);
    setVerifyError("");
    try {
      const res = await fetch(`${BACKEND_URL}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, nombre: regNombre }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVerifyError(data.msg || "No se pudo enviar el código. Intenta de nuevo.");
      }
    } catch {
      setVerifyError("Error de conexión al enviar el código.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verifyDigits.join("");
    if (code.length < 6) { setVerifyError("Ingresa los 6 dígitos del código."); return; }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`${BACKEND_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // Código correcto → proceder con el registro real
        await doActualRegister();
      } else {
        const newAttempts = wrongAttempts + 1;
        setWrongAttempts(newAttempts);
        if (newAttempts >= 2) {
          setVerifyError("Código incorrecto. Te enviamos uno nuevo automáticamente.");
          setVerifyDigits(["", "", "", "", "", ""]);
          setWrongAttempts(0);
          await handleSendCode();
        } else {
          setVerifyError("Código incorrecto. Inténtalo de nuevo.");
        }
      }
    } catch {
      setVerifyError("Error al verificar. Intenta de nuevo.");
    } finally {
      setVerifying(false);
    }
  };

  const doActualRegister = async () => {
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
      const interesesData = loginData.user?.["07_intereses"] || loginData.user?.especialidades || loginData.user?.["07_especialidades"] || [];

      if (loginData.token) {
        localStorage.setItem("pitzbol_token", loginData.token);
      }

      localStorage.setItem("pitzbol_user", JSON.stringify({
        email: loginData.user?.email || regEmail,
        uid: loginData.user?.uid,
        nombre: loginData.user?.nombre || regNombre,
        "01_nombre": loginData.user?.["01_nombre"] || loginData.user?.nombre || regNombre,
        apellido: loginData.user?.apellido || regApellido,
        "02_apellido": loginData.user?.["02_apellido"] || loginData.user?.apellido || regApellido,
        fotoPerfil: loginData.user?.fotoPerfil || loginData.user?.["14_foto_perfil"]?.url || null,
        "14_foto_perfil": loginData.user?.["14_foto_perfil"] || null,
        telefono: loginData.user?.telefono || "",
        "06_telefono": loginData.user?.["06_telefono"] || loginData.user?.telefono || "",
        nacionalidad: loginData.user?.nacionalidad || nacionalidad || "",
        "05_nacionalidad": loginData.user?.["05_nacionalidad"] || loginData.user?.nacionalidad || nacionalidad || "",
        descripcion: loginData.user?.descripcion || "",
        "15_descripcion": loginData.user?.["15_descripcion"] || loginData.user?.descripcion || "",
        "07_intereses": interesesData,
        "07_especialidades": loginData.user?.["07_especialidades"] || [],
        especialidades: loginData.user?.especialidades || interesesData,
        role: userRole,
        guide_status: loginData.user?.guide_status || "ninguno",
        tarifa: loginData.user?.tarifa || 0,
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
        sessionStorage.setItem("justRegistered", "true");
        onClose();
        window.location.href = redirectTo || "/";
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

      let data;
      const contentType = response.headers.get("content-type");
      
      try {
        // Verificar si la respuesta tiene contenido JSON
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          if (text.trim()) {
            data = JSON.parse(text);
          } else {
            data = {};
          }
        } else {
          // Si no es JSON, leer como texto
          const text = await response.text();
          data = { message: text || "Sin respuesta del servidor" };
        }
      } catch (parseError) {
        console.error("❌ Error al parsear respuesta:", parseError);
        alert("El servidor no está respondiendo correctamente. Por favor, verifica que el servidor esté corriendo.");
        return;
      }
      
      console.log('📝 Response status:', response.status);
      console.log('📝 Response data:', data);

      if (response.ok) {
        // El backend ya normaliza todos los campos, usar directamente
        const userRole = data.user.role || "turista";
        const interesesData = data.user["07_intereses"] || data.user.especialidades || data.user["07_especialidades"] || [];

        const nombre = data.user.nombre || data.user["01_nombre"] || "Usuario";
        const apellido = data.user.apellido || data.user["02_apellido"] || "";
        const telefono = data.user.telefono || "No registrado";
        const nacionalidad = data.user.nacionalidad || "No registrado";

        if (data.token) {
          localStorage.setItem("pitzbol_token", data.token);
        }
        localStorage.setItem("pitzbol_user", JSON.stringify({
          email: data.user.email,
          uid: data.user.uid,
          nombre,
          "01_nombre": data.user["01_nombre"] || nombre,
          apellido,
          "02_apellido": data.user["02_apellido"] || apellido,
          fotoPerfil: data.user.fotoPerfil || data.user?.["14_foto_perfil"]?.url || null,
          "14_foto_perfil": data.user["14_foto_perfil"] || null,
          telefono,
          "06_telefono": data.user["06_telefono"] || telefono,
          nacionalidad,
          "05_nacionalidad": data.user["05_nacionalidad"] || nacionalidad,
          descripcion: data.user.descripcion || "",
          "15_descripcion": data.user["15_descripcion"] || data.user.descripcion || "",
          "07_intereses": interesesData,
          "07_especialidades": data.user["07_especialidades"] || [],
          especialidades: data.user.especialidades || interesesData,
          role: userRole,
          guide_status: data.user.guide_status || "ninguno",
          tarifa: data.user.tarifa || 0,
        }));
        
        // Flag para mostrar notificación de bienvenida en la página principal
        sessionStorage.setItem("justLoggedIn", "true");

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("authStateChanged"));

        onClose();

        if (userRole === "admin" || userRole === "admins") {
          window.location.href = "/admin";
        } else {
          window.location.href = redirectTo || "/";
        }

      } else {
        // Mostrar mensaje de error específico del servidor
        console.error("❌ Error de login:", data);
        console.error("❌ Status code:", response.status);
        console.error("❌ Response headers:", Object.fromEntries(response.headers.entries()));
        
        // Intentar diferentes campos del error
        let errorMsg = data?.msg || data?.message || data?.error;
        
        // Si no hay mensaje del servidor, usar uno basado en el status code
        if (!errorMsg) {
          switch (response.status) {
            case 401:
              errorMsg = "Credenciales inválidas. Verifica tu correo y contraseña.";
              break;
            case 404:
              errorMsg = "Usuario no encontrado. Verifica tu correo electrónico.";
              break;
            case 500:
              errorMsg = "Error en el servidor. Por favor, intenta más tarde.";
              break;
            default:
              errorMsg = `Error al iniciar sesión (código ${response.status}). Por favor, intenta de nuevo.`;
          }
        }
        
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Login error completo:", error);
      alert("Error de conexión con el servidor. Por favor, intenta de nuevo.");
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
          height: typeof window !== 'undefined' && window.innerWidth < 768
            ? (isLogin ? "75vh" : "85vh")
            : "600px"
        }}
      >
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
            {t('loginTitle').toUpperCase()}
          </h2>
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="relative text-left">
              <FiMail color={iconColor} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
              <input type="email" placeholder={t('email')} className={`${inputClass} pl-14`} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="text-left">
              <div className="relative">
                <FiLock color={iconColor} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  placeholder={t('password')} 
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
                <Link href="/forgot-password" onClick={onClose} className="text-[11px] md:text-[13px] text-gray-500 hover:text-[#0D601E] transition-colors italic">{t('forgotPassword')}</Link>
              </div>
            </div>
            <button type="submit" className="w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium mt-4">{t('login')}</button>
            
            {/* Alternar a Registro en móvil*/}
            <div className="md:hidden mt-8 ">
               <p className="text-gray-500 text-xs">{t('noAccount')} <button type="button" onClick={() => setIsLogin(false)} className="text-[#8B0000] font-bold underline italic">{t('createAccount')}</button></p>
            </div>
          </div>
        </form>

        {/* --- LADO DERECHO: CREAR CUENTA --- */}
        <form
          onSubmit={(e) => { e.preventDefault(); showVerification ? handleVerifyCode() : handleRegister(); }}
          className={`w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col items-center justify-center bg-white border-l border-gray-100 overflow-y-auto transition-opacity duration-300 ${isLogin && typeof window !== 'undefined' && window.innerWidth < 768 ? 'hidden opacity-0' : 'flex opacity-100'}`}
        >
          <h2 className="text-[32px] md:text-[42px] text-[#8B0000] mb-6 font-black text-center uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
            {showVerification ? "Verifica tu correo" : t('registerTitle').toUpperCase()}
          </h2>

          {/* ── PASO DE VERIFICACIÓN ─────────────────────────────────── */}
          {showVerification ? (
            <div className="w-full max-w-sm flex flex-col items-center gap-y-5">
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                Enviamos un código de 6 dígitos a<br />
                <span className="font-bold text-[#1A4D2E]">{regEmail.replace(/(.{2}).*@/, '$1***@')}</span>
              </p>
              {/* 6 cajas de dígitos */}
              <div className="flex gap-2 justify-center">
                {verifyDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { verifyInputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/, "");
                      const next = [...verifyDigits];
                      next[i] = val;
                      setVerifyDigits(next);
                      if (val && i < 5) verifyInputsRef.current[i + 1]?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !verifyDigits[i] && i > 0) {
                        verifyInputsRef.current[i - 1]?.focus();
                      }
                    }}
                    className="w-11 h-14 text-center text-2xl font-black border-2 rounded-xl focus:outline-none focus:border-[#1A4D2E] border-gray-200 bg-[#F7F9F4] text-[#1A4D2E]"
                  />
                ))}
              </div>
              {verifyError && (
                <p className="text-xs text-red-500 text-center">{verifyError}</p>
              )}
              <button
                type="submit"
                disabled={verifying || verifyDigits.join("").length < 6}
                className="w-full bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] shadow-md text-sm tracking-wide font-medium disabled:opacity-50"
              >
                {verifying ? "Verificando..." : "Siguiente"}
              </button>
              <button
                type="button"
                onClick={() => { setShowVerification(false); setVerifyDigits(["","","","","",""]); setVerifyError(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Volver y editar datos
              </button>
              <button
                type="button"
                onClick={async () => { setVerifyDigits(["","","","","",""]); setVerifyError(""); await handleSendCode(); setVerifyError("Nuevo código enviado."); }}
                disabled={sendingCode}
                className="text-xs text-[#1A4D2E] underline disabled:opacity-50"
              >
                {sendingCode ? "Enviando..." : "Reenviar código"}
              </button>
            </div>
          ) : (
          /* ── FORMULARIO DE REGISTRO ─────────────────────────────────── */
          <div className="w-full max-w-sm flex flex-col gap-y-5">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('name')} className={inputClass} value={regNombre} onChange={(e) => setRegNombre(capitalize(e.target.value))} />
              <input placeholder={t('lastName')} className={inputClass} value={regApellido} onChange={(e) => setRegApellido(capitalize(e.target.value))} />
            </div>
            <div className="relative">
              <select
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="" disabled>{t('nationality')}</option>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FiChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <div className="relative">
              <FiMail color={iconColor} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
              <input placeholder={t('email')} className={`${inputClass} pl-14`} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            {/* Fila 4: Contraseña */}
            <div className="relative">
              <div className="relative text-left">
                <FiLock color={iconColor} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
                <input 
                  type={showRegPassword ? "text" : "password"} 
                  placeholder={t('password')} 
                  className={`${inputClass} pl-14 pr-12 ${errors.password ? 'border-red-500 bg-red-50' : ''}`} 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
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
            {/* Indicador de fortaleza en tiempo real */}
            {regPassword.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 px-1">
                {getPasswordCriteria(regPassword).map(({ label, met }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors ${met ? 'text-[#0D601E]' : 'text-gray-400'}`}>
                    <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${met ? 'bg-[#0D601E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {met ? '✓' : '·'}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            )}
            {regPassword.length === 0 && (
              <p className="-mt-2 text-[11px] text-[#769C7B] px-1">
                Debe tener al menos 10 caracteres, con mayúscula, minúscula, número y símbolo.
              </p>
            )}

            {/* Fila 5: Confirmar Contraseña */}
            <div className="relative">
              <div className="relative text-left">
                <FiLock color={iconColor} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
                <input 
                  type={showRegConfirmPassword ? "text" : "password"} 
                  placeholder={t('confirmPassword')} 
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
            {generalError && (
              <p className="text-xs text-red-500 text-center -mt-2">{generalError}</p>
            )}
            <button
              type="submit"
              disabled={sendingCode}
              className="w-full bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] shadow-md text-sm tracking-wide font-medium disabled:opacity-60"
            >
              {sendingCode ? "Enviando código..." : t('register')}
            </button>
            
            {/* Alternar a Login en móvil */}
            <div className="md:hidden text-center mt-4 pb-4">
               <p className="text-gray-500 text-xs">{t('haveAccount')} <button type="button" onClick={() => setIsLogin(true)} className="text-[#8B0000] font-bold underline italic">{t('signInHere')}</button></p>
            </div>
          </div>
          )} {/* cierra ternario showVerification */}
        </form>

        {/* PANEL VERDE DESLIZABLE (Solo Desktop) */}
        <motion.div 
          animate={{ x: isLogin ? 0 : "100%" }} 
          transition={{ type: "spring", stiffness: 300, damping: 30 }} 
          className="hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-[#B2C7B5] z-[205] flex flex-col items-center justify-center p-8 md:p-12 text-center pointer-events-none"
        >
          <div className="pointer-events-auto">
            <h2 className="text-[40px] md:text-[54px] text-[#1A4D2E] leading-none mb-4" style={{ fontFamily: 'var(--font-jockey)' }}>{tCommon('welcome').toUpperCase()}</h2>
            <p className="text-[#1A4D2E] mb-8 font-medium text-sm md:text-base">{isLogin ? t('haveAccount') : t('noAccount')}</p>
            <button onClick={() => setIsLogin(!isLogin)} className="px-8 md:px-12 py-3 border-2 border-[#8B0000] text-[#8B0000] rounded-full hover:bg-[#8B0000] hover:text-white transition-all text-[11px] md:text-[14px]">
              {isLogin ? t('login') : t('register')}
            </button>
          </div>
        </motion.div>
        </>
      </motion.div>
    </div>
  );
};

export default AuthModal;
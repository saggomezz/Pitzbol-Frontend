"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FaBuilding, FaCamera, FaChurch, FaFutbol, FaLandmark, FaMapMarkedAlt,
  FaMoon, FaMountain, FaMusic, FaPalette, FaShoppingBag, FaStore, FaTree, FaUtensils
} from "react-icons/fa";
import { FiAward, FiCamera, FiCheck, FiEdit2, FiGlobe, FiMail, FiMap, FiPhone,
  FiPlus, FiShield, FiUser, FiX, FiCreditCard
} from "react-icons/fi";
import { notificarAprobacionGuia, notificarRechazoGuia, registrarAccionSolicitud } from "@/lib/notificaciones";

import WalletModal from "@/app/components/WalletModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Función auxiliar para capitalizar texto
const capitalizarPrimera = (texto: string): string => {
  if (!texto || texto.length === 0) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const NACIONALIDADES = [
  "Mexicana", "Argentina", "Brasileña", "Chilena", "Colombiana", "Peruana", "Uruguaya", "Venezolana",
  "Estadounidense", "Canadiense", "Española", "Francesa", "Alemana", "Italiana", "Inglesa", "Portuguesa",
  "Japonesa", "China", "Coreana", "India", "Australiana", "Rusa", "Otra"
];

const LADAS = [
  { code: "+1", country: "USA/Canadá" },
  { code: "+52", country: "México" },
  { code: "+54", country: "Argentina" },
  { code: "+55", country: "Brasil" },
  { code: "+56", country: "Chile" },
  { code: "+57", country: "Colombia" },
  { code: "+51", country: "Perú" },
  { code: "+58", country: "Venezuela" },
  { code: "+598", country: "Uruguay" },
  { code: "+34", country: "España" },
  { code: "+33", country: "Francia" },
  { code: "+49", country: "Alemania" },
  { code: "+39", country: "Italia" },
  { code: "+44", country: "Reino Unido" },
  { code: "+351", country: "Portugal" },
  { code: "+81", country: "Japón" },
  { code: "+86", country: "China" },
  { code: "+82", country: "Corea del Sur" },
  { code: "+91", country: "India" },
  { code: "+61", country: "Australia" },
  { code: "+7", country: "Rusia" },
];

const INTERESES_DISPONIBLES = [
  { nombre: "Arte e Historia", icono: FaPalette, color: "from-purple-500 to-pink-500" },
  { nombre: "Arquitectura", icono: FaBuilding, color: "from-gray-600 to-gray-800" },
  { nombre: "Cultura", icono: FaLandmark, color: "from-blue-500 to-indigo-600" },
  { nombre: "Gastronomía", icono: FaUtensils, color: "from-orange-500 to-red-500" },
  { nombre: "Deporte Fútbol", icono: FaFutbol, color: "from-green-600 to-green-800" },
  { nombre: "Música", icono: FaMusic, color: "from-purple-600 to-pink-600" },
  { nombre: "Naturaleza", icono: FaTree, color: "from-green-500 to-emerald-600" },
  { nombre: "Fotografía", icono: FaCamera, color: "from-cyan-500 to-blue-500" },
  { nombre: "Vida Nocturna", icono: FaMoon, color: "from-indigo-600 to-purple-700" },
  { nombre: "Compras", icono: FaShoppingBag, color: "from-pink-500 to-rose-500" },
  { nombre: "Museos", icono: FaLandmark, color: "from-amber-600 to-yellow-700" },
  { nombre: "Tours Guiados", icono: FaMapMarkedAlt, color: "from-teal-500 to-cyan-600" },
  { nombre: "Aventura", icono: FaMountain, color: "from-orange-600 to-red-600" },
  { nombre: "Religión", icono: FaChurch, color: "from-slate-600 to-gray-700" },
  { nombre: "Mercados Locales", icono: FaStore, color: "from-yellow-600 to-orange-600" }
];

const getInteresData = (nombre: string) => {
  return INTERESES_DISPONIBLES.find(i => i.nombre === nombre) || INTERESES_DISPONIBLES[0];
};

export default function PerfilDetallado() {
  const [perfil, setPerfil] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [showTourModal, setShowTourModal] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Función para refrescar los datos del perfil desde localStorage
  const refrescarEspecialidades = () => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    if (userLocal.especialidades) {
      setEspecialidades(userLocal.especialidades);
      setPerfil((prev: any) => ({
        ...prev,
        especialidades: userLocal.especialidades
      }));
      setEspecialidadesTemp(userLocal.especialidades);
    }
  }; 

  const [editandoNacionalidad, setEditandoNacionalidad] = useState(false);
  const [nacionalidadTemp, setNacionalidadTemp] = useState("");
  const [errorNacionalidad, setErrorNacionalidad] = useState("");
  
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [ladaTemp, setLadaTemp] = useState("+52");
  const [numeroTemp, setNumeroTemp] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionTemp, setDescripcionTemp] = useState("");
  const [errorDescripcion, setErrorDescripcion] = useState("");
  
  const [editandoEspecialidades, setEditandoEspecialidades] = useState(false);
  const [especialidadesTemp, setEspecialidadesTemp] = useState<string[]>([]);
  const [nuevoInteres, setNuevoInteres] = useState("");
  const [errorEspecialidades, setErrorEspecialidades] = useState("");
  
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");
  const [mostrarNotificacionAprobado, setMostrarNotificacionAprobado] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    const cargarDatos = async () => {
      if (!userLocal.uid) {
        setLoading(false);
        return;
      }

      const initialEspecialidades = userLocal.especialidades || userLocal["07_especialidades"] || [];      
      const descripcionInicial = userLocal.descripcion ? capitalizarPrimera(userLocal.descripcion) : "";
      
      setPerfil({
        id: userLocal.uid,
        nombre: userLocal["01_nombre"] || userLocal.nombre || "Usuario",
        apellido: userLocal["02_apellido"] || userLocal.apellido || "",
        rol: userLocal["03_rol"] || userLocal.role || "turista",
        email: userLocal["04_correo"] || userLocal.email || "",
        telefono: userLocal["06_telefono"] || userLocal.telefono, 
        especialidades: userLocal["07_especialidades"] || [],
        nacionalidad: userLocal["05_nacionalidad"] || userLocal.nacionalidad,
        descripcion: userLocal["15_descripcion"] || userLocal.descripcion || "",
        fotoUrl: userLocal["14_foto_perfil"]?.url || userLocal.fotoPerfil || null,
        guide_status: userLocal["16_status"] || userLocal.guide_status || "ninguno",
        tarifa: userLocal["17_tarifa_mxn"] || userLocal.tarifa || 0,
            });

      setEspecialidades(initialEspecialidades);
      setEspecialidadesTemp(initialEspecialidades);
      setDescripcionTemp(descripcionInicial);

      try {
        const tokenHeader = localStorage.getItem("pitzbol_token");
        const estadoResponse = await fetch(`${API_BASE}/api/admin/verificar-estado/${userLocal.uid}`, {
          credentials: 'include',
          headers: tokenHeader ? { 'Authorization': `Bearer ${tokenHeader}` } : undefined,
        });
        
        if (estadoResponse.ok) {
          const estadoData = await estadoResponse.json();
          
          // Actualizar el rol y guide_status si cambió
          if (estadoData.success) {
            const nuevoRol = estadoData.rol;
            const nuevoGuideStatus = estadoData.guide_status;
            
            // Si cambió el rol o el estado, actualizar localStorage
            if (nuevoRol !== userLocal.role || nuevoGuideStatus !== userLocal.guide_status) {
              const updatedUser = {
                ...userLocal,
                role: nuevoRol,
                "03_rol": nuevoRol,
                guide_status: nuevoGuideStatus,
                ...estadoData.userData
              };
              
              localStorage.setItem("pitzbol_user", JSON.stringify(updatedUser));
              window.dispatchEvent(new Event("storage"));
              
              // Actualizar el perfil con los nuevos datos
              setPerfil((prev: any) => ({
                ...prev,
                rol: nuevoRol,
                guide_status: nuevoGuideStatus
              }));

              // Si fue aprobado como guía, mostrar notificación y enviar a storage
              if (nuevoRol === "guia" && nuevoGuideStatus === "aprobado" && userLocal.role !== "guia") {
                notificarAprobacionGuia(userLocal.uid);
                registrarAccionSolicitud("aceptada", userLocal.nombre || userLocal["01_nombre"] || "Usuario", "Solicitud aceptada. El usuario ahora es guía.");
                setMostrarNotificacionAprobado(true);
                setTimeout(() => setMostrarNotificacionAprobado(false), 8000);
              }
            }
          }
        }

        // Cargar foto de perfil desde el endpoint correcto (JWT del backend)
        try {
          const tokenHeader2 = localStorage.getItem("pitzbol_token");
          const fotoResponse = await fetch(`${API_BASE}/api/perfil/foto-perfil`, {
            method: 'GET',
            credentials: 'include',
            headers: tokenHeader2 ? { 'Authorization': `Bearer ${tokenHeader2}` } : undefined,
          });
          if (fotoResponse.ok) {
            const fotoData = await fotoResponse.json();
            if (fotoData.fotoPerfil) {
              setFotoPerfil(fotoData.fotoPerfil);
            }
          }
        } catch (error) {
          console.error('Error al cargar foto de perfil:', error);
        }
      } catch (error) {
        console.error("Error de sincronización con Pitzbol Server:", error);
      }
      setLoading(false);
    };
    cargarDatos();
  }, []);

  // Escuchar cambios en el localStorage (cuando se cierren modales)
  useEffect(() => {
    const handleStorageChange = () => {
      refrescarEspecialidades();
    };

    // Escuchar cambios del localStorage
    window.addEventListener("storage", handleStorageChange);
    
    // También escuchar un evento personalizado para cambios en la misma pestaña
    window.addEventListener("especialidadesActualizadas", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("especialidadesActualizadas", handleStorageChange);
    };
  }, []);

  const guardarTelefono = async () => {
    setErrorTelefono("");
    
    if (!numeroTemp.trim()) {
      setErrorTelefono("Por favor ingresa un número de teléfono");
      return;
    }

    const telefonoRegex = /^[\d\s\-()]+$/;
    if (!telefonoRegex.test(numeroTemp)) {
      setErrorTelefono("El número solo puede contener números, espacios, guiones y paréntesis");
      return;
    }

    const soloDigitos = numeroTemp.replace(/\D/g, "");
    if (soloDigitos.length < 7) {
      setErrorTelefono("El número debe tener al menos 7 dígitos");
      return;
    }

    if (soloDigitos.length > 15) {
      setErrorTelefono("El número no puede tener más de 15 dígitos");
      return;
    }

    setGuardando(true);
    setExito("");

    try {
      const token = localStorage.getItem("pitzbol_token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const telefonoCompleto = `${ladaTemp} ${numeroTemp}`;

      if (!token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          telefono: telefonoCompleto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error al actualizar teléfono");
      }

      const perfilActualizado = { ...perfil, telefono: telefonoCompleto };
      setPerfil(perfilActualizado);
      
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      userLocal.telefono = telefonoCompleto;
      userLocal["06_telefono"] = telefonoCompleto;
      localStorage.setItem("pitzbol_user", JSON.stringify(userLocal));

      setExito("Teléfono actualizado correctamente");
      setEditandoTelefono(false);
      
      setTimeout(() => setExito(""), 3000);

    } catch (err: any) {
      setErrorTelefono(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const cancelarTelefono = () => {
    if (perfil.telefono && perfil.telefono !== "No registrado") {
      const match = perfil.telefono.match(/^(\+\d+)\s*(.+)$/);
      if (match) {
        setLadaTemp(match[1]);
        setNumeroTemp(match[2]);
      } else {
        setLadaTemp("+52");
        setNumeroTemp(perfil.telefono);
      }
    }
    setEditandoTelefono(false);
    setErrorTelefono("");
  };

  const guardarDescripcion = async () => {
    setErrorDescripcion("");
    
    if (descripcionTemp.trim().length > 500) {
      setErrorDescripcion("La descripción no puede exceder 500 caracteres");
      return;
    }

    setGuardando(true);
    setExito("");

    try {
      const token = localStorage.getItem("pitzbol_token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      if (!token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      console.log("📝 Enviando descripción al backend:", { descripcion: descripcionTemp });

      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          descripcion: descripcionTemp,
        }),
      });

      const data = await response.json();

      console.log("📥 Respuesta del servidor:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.msg || `Error del servidor: ${response.statusText}`);
      }

      const perfilActualizado = { ...perfil, descripcion: descripcionTemp };
      setPerfil(perfilActualizado);
      
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      userLocal.descripcion = descripcionTemp;
      localStorage.setItem("pitzbol_user", JSON.stringify(userLocal));

      setExito("Descripción actualizada correctamente");
      setEditandoDescripcion(false);
      
      setTimeout(() => setExito(""), 3000);

    } catch (err: any) {
      console.error("❌ Error al guardar descripción:", err);
      setErrorDescripcion(err.message || "Error al guardar la descripción");
    } finally {
      setGuardando(false);
    }
  };

  const cancelarDescripcion = () => {
    setDescripcionTemp(perfil?.descripcion || "");
    setEditandoDescripcion(false);
    setErrorDescripcion("");
  };

  const agregarEspecialidad = (interes: string) => {
    setErrorEspecialidades("");
    if (especialidadesTemp.includes(interes)) {
      setErrorEspecialidades("Este interés ya está agregado");
      return;
    }
    if (especialidadesTemp.length >= 10) {
      setErrorEspecialidades("Máximo 10 intereses permitidos");
      return;
    }
    setEspecialidadesTemp((prev: string[]) => [...prev, interes]);
  };

  const eliminarEspecialidad = (especialidad: string) => {
    setEspecialidadesTemp((prev: string[]) => prev.filter(e => e !== especialidad));
    setErrorEspecialidades("");
  };

  const guardarEspecialidades = async () => {
    setGuardando(true);
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");

    try {
      const response = await fetch('http://localhost:3001/api/guides/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userLocal.uid,
          categorias: especialidadesTemp 
        })
      });
      
      // TODO: backend debe proteger este endpoint; incluir credenciales y token si existe

      if (response.ok) {
        setEspecialidades([...especialidadesTemp]);
        setEditandoEspecialidades(false);
        const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");

        const updatedUser = {
          ...userLocal,
          "07_especialidades": especialidadesTemp,
          "especialidades": especialidadesTemp  
        };
        
        localStorage.setItem("pitzbol_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
        setExito("Cambios guardados con éxito");
        setTimeout(() => setExito(""), 3000);
      }
    } catch (error) {
      console.error("Error al guardar intereses");
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEspecialidades = () => {
    setEspecialidadesTemp([...especialidades]);
    setNuevoInteres("");
    setEditandoEspecialidades(false);
    setErrorEspecialidades("");
  };

  // El rol ya viene normalizado del backend (turista si está pendiente, guia si está aprobado)
  const esGuia = perfil?.rol === "guia";
  const esAdmin = perfil?.rol === "admin";

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F0E6] to-[#FDFCF9]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-[#0D601E] border-t-transparent rounded-full"
      />
    </div>
  );

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`❌ Archivo demasiado grande. Máximo: 5MB (tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Validar formato
    const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setError('❌ Formato no permitido. Solo: JPEG, PNG, WebP');
      setTimeout(() => setError(""), 5000);
      return;
    }

    const stored = localStorage.getItem("pitzbol_user");
    const userLocal = stored ? JSON.parse(stored) : null;

    // Obtener el token JWT del localStorage (no de Firebase)
    const token = localStorage.getItem("pitzbol_token");
    
    if (!token || !userLocal?.uid) {
      console.error('❌ No hay sesión activa');
      setError('❌ Sesión expirada. Por favor, inicia sesión nuevamente.');
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Crear FormData para enviar como multipart
    const formData = new FormData();
    formData.append('foto', file);

    try {
      console.log('📤 Enviando foto al servidor...');
      const apiBase = API_BASE;
      const jwt = localStorage.getItem('pitzbol_token');
      
      const response = await fetch(`${apiBase}/api/perfil/foto-perfil`, {
        method: 'POST',
        credentials: 'include',
        headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : undefined,
        body: formData
      });

      // Intentar parsear JSON; si falla, leer texto
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text();
        data = { error: text || 'Respuesta no válida del servidor' };
      }

      if (response.ok) {
        console.log('✅ Foto subida exitosamente:', data.fotoPerfil);
        setFotoPerfil(data.fotoPerfil);
        setExito("Foto de perfil actualizada exitosamente");
        
        // Actualizar localStorage
        const updated = { ...userLocal, fotoPerfil: data.fotoPerfil };
        localStorage.setItem("pitzbol_user", JSON.stringify(updated));
        
        // Disparar evento para actualizar Navbar
        console.log("📸 Disparando evento fotoPerfilActualizada desde page.tsx...");
        window.dispatchEvent(new CustomEvent('fotoPerfilActualizada', { 
          detail: { fotoPerfil: data.fotoPerfil, usuario: updated }
        }));

        setTimeout(() => setExito(""), 4000);
      } else {
        const errorMessage = data?.error || 'Error al subir foto de perfil';
        console.error('❌ Error del servidor:', errorMessage);
        setError(`❌ ${errorMessage}`);
        setTimeout(() => setError(""), 5000);
      }
    } catch (err: any) {
      console.error("❌ Error al subir foto:", err);
      setError('❌ Error de conexión al subir foto. Verifica que el servidor esté activo.');
      setTimeout(() => setError(""), 5000);
    }

    // Limpiar input para poder seleccionar la misma imagen nuevamente
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FDFCF9] to-white pb-20">
      {/* Notificación de Éxito */}
      <AnimatePresence>
        {exito && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: -20 }}
            className="fixed top-6 left-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-[20px] shadow-xl p-4 border-l-4 border-green-300 flex items-center gap-3">
              <div className="text-xl">✅</div>
              <p className="text-sm font-semibold">{exito}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación de Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: -20 }}
            className="fixed top-6 left-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-[20px] shadow-xl p-4 border-l-4 border-red-300 flex items-center gap-3">
              <div className="text-xl">❌</div>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {esAdmin && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 p-6 bg-gradient-to-r from-[#1A4D2E] to-[#0D601E] rounded-[28px] shadow-lg border-l-8 border-[#F00808] flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-white">
              <FiShield size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg leading-tight">Panel de Control</h4>
              <p className="text-white/60 text-xs">Tienes solicitudes pendientes de revisión</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="px-6 py-2.5 bg-white text-[#1A4D2E] rounded-xl font-bold text-sm hover:bg-[#F6F0E6] transition-all shadow-sm"
          >
            Ver Solicitudes
          </button>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C9D1C] to-[#3A5A40] border-b border-[#4CAF50]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-medium text-white mb-1"
              style={{ fontFamily: "'Jockey One', sans-serif" }}
            >
              Mi Perfil
            </motion.h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card de Perfil Principal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]">
              <div className="flex flex-col items-center">
                {/* Mensaje animado si no hay foto */}
                <AnimatePresence>
                  {!fotoPerfil && (
                    <motion.p 
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ 
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="text-sm text-[#3C590D] text-center font-semibold mb-0.5 max-w-xs"
                    >
                      Sube una foto para completar tu perfil
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Foto de perfil */}
                <div className="relative mb-8 mt-4 group">
                  {/* Botón de cámara - Solo si no hay foto */}
                  {!fotoPerfil && (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-3 bg-[#E53935] text-white rounded-full shadow-md cursor-pointer hover:bg-[#D32F2F] transition-colors z-10"
                      title="Cambiar foto de perfil"
                      type="button"
                    >
                      <FiCamera size={18} strokeWidth={2.5} />
                    </motion.button>
                  )}
                  
                  {/* Área de foto */}
                  <div className="relative w-40 h-40 md:w-48 md:h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0D601E] to-[#F00808] rounded-full opacity-20 blur-xl" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                      {fotoPerfil ? (
                        <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={64} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                  
                  {/* Botón de cámara - Si hay foto */}
                  {fotoPerfil && (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-3 bg-[#E53935] text-white rounded-full shadow-md cursor-pointer hover:bg-[#D32F2F] transition-colors z-10"
                      title="Cambiar foto de perfil"
                      type="button"
                    >
                      <FiCamera size={18} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </div>

                {/* Input file hidden */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFotoChange}
                />

                {/* Mensajes inline para upload */}
                <div className="mt-3 space-y-2">
                  {error && (
                    <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  {exito && (
                    <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      {exito}
                    </div>
                  )}
                </div>

                {/* Info básica */}
                <h2 className="text-2xl md:text-3xl font-semibold text-[#1A4D2E] text-center mb-1">
                  {perfil.nombre} {perfil.apellido}
                </h2>
                
                <div className="flex items-center justify-center gap-1 text-[#81C784] text-xs mb-3">
                  <FiGlobe size={13} />
                  <span className="font-normal">{perfil?.nacionalidad}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[#81C784] text-sm mb-6">
                  <FiMail size={14} />
                  <span className="font-normal text-sm">{perfil.email}</span>
                </div>

                {/* Badge de rol */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F8F6] text-[#0D601E] rounded-full border border-[#0D601E]/10 mb-6">
                  <FiShield size={12} className="opacity-70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {esGuia ? "Guía Verificado" : "Explorador"}
                  </span>
                </div>

                {/* Stats Cards - Solo visibles para Guías y Turistas */}
                {!esAdmin && (
                  <div className="w-full space-y-4 mb-6">
                    {/* Card de Descripción */}
                    <motion.div 
                      whileHover={{ y: -1 }}
                      className="bg-white p-4 rounded-xl border border-[#E0F2F1] relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-[#81C784] tracking-wide">Descripción</h3>
                        {!editandoDescripcion && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setDescripcionTemp(perfil?.descripcion || "");
                              setEditandoDescripcion(true);
                            }}
                            className="px-2.5 py-1 bg-[#3A5A40] text-white rounded-lg text-xs font-medium hover:bg-[#2D4630] transition-colors flex items-center gap-1"
                          >
                            <FiEdit2 size={12} /> Editar
                          </motion.button>
                        )}
                      </div>
                      
                      {editandoDescripcion ? (
                        <div className="space-y-3">
                          <textarea
                            className="w-full bg-[#FDFCF9] border border-[#1A4D2E]/20 rounded-2xl p-4 text-[#1A4D2E] min-h-[150px] focus:ring-2 focus:ring-[#0D601E]/20 outline-none resize-none transition-all"
                            placeholder="Cuéntanos sobre ti..."
                            value={descripcionTemp} 
                            onChange={(e) => setDescripcionTemp(e.target.value)}
                            readOnly={!editandoDescripcion}
                          />
                          <p className="text-xs text-[#81C784]">{descripcionTemp.length}/500</p>
                          {errorDescripcion && (
                            <p className="text-xs text-red-600">{errorDescripcion}</p>
                          )}
                          <div className="flex gap-2">
                            <button onClick={guardarDescripcion} disabled={guardando} className="flex-1 bg-[#3A5A40] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#2D4630] transition-colors disabled:opacity-50">Guardar</button>
                            <button onClick={cancelarDescripcion} disabled={guardando} className="px-4 bg-[#F1F8F6] text-[#81C784] text-xs font-medium py-2 rounded-lg hover:bg-[#E0F2F1] transition-colors disabled:opacity-50">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-normal text-[#1A4D2E] whitespace-pre-wrap">
                          {perfil?.descripcion || "Sin descripción aún. ¡Cuéntanos sobre ti!"}
                        </p>
                      )}
                    </motion.div>

                    {/* Card de Teléfono */}
                    <motion.div 
                      whileHover={{ y: -1 }}
                      className="bg-white p-4 rounded-xl border border-[#E0F2F1] relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#F1F8F6] rounded-lg">
                            <FiPhone size={16} className="text-[#66BB6A]" />
                          </div>
                          <h3 className="text-xs font-medium text-[#81C784] tracking-wide">Teléfono</h3>
                        </div>
                        {!editandoTelefono && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditandoTelefono(true)}
                            className="px-2.5 py-1 bg-[#3A5A40] text-white rounded-lg text-xs font-medium hover:bg-[#2D4630] transition-colors flex items-center gap-1"
                          >
                            <FiEdit2 size={12} /> Editar
                          </motion.button>
                        )}
                      </div>
                      
                      {editandoTelefono ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <select
                              value={ladaTemp}
                              onChange={(e) => setLadaTemp(e.target.value)}
                              className="sm:col-span-1 text-sm font-medium text-[#1A4D2E] bg-white border-2 rounded-lg px-3 py-2 focus:outline-none border-[#C8E6C9]"
                            >
                              {LADAS.map((lada) => (
                                <option key={lada.code} value={lada.code}>{lada.code}</option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={numeroTemp}
                              onChange={(e) => setNumeroTemp(e.target.value)}
                              className="sm:col-span-2 text-sm font-medium text-[#1A4D2E] bg-white border-2 rounded-lg px-3 py-2 focus:outline-none border-[#C8E6C9]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={guardarTelefono} className="flex-1 bg-[#3A5A40] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#2D4630] transition-colors">Guardar</button>
                            <button onClick={cancelarTelefono} className="px-4 bg-[#F1F8F6] text-[#81C784] text-xs font-medium py-2 rounded-lg hover:bg-[#E0F2F1] transition-colors">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#1A4D2E] pl-12 break-all">{perfil?.telefono}</p>
                      )}
                    </motion.div>

                    {/* Card de Billetera */}
                    <button 
                      onClick={() => setShowWalletModal(true)} 
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#0D601E]/20 hover:bg-[#FDFCF9] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#0D601E] group-hover:bg-[#F1F8F6] transition-colors">
                        <FiCreditCard size={20} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-[#1A4D2E]">Métodos de Pago</span>
                        <span className="text-[10px] text-gray-400 font-medium">Gestionar mis tarjetas</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Estadística  */}
                <div className="w-full bg-gradient-to-r from-[#E8F5E9] to-white rounded-xl p-4 border border-[#E0F2F1]">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="text-xl font-semibold text-[#66BB6A]">0</p>
                      <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wide">Tours</p>
                    </div>
                    <div className="w-px h-8 bg-[#E0F2F1]" />
                    <div className="text-center flex-1">
                      <p className="text-xl font-semibold text-[#66BB6A]">0</p>
                      <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wide">Guardados</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Sección de Interesess */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#1A4D2E] mb-1">
                    {esGuia ? "Especialidades" : "Mis Intereses"}
                  </h3>
                  <p className="text-xs text-[#81C784] font-normal">
                    {editandoEspecialidades ? especialidadesTemp.length : especialidades.length} {(editandoEspecialidades ? especialidadesTemp.length : especialidades.length) === 1 ? 'seleccionada' : 'seleccionadas'}
                  </p>
                </div>
                {!editandoEspecialidades && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditandoEspecialidades(true)}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-[#3A5A40] text-white rounded-lg text-sm font-medium hover:bg-[#2D4630] transition-colors"
                  >
                    <FiEdit2 size={14} /> Editar
                  </motion.button>
                )}
              </div>
              
              {editandoEspecialidades ? (
                <div className="space-y-6">
                  {/* Grid de intereses disponibles para seleccionar */}
                  <div>
                    <p className="text-sm font-medium text-[#81C784] mb-4 tracking-wide">Selecciona tus intereses</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {INTERESES_DISPONIBLES.filter(int => !especialidadesTemp.includes(int.nombre)).map((interes, i) => {
                        const Icon = interes.icono;
                        return (
                          <motion.button
                            key={interes.nombre}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => agregarEspecialidad(interes.nombre)}
                            disabled={guardando}
                            className="group relative bg-white rounded-xl p-4 border border-[#E0F2F1] hover:border-[#A5D6A7] hover:bg-[#F1F8F6] transition-all shadow-sm disabled:opacity-50"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interes.color} flex items-center justify-center text-white shadow-lg`}>
                                <Icon size={24} />
                              </div>
                              <span className="text-xs font-medium text-[#1A4D2E] text-center leading-tight">
                                {interes.nombre}
                              </span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#3A5A40] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FiPlus size={13} className="text-white" />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <AnimatePresence>
                    {errorEspecialidades && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200"
                      >
                        <FiX size={18} />
                        <span>{errorEspecialidades}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Intereses seleccionados */}
                  {especialidadesTemp.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[#81C784] mb-4 tracking-wide">
                        Seleccionadas ({especialidadesTemp.length}/10)
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
                        <AnimatePresence>
                          {especialidadesTemp.map((esp, i) => {
                            const interesData = getInteresData(esp);
                            const Icon = interesData.icono;
                            return (
                              <motion.div 
                                key={esp}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ delay: i * 0.03 }}
                                className="group relative bg-gradient-to-br from-[#F1F8F6] to-white rounded-xl p-4 border border-[#A5D6A7] shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interesData.color} flex items-center justify-center text-white shadow-lg`}>
                                    <Icon size={24} />
                                  </div>
                                  <span className="text-xs font-medium text-[#1A4D2E] text-center leading-tight">
                                    {esp}
                                  </span>
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => eliminarEspecialidad(esp)}
                                  disabled={guardando}
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-400 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-md transition-colors disabled:opacity-50"
                                >
                                  <FiX size={14} strokeWidth={3} />
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2.5 pt-4 border-t border-[#E0F2F1]">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={guardarEspecialidades}
                      disabled={guardando}
                      className="flex-1 bg-[#3A5A40] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2D4630] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {guardando ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <FiCheck size={16} />
                          Guardar
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelarEspecialidades}
                      disabled={guardando}
                      className="px-4 bg-[#F1F8F6] text-[#81C784] text-sm font-medium py-2.5 rounded-lg hover:bg-[#E0F2F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {especialidades.map((esp, i) => {
                    const interesData = getInteresData(esp);
                    const Icon = interesData.icono;
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        className="bg-gradient-to-br from-[#F1F8F6] to-white rounded-xl p-5 border border-[#E0F2F1] hover:border-[#A5D6A7] transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${interesData.color} flex items-center justify-center text-white shadow-lg`}>
                            <Icon size={28} />
                          </div>
                          <span className="text-sm font-medium text-[#1A4D2E] text-center leading-tight">
                            {esp}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Sección de los Tours */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-7 border border-[#E0F2F1] overflow-hidden"
            >
              {/* Encabezado de la sección */}
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-semibold text-[#1A4D2E] leading-none">
                    {esGuia ? "Mis Experiencias" : "Próximos Destinos"}
                  </h3>
                  <p className="text-[11px] text-[#81C784] font-normal uppercase tracking-wider mt-1">
                    {esGuia ? "Tours publicados" : "Reservaciones"}
                  </p>
                </div>
                {esGuia && (
                  <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full font-medium">
                    {tours.length} publicados
                  </span>
                )}
              </div>

              {/* Contenido condicional por ROL */}
              {esGuia ? (
                <div className="space-y-4">
                  {/* Botón Minimalista para crear tour */}
                  <motion.button 
                    whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowTourModal(true)} 
                    className="w-full py-4 border-2 border-dashed border-[#E0F2F1] rounded-lg flex items-center justify-center gap-2 text-[#81C784] hover:text-[#66BB6A] hover:border-[#A5D6A7] transition-all group"
                  >
                    <div className="w-7 h-7 bg-[#E8F5E9] group-hover:bg-[#3A5A40] group-hover:text-white rounded-full flex items-center justify-center transition-colors">
                      <FiPlus size={16} />
                    </div>
                    <span className="text-sm font-medium tracking-tight">Crear experiencia</span>
                  </motion.button>

                  {/* Renderizado de tours  */}
                  {tours.length === 0 && (
                    <p className="text-center text-[11px] text-[#81C784] font-normal py-4">
                      Aún no hay experiencias. Crea una para comenzar.
                    </p>
                  )}
                </div>
              ) : (
                /* Vista para Turista */
                <div className="relative group cursor-pointer" onClick={() => window.location.href = '/tours'}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9] to-white rounded-lg -z-10" />
                  <div className="py-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-[#F1F8F6] rounded-xl shadow-sm flex items-center justify-center mb-3 border border-[#E0F2F1]">
                      <FiMap size={24} className="text-[#66BB6A]" />
                    </div>
                    <h4 className="text-base font-semibold text-[#1A4D2E]">Explora tours</h4>
                    <p className="text-xs text-[#81C784] max-w-[200px] mt-1.5 mb-5 font-normal">
                      Encuentra el tour perfecto para ti.
                    </p>
                    <button className="px-5 py-1.5 bg-[#3A5A40] text-white rounded-lg text-xs font-medium tracking-wide shadow-md hover:bg-[#2D4630]">
                      Explorar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Notificación de Aprobación como Guía */}
      <AnimatePresence>
        {mostrarNotificacionAprobado && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 max-w-md"
          >
            <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white rounded-[28px] shadow-2xl p-6 border-4 border-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center"
                  >
                    <FiCheck className="text-[#0D601E]" size={32} strokeWidth={3} />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black mb-2">¡Felicidades! 🎉</h3>
                  <p className="text-white/90 text-sm font-medium leading-relaxed">
                    Tu solicitud ha sido aprobada. Ahora eres un <span className="font-bold">Guía Oficial Pitzbol</span>. 
                    Puedes comenzar a crear experiencias increíbles.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarNotificacionAprobado(false)}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Modal */}
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
}
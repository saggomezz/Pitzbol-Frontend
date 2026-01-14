"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaBuilding, FaCamera, FaChurch, FaFutbol, FaLandmark, FaMapMarkedAlt,
  FaMoon, FaMountain, FaMusic, FaPalette, FaShoppingBag, FaStore, FaTree, FaUtensils
} from "react-icons/fa";
import { FiAward, FiCamera, FiCheck, FiEdit2, FiGlobe, FiMail, FiMap, FiPhone,
  FiPlus, FiShield, FiUser, FiX
} from "react-icons/fi";
import { notificarAprobacionGuia, notificarRechazoGuia } from "@/lib/notificaciones";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
  
  const [editandoEspecialidades, setEditandoEspecialidades] = useState(false);
  const [especialidadesTemp, setEspecialidadesTemp] = useState<string[]>([]);
  const [nuevoInteres, setNuevoInteres] = useState("");
  const [errorEspecialidades, setErrorEspecialidades] = useState("");
  
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");
  const [mostrarNotificacionAprobado, setMostrarNotificacionAprobado] = useState(false);

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    const cargarDatos = async () => {
      if (!userLocal.uid) {
        setLoading(false);
        return;
      }

      const initialEspecialidades = userLocal.especialidades || userLocal["07_especialidades"] || [];      
      setPerfil({
        id: userLocal.uid,
        nombre: userLocal.nombre || userLocal["01_nombre"] || "Usuario",
        apellido: userLocal.apellido || userLocal["02_apellido"] || "",
        email: userLocal.email || userLocal["04_correo"] || "",
        telefono: userLocal.telefono || userLocal["06_telefono"] || "No registrado",
        nacionalidad: userLocal.nacionalidad || "No registrado",
        rol: userLocal.role || userLocal["03_rol"] || "turista",
        guide_status: userLocal.guide_status || "ninguno", 
        especialidades: initialEspecialidades,
        fotoUrl: userLocal.fotoUrl || userLocal["13_foto_rostro"] || null
      });

      setEspecialidades(initialEspecialidades);
      setEspecialidadesTemp(initialEspecialidades);

      try {
        // Primero verificar el estado actualizado del usuario
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

      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: perfil.id,
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
        setExito("✅ Foto de perfil actualizada exitosamente");
        
        // Actualizar localStorage
        const updated = { ...userLocal, fotoPerfil: data.fotoPerfil };
        localStorage.setItem("pitzbol_user", JSON.stringify(updated));

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
      <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black uppercase mb-2" 
              style={{ fontFamily: "'Jockey One', sans-serif" }}
            >
              MI <span className="text-[#F00808]">PERFIL</span>
            </motion.h1>
            <p className="text-[#B2C7B5] text-sm font-semibold uppercase tracking-wider">
              Panel de {perfil.rol} · Pitzbol
            </p>
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
            <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-gray-100">
              <div className="flex flex-col items-center">
                {/* Foto de perfil */}
                <div className="relative mb-8 mt-4 group">
                  {/* Botón de cámara - Solo si no hay foto */}
                  {!fotoPerfil && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-4 bg-[#F00808] text-white rounded-xl shadow-xl cursor-pointer hover:bg-[#d00707] transition-colors z-10"
                      title="Cambiar foto de perfil"
                      type="button"
                    >
                      <FiCamera size={20} />
                    </motion.button>
                  )}
                  
                  {/* Área de foto */}
                  <div className="relative w-40 h-40 md:w-48 md:h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0D601E] to-[#F00808] rounded-[28px] opacity-20 blur-xl" />
                    <div className="relative w-full h-full rounded-[28px] overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
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
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-4 bg-[#F00808] text-white rounded-xl shadow-xl cursor-pointer hover:bg-[#d00707] transition-colors z-10"
                      title="Cambiar foto de perfil"
                      type="button"
                    >
                      <FiCamera size={20} />
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
                <h2 className="text-2xl md:text-3xl font-black text-[#1A4D2E] text-center mb-1">
                  {perfil.nombre} {perfil.apellido}
                </h2>
                
                <div className="flex items-center gap-2 text-[#769C7B] text-sm mb-4">
                  <FiMail size={14} />
                  <span className="font-medium">{perfil.email}</span>
                </div>

                {/* Badge de rol */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <FiAward size={14} />
                  {esGuia ? "Guía Pitzbol" : "Pitzbolero"}
                </div>

                {/* Stats Cards - Solo visibles para Guías y Turistas */}
                {!esAdmin && (
                  <div className="w-full space-y-4 mb-6">
                    {/* Card de Nacionalidad */}
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-gradient-to-br from-[#E8F5E9] to-white p-5 rounded-2xl border border-[#0D601E]/10 relative"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-[#0D601E]/10 rounded-lg">
                          <FiGlobe size={18} className="text-[#0D601E]" />
                        </div>
                        <h3 className="text-sm font-black uppercase text-[#1A4D2E] tracking-wider">Nacionalidad</h3>
                      </div>
                      <p className="text-base font-bold text-[#1A4D2E] pl-12">{perfil?.nacionalidad}</p>
                    </motion.div>

                    {/* Card de Teléfono */}
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-gradient-to-br from-[#FFF3E0] to-white p-5 rounded-2xl border border-[#FF8A00]/10 relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#FF8A00]/10 rounded-lg">
                            <FiPhone size={18} className="text-[#FF8A00]" />
                          </div>
                          <h3 className="text-sm font-black uppercase text-[#1A4D2E] tracking-wider">Teléfono</h3>
                        </div>
                        {!editandoTelefono && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditandoTelefono(true)}
                            className="px-3 py-1.5 bg-[#FF8A00] text-white rounded-lg text-xs font-bold hover:bg-[#e67d00] transition-colors flex items-center gap-1.5"
                          >
                            <FiEdit2 size={14} /> Editar
                          </motion.button>
                        )}
                      </div>
                      
                      {editandoTelefono ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <select
                              value={ladaTemp}
                              onChange={(e) => setLadaTemp(e.target.value)}
                              className="sm:col-span-1 text-sm font-bold text-[#1A4D2E] bg-white border-2 rounded-xl px-4 py-3 focus:outline-none border-[#FF8A00]/20"
                            >
                              {LADAS.map((lada) => (
                                <option key={lada.code} value={lada.code}>{lada.code}</option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={numeroTemp}
                              onChange={(e) => setNumeroTemp(e.target.value)}
                              className="sm:col-span-2 text-sm font-semibold text-[#1A4D2E] bg-white border-2 rounded-xl px-4 py-3 focus:outline-none border-[#FF8A00]/20"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={guardarTelefono} className="flex-1 bg-[#FF8A00] text-white text-xs font-bold py-2 rounded-lg">Guardar</button>
                            <button onClick={cancelarTelefono} className="px-4 bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg">X</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-base font-bold text-[#1A4D2E] pl-12 break-all">{perfil?.telefono}</p>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* Estadística  */}
                <div className="w-full bg-gradient-to-r from-[#0D601E]/5 to-transparent rounded-2xl p-4 border border-[#0D601E]/10">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-[#0D601E]">0</p>
                      <p className="text-[10px] text-[#769C7B] font-bold uppercase">Tours</p>
                    </div>
                    <div className="w-px h-10 bg-[#0D601E]/10" />
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-[#F00808]">0</p>
                      <p className="text-[10px] text-[#769C7B] font-bold uppercase">Favoritos</p>
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
              className="bg-white rounded-[32px] shadow-xl p-8 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1A4D2E] mb-1" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                    {esGuia ? "ESPECIALIDADES" : "MIS INTERESES"}
                  </h3>
                  <p className="text-xs text-[#769C7B] font-semibold">
                    {editandoEspecialidades ? especialidadesTemp.length : especialidades.length} {(editandoEspecialidades ? especialidadesTemp.length : especialidades.length) === 1 ? 'categoría' : 'categorías'}
                  </p>
                </div>
                {!editandoEspecialidades && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditandoEspecialidades(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D601E] text-white rounded-xl text-sm font-bold hover:bg-[#094d18] transition-colors"
                  >
                    <FiEdit2 size={16} /> Editar
                  </motion.button>
                )}
              </div>
              
              {editandoEspecialidades ? (
                <div className="space-y-6">
                  {/* Grid de intereses disponibles para seleccionar */}
                  <div>
                    <p className="text-sm font-bold text-[#769C7B] mb-4 tracking-wide">Selecciona tus intereses</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {INTERESES_DISPONIBLES.filter(int => !especialidadesTemp.includes(int.nombre)).map((interes, i) => {
                        const Icon = interes.icono;
                        return (
                          <motion.button
                            key={interes.nombre}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => agregarEspecialidad(interes.nombre)}
                            disabled={guardando}
                            className="group relative bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-[#0D601E] transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interes.color} flex items-center justify-center text-white shadow-lg`}>
                                <Icon size={24} />
                              </div>
                              <span className="text-xs font-bold text-[#1A4D2E] text-center leading-tight">
                                {interes.nombre}
                              </span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0D601E] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FiPlus size={14} className="text-white" />
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
                      <p className="text-sm font-bold text-[#769C7B] mb-4 tracking-wide">
                        Mis intereses seleccionados ({especialidadesTemp.length}/10)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border-2 border-[#0D601E]/20 shadow-md hover:shadow-xl transition-all"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interesData.color} flex items-center justify-center text-white shadow-lg`}>
                                    <Icon size={24} />
                                  </div>
                                  <span className="text-xs font-bold text-[#1A4D2E] text-center leading-tight">
                                    {esp}
                                  </span>
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => eliminarEspecialidad(esp)}
                                  disabled={guardando}
                                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
                                >
                                  <FiX size={16} strokeWidth={3} />
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={guardarEspecialidades}
                      disabled={guardando}
                      className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white text-base font-black py-4 rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl tracking-wider"
                    >
                      {guardando ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <FiCheck size={24} />
                          Guardar Cambios
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelarEspecialidades}
                      disabled={guardando}
                      className="px-8 bg-gray-200 text-gray-700 text-base font-bold py-4 rounded-2xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
                    >
                      Cancelar
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {especialidades.map((esp, i) => {
                    const interesData = getInteresData(esp);
                    const Icon = interesData.icono;
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, scale: 1.05 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-gray-100 hover:border-[#0D601E]/30 transition-all shadow-md hover:shadow-xl"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${interesData.color} flex items-center justify-center text-white shadow-lg`}>
                            <Icon size={28} />
                          </div>
                          <span className="text-sm font-bold text-[#1A4D2E] text-center leading-tight">
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
              className="bg-white rounded-[32px] shadow-xl p-8 border border-gray-100 overflow-hidden"
            >
              {/* Encabezado de la sección */}
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-[#1A4D2E] leading-none" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                    {esGuia ? "MIS EXPERIENCIAS" : "PRÓXIMOS DESTINOS"}
                  </h3>
                  <p className="text-[11px] text-[#769C7B] font-bold uppercase tracking-wider mt-1">
                    {esGuia ? "Gestión de tours publicados" : "Explora tus reservaciones"}
                  </p>
                </div>
                {esGuia && (
                  <span className="text-[10px] bg-[#F6F0E6] text-[#1A4D2E] px-3 py-1 rounded-full font-bold">
                    {tours.length} Publicados
                  </span>
                )}
              </div>

              {/* Contenido condicional por ROL */}
              {esGuia ? (
                <div className="space-y-4">
                  {/* Botón Minimalista para crear tour */}
                  <motion.button 
                    whileHover={{ scale: 1.01, backgroundColor: "#f9f9f9" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowTourModal(true)} 
                    className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[24px] flex items-center justify-center gap-3 text-gray-400 hover:text-[#0D601E] hover:border-[#0D601E]/30 transition-all group"
                  >
                    <div className="w-8 h-8 bg-gray-100 group-hover:bg-[#0D601E] group-hover:text-white rounded-full flex items-center justify-center transition-colors">
                      <FiPlus size={18} />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Crear nueva experiencia</span>
                  </motion.button>

                  {/* Renderizado de tours  */}
                  {tours.length === 0 && (
                    <p className="text-center text-[11px] text-gray-400 italic py-4">
                      Aún no has publicado experiencias. ¡Comienza creando una!
                    </p>
                  )}
                </div>
              ) : (
                /* Vista para Turista */
                <div className="relative group cursor-pointer" onClick={() => window.location.href = '/tours'}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D601E]/5 to-[#F00808]/5 rounded-[24px] -z-10" />
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-50">
                      <FiMap size={28} className="text-[#0D601E]" />
                    </div>
                    <h4 className="text-lg font-black text-[#1A4D2E]">¿A dónde vamos hoy?</h4>
                    <p className="text-xs text-[#769C7B] max-w-[200px] mt-1 mb-6">
                      Encuentra el tour perfecto para tu visita a Guadalajara.
                    </p>
                    <button className="px-6 py-2 bg-[#1A4D2E] text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg">
                      Explorar ahora
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
    </div>
  );
}
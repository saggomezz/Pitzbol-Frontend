"use client";
import { useEffect, useState } from "react";
import { 
  FiCamera, FiMessageSquare, FiPlus, FiX, FiUser, FiMap, FiPhone, FiGlobe, FiMail, FiTrash2, FiHeart, FiAward, FiEdit2, FiCheck 
} from "react-icons/fi";
import { 
  FaPalette, FaBuilding, FaUtensils, FaFutbol, FaMusic, FaTree, FaCamera, 
  FaMoon, FaShoppingBag, FaLandmark, FaMapMarkedAlt, FaMountain, FaChurch, FaStore 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Lista de nacionalidades (adjetivos gentilicios)
const NACIONALIDADES = [
  "Mexicana", "Argentina", "Brasileña", "Chilena", "Colombiana", "Peruana", "Uruguaya", "Venezolana",
  "Estadounidense", "Canadiense", "Española", "Francesa", "Alemana", "Italiana", "Inglesa", "Portuguesa",
  "Japonesa", "China", "Coreana", "India", "Australiana", "Rusa", "Otra"
];

// Lista de códigos LADA internacionales
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

// Lista de intereses/especialidades disponibles con iconos y colores
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

// Función helper para obtener datos de un interés
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
  
  // Estados para edición de nacionalidad
  const [editandoNacionalidad, setEditandoNacionalidad] = useState(false);
  const [nacionalidadTemp, setNacionalidadTemp] = useState("");
  const [errorNacionalidad, setErrorNacionalidad] = useState("");
  
  // Estados para edición de teléfono
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [ladaTemp, setLadaTemp] = useState("+52");
  const [numeroTemp, setNumeroTemp] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  
  // Estados para edición de especialidades
  const [editandoEspecialidades, setEditandoEspecialidades] = useState(false);
  const [especialidadesTemp, setEspecialidadesTemp] = useState<string[]>([]);
  const [nuevoInteres, setNuevoInteres] = useState("");
  const [errorEspecialidades, setErrorEspecialidades] = useState("");
  
  // Estados para manejo de guardado
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    
    const datosCargados = {
      id: userLocal.uid || userLocal.id || "temp_id",
      nombre: userLocal.nombre || "Usuario",
      apellido: userLocal.apellido || "",
      email: userLocal.email || "",
      telefono: userLocal.telefono || "No registrado",
      nacionalidad: userLocal.nacionalidad || "No registrado",
      rol: userLocal.role || userLocal.rol || "turista",
      especialidades: userLocal.especialidades || userLocal["07_especialidades"] || [],
      fotoUrl: userLocal.fotoUrl || null 
    };

    setPerfil(datosCargados);
    setFotoPerfil(datosCargados.fotoUrl);
    setEspecialidades(datosCargados.especialidades);
    setEspecialidadesTemp(datosCargados.especialidades);
    
    // Inicializar valores para edición
    setNacionalidadTemp(datosCargados.nacionalidad);
    
    // Parsear teléfono para separar LADA y número
    if (datosCargados.telefono && datosCargados.telefono !== "No registrado") {
      const match = datosCargados.telefono.match(/^(\+\d+)\s*(.+)$/);
      if (match) {
        setLadaTemp(match[1]);
        setNumeroTemp(match[2]);
      } else {
        setNumeroTemp(datosCargados.telefono);
      }
    }
    
    setLoading(false);
  }, []);

  // Función para guardar nacionalidad
  const guardarNacionalidad = async () => {
    setErrorNacionalidad("");
    
    if (!nacionalidadTemp || nacionalidadTemp === "No registrado") {
      setErrorNacionalidad("Por favor selecciona una nacionalidad válida");
      return;
    }

    setGuardando(true);
    setExito("");

    try {
      const token = localStorage.getItem("pitzbol_token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: perfil.id,
          nacionalidad: nacionalidadTemp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error al actualizar nacionalidad");
      }

      // Actualizar estado local y localStorage
      const perfilActualizado = { ...perfil, nacionalidad: nacionalidadTemp };
      setPerfil(perfilActualizado);
      
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      userLocal.nacionalidad = nacionalidadTemp;
      localStorage.setItem("pitzbol_user", JSON.stringify(userLocal));

      setExito("Nacionalidad actualizada correctamente");
      setEditandoNacionalidad(false);
      
      setTimeout(() => setExito(""), 3000);

    } catch (err: any) {
      setErrorNacionalidad(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  // Función para guardar teléfono
  const guardarTelefono = async () => {
    setErrorTelefono("");
    
    // Validar que el número no esté vacío
    if (!numeroTemp.trim()) {
      setErrorTelefono("Por favor ingresa un número de teléfono");
      return;
    }

    // Validar que solo contenga números, espacios, guiones y paréntesis
    const telefonoRegex = /^[\d\s\-()]+$/;
    if (!telefonoRegex.test(numeroTemp)) {
      setErrorTelefono("El número solo puede contener números, espacios, guiones y paréntesis");
      return;
    }

    // Validar longitud mínima (al menos 7 dígitos)
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

      // Actualizar estado local y localStorage
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

  // Función para cancelar edición de nacionalidad
  const cancelarNacionalidad = () => {
    setNacionalidadTemp(perfil.nacionalidad);
    setEditandoNacionalidad(false);
    setErrorNacionalidad("");
  };

  // Función para cancelar edición de teléfono
  const cancelarTelefono = () => {
    // Restaurar valores originales
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

  // Función para agregar especialidad
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

    setEspecialidadesTemp([...especialidadesTemp, interes]);
  };

  // Función para eliminar especialidad
  const eliminarEspecialidad = (especialidad: string) => {
    setEspecialidadesTemp(especialidadesTemp.filter(e => e !== especialidad));
    setErrorEspecialidades("");
  };

  // Función para guardar especialidades
  const guardarEspecialidades = async () => {
    setErrorEspecialidades("");
    
    if (especialidadesTemp.length === 0) {
      setErrorEspecialidades("Debes tener al menos un interés");
      return;
    }

    setGuardando(true);
    setExito("");

    try {
      const token = localStorage.getItem("pitzbol_token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: perfil.id,
          especialidades: especialidadesTemp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error al actualizar intereses");
      }

      // Actualizar estado local y localStorage
      setEspecialidades(especialidadesTemp);
      const perfilActualizado = { ...perfil, especialidades: especialidadesTemp };
      setPerfil(perfilActualizado);
      
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      userLocal.especialidades = especialidadesTemp;
      if (userLocal["07_especialidades"]) {
        userLocal["07_especialidades"] = especialidadesTemp;
      }
      localStorage.setItem("pitzbol_user", JSON.stringify(userLocal));

      setExito("Intereses actualizados correctamente");
      setEditandoEspecialidades(false);
      
      setTimeout(() => setExito(""), 3000);

    } catch (err: any) {
      setErrorEspecialidades(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  // Función para cancelar edición de especialidades
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FDFCF9] to-white pb-20">
      
      {/* Mensaje de éxito */}
      <AnimatePresence>
        {exito && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <FiCheck size={24} />
            <span className="font-bold">{exito}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header Moderno */}
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
                {/* Foto de perfil con animación */}
                <div className="relative mb-8 mt-4 group">
                  {!fotoPerfil && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#FF8A00] text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg z-20 whitespace-nowrap"
                    >
                      ¡Sube tu foto!
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FF8A00] rotate-45" />
                    </motion.div>
                  )}
                  
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
                  
                  <motion.label 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 p-4 bg-[#F00808] text-white rounded-xl shadow-xl cursor-pointer hover:bg-[#d00707] transition-colors"
                  >
                    <FiCamera size={20} />
                    <input type="file" className="hidden" accept="image/*" />
                  </motion.label>
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

                {/* Stats Cards */}
                <div className="w-full space-y-4 mb-6">
                  {/* Card de Nacionalidad */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-[#E8F5E9] to-white p-5 rounded-2xl border border-[#0D601E]/10 relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#0D601E]/10 rounded-lg">
                          <FiGlobe size={18} className="text-[#0D601E]" />
                        </div>
                        <h3 className="text-sm font-black uppercase text-[#1A4D2E] tracking-wider">Nacionalidad</h3>
                      </div>
                      {!editandoNacionalidad && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditandoNacionalidad(true)}
                          className="px-3 py-1.5 bg-[#0D601E] text-white rounded-lg text-xs font-bold hover:bg-[#094d18] transition-colors flex items-center gap-1.5"
                          title="Editar nacionalidad"
                        >
                          <FiEdit2 size={14} />
                          Editar
                        </motion.button>
                      )}
                    </div>
                    
                    {editandoNacionalidad ? (
                      <div className="space-y-3">
                        <select
                          value={nacionalidadTemp}
                          onChange={(e) => {
                            setNacionalidadTemp(e.target.value);
                            setErrorNacionalidad("");
                          }}
                          className={`w-full text-sm font-semibold text-[#1A4D2E] bg-white border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            errorNacionalidad 
                              ? "border-red-500 focus:ring-red-500" 
                              : "border-[#0D601E]/20 focus:ring-[#0D601E]"
                          }`}
                          disabled={guardando}
                        >
                          <option value="">Selecciona una nacionalidad...</option>
                          {NACIONALIDADES.map((nac) => (
                            <option key={nac} value={nac}>{nac}</option>
                          ))}
                        </select>
                        
                        <AnimatePresence>
                          {errorNacionalidad && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 text-red-600 text-sm font-semibold"
                            >
                              <FiX size={16} />
                              <span>{errorNacionalidad}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={guardarNacionalidad}
                            disabled={guardando}
                            className="flex-1 bg-[#0D601E] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#094d18] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            {guardando ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              "Guardar"
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={cancelarNacionalidad}
                            disabled={guardando}
                            className="px-6 bg-gray-200 text-gray-700 text-sm font-bold py-3 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancelar
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-bold text-[#1A4D2E] pl-12">{perfil.nacionalidad}</p>
                    )}
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
                          title="Editar teléfono"
                        >
                          <FiEdit2 size={14} />
                          Editar
                        </motion.button>
                      )}
                    </div>
                    
                    {editandoTelefono ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select
                            value={ladaTemp}
                            onChange={(e) => {
                              setLadaTemp(e.target.value);
                              setErrorTelefono("");
                            }}
                            className={`sm:col-span-1 text-sm font-bold text-[#1A4D2E] bg-white border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                              errorTelefono 
                                ? "border-red-500 focus:ring-red-500" 
                                : "border-[#FF8A00]/20 focus:ring-[#FF8A00]"
                            }`}
                            disabled={guardando}
                          >
                            {LADAS.map((lada) => (
                              <option key={lada.code} value={lada.code}>
                                {lada.code} - {lada.country}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={numeroTemp}
                            onChange={(e) => {
                              setNumeroTemp(e.target.value);
                              setErrorTelefono("");
                            }}
                            placeholder="Número de teléfono"
                            className={`sm:col-span-2 text-sm font-semibold text-[#1A4D2E] bg-white border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 ${
                              errorTelefono 
                                ? "border-red-500 focus:ring-red-500" 
                                : "border-[#FF8A00]/20 focus:ring-[#FF8A00]"
                            }`}
                            disabled={guardando}
                          />
                        </div>
                        
                        <AnimatePresence>
                          {errorTelefono && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 text-red-600 text-sm font-semibold"
                            >
                              <FiX size={16} />
                              <span>{errorTelefono}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={guardarTelefono}
                            disabled={guardando}
                            className="flex-1 bg-[#FF8A00] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#e67d00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            {guardando ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              "Guardar"
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={cancelarTelefono}
                            disabled={guardando}
                            className="px-6 bg-gray-200 text-gray-700 text-sm font-bold py-3 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancelar
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-bold text-[#1A4D2E] pl-12 break-all">{perfil.telefono}</p>
                    )}
                  </motion.div>
                </div>

                {/* Estadística adicional */}
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
            
            {/* Sección de Intereses/Especialidades */}
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
                    <p className="text-sm font-bold text-[#769C7B] mb-4 uppercase tracking-wide">Selecciona tus intereses</p>
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
                      <p className="text-sm font-bold text-[#769C7B] mb-4 uppercase tracking-wide">
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
                      className="flex-1 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white text-base font-black py-4 rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl uppercase tracking-wider"
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
                      className="px-8 bg-gray-200 text-gray-700 text-base font-bold py-4 rounded-2xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
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

            {/* Sección de Actividades/Tours */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[32px] shadow-xl p-8 border border-gray-100"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-black text-[#1A4D2E] mb-1" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                  {esGuia ? "EXPERIENCIAS" : "PRÓXIMOS DESTINOS"}
                </h3>
                <p className="text-xs text-[#769C7B] font-semibold">
                  {esGuia ? "Crea y gestiona tus tours" : "Tus reservaciones y favoritos"}
                </p>
              </div>
              
              {esGuia ? (
                <motion.div 
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => setShowTourModal(true)}
                  className="relative overflow-hidden bg-gradient-to-br from-[#0D601E]/5 via-white to-[#F00808]/5 rounded-[28px] p-12 border-2 border-dashed border-[#0D601E]/20 hover:border-[#0D601E]/40 transition-all cursor-pointer group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D601E]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#F00808]/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                      className="w-20 h-20 bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] rounded-[20px] flex items-center justify-center text-white mb-6 shadow-2xl group-hover:shadow-[0_20px_40px_rgba(13,96,30,0.3)]"
                    >
                      <FiPlus size={36} strokeWidth={3} />
                    </motion.div>
                    
                    <h4 className="text-2xl font-black text-[#1A4D2E] mb-3">Crea tu primera experiencia</h4>
                    <p className="text-sm text-[#769C7B] max-w-md mb-6 leading-relaxed">
                      Diseña rutas personalizadas y comparte tu pasión por Guadalajara con pitzboleros de todo el mundo
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D601E] text-white rounded-xl font-bold text-sm group-hover:bg-[#094d18] transition-colors">
                      Comenzar ahora
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-[28px] p-16 border-2 border-dashed border-gray-200">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#F00808]/5 rounded-full -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0D601E]/5 rounded-full -ml-16 -mb-16" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-[24px] flex items-center justify-center mb-6">
                      <FiMap size={40} className="text-gray-400" />
                    </div>
                    <h4 className="text-2xl font-black text-[#1A4D2E] mb-3">¡Hora de explorar!</h4>
                    <p className="text-sm text-[#769C7B] max-w-md mb-6">
                      Descubre experiencias increíbles en Guadalajara durante el Mundial 2026
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all"
                    >
                      Explorar Tours
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
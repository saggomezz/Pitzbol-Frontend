"use client";
import { useEffect, useState } from "react";
import { 
  FiCamera, FiMessageSquare, FiPlus, FiX, FiUser, FiMap, FiPhone, FiGlobe, FiMail, FiTrash2, FiHeart, FiAward 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilDetallado() {
  const [perfil, setPerfil] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [showTourModal, setShowTourModal] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState<string[]>([]);

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    
    // Priorizamos los datos que vienen del registro
    const datosCargados = {
      id: userLocal.uid || userLocal.id || "temp_id",
      nombre: userLocal.nombre || "Usuario",
      apellido: userLocal.apellido || "",
      email: userLocal.email || "",
      telefono: userLocal.telefono || "No registrado",
      nacionalidad: userLocal.nacionalidad || "No registrado",
      rol: userLocal.role || userLocal.rol || "turista",
      especialidades: userLocal["07_especialidades"] || (userLocal.role === "guia" ? ["Arte e Historia", "Deporte Futbol"] : ["Cultura", "Gastronomía"]),
      fotoUrl: userLocal.fotoUrl || null 
    };

    setPerfil(datosCargados);
    setFotoPerfil(datosCargados.fotoUrl);
    setEspecialidades(datosCargados.especialidades);
    setLoading(false);
  }, []);

  const esGuia = perfil?.rol === "guia";

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
                <div className="w-full grid grid-cols-2 gap-4 mb-6">
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-[#E8F5E9] to-white p-4 rounded-2xl border border-[#0D601E]/10"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiGlobe size={16} className="text-[#0D601E]" />
                      <h3 className="text-[9px] font-black uppercase text-[#769C7B] tracking-wider">Nacionalidad</h3>
                    </div>
                    <p className="text-sm font-bold text-[#1A4D2E]">{perfil.nacionalidad}</p>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-[#FFF3E0] to-white p-4 rounded-2xl border border-[#FF8A00]/10"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiPhone size={16} className="text-[#FF8A00]" />
                      <h3 className="text-[9px] font-black uppercase text-[#769C7B] tracking-wider">Teléfono</h3>
                    </div>
                    <p className="text-xs font-bold text-[#1A4D2E] break-all">{perfil.telefono}</p>
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
                    {especialidades.length} {especialidades.length === 1 ? 'categoría' : 'categorías'}
                  </p>
                </div>
                {esGuia && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D601E] text-white rounded-xl text-sm font-bold hover:bg-[#094d18] transition-colors"
                  >
                    <FiPlus size={16} /> Añadir
                  </motion.button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {especialidades.map((esp, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    className="group relative bg-gradient-to-br from-white to-gray-50 px-5 py-3 rounded-2xl border-2 border-gray-100 hover:border-[#0D601E]/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${esGuia ? "bg-gradient-to-r from-[#0D601E] to-[#1A4D2E]" : "bg-gradient-to-r from-[#F00808] to-[#d00707]"} shadow-lg`} />
                      <span className="text-sm font-bold text-[#1A4D2E]">{esp}</span>
                      {esGuia && (
                        <button className="opacity-0 group-hover:opacity-100 ml-2 text-[#F00808] hover:scale-110 transition-all">
                          <FiTrash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
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
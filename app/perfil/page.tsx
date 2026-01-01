"use client";
import { useEffect, useState } from "react";
import { 
  FiCamera, FiMessageSquare, FiPlus, FiX, FiUser, FiMap, FiClock, FiDollarSign, FiUsers, FiTrash2, FiHeart 
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

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-[#1A4D2E] bg-[#FDFCF9]">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A4D2E] pb-20 font-sans">
      
      {/* 1. Encabezado (Diseño original) */}
      <div className="max-w-6xl mx-auto px-8 py-10 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Mi perfil
          </h1>
          <p className="text-xs text-[#769C7B] font-bold uppercase tracking-[0.3em] mt-2">
            Panel de {perfil.rol} pitzbol
          </p>
        </div>

        <button className="relative p-3 bg-white rounded-2xl shadow-sm border border-[#F6F0E6] text-[#1A4D2E] hover:text-[#F00808] transition-all">
          <FiMessageSquare size={24} />
          <span className="absolute top-2 right-2 w-3 h-3 bg-[#0D601E] border-2 border-white rounded-full" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 2. Columna Izquierda (Diseño original) */}
        <aside className="lg:col-span-4 space-y-8">
          <section className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              {!fotoPerfil && (
                <motion.div 
                  initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-[#FF8A00] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg animate-bounce uppercase tracking-wider z-20"
                >
                  Sube tu foto de perfil
                </motion.div>
              )}
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-[50px] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center relative z-10">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={80} className="text-[#1A4D2E]/10" />
                )}
              </div>
              <motion.label whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute -bottom-2 -right-2 p-4 bg-[#F00808] text-white rounded-2xl shadow-xl cursor-pointer z-30">
                <FiCamera size={20} />
                <input type="file" className="hidden" accept="image/*" />
              </motion.label>
            </div>
            <h2 className="text-3xl font-bold text-[#1A4D2E] mb-1">{perfil.nombre} {perfil.apellido}</h2>
            <p className="text-sm text-[#769C7B]">{perfil.email}</p>
          </section>

          <div className="bg-white border border-[#F6F0E6] rounded-[40px] p-8 flex divide-x divide-[#F6F0E6] shadow-sm">
            <div className="flex-1 pr-4 space-y-3">
              <h3 className="text-center font-black text-[10px] uppercase text-[#769C7B] tracking-widest">
                {esGuia ? "Idiomas" : "Nacionalidad"}
              </h3>
              <div className="flex flex-col gap-2">
                <span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-[10px] font-bold text-center block">
                  {esGuia ? "Español (Nativo)" : perfil.nacionalidad}
                </span>
              </div>
            </div>
            <div className="flex-1 px-4 flex flex-col items-center justify-center text-center">
              <h3 className="font-black text-[10px] uppercase text-[#769C7B] tracking-widest mb-2">Teléfono</h3>
              <p className="font-bold text-[#1A4D2E] text-sm break-all">
                {perfil.telefono}
              </p>
            </div>
            <div className="flex-1 pl-4 flex flex-col items-center justify-center text-center">
              <h3 className="font-black text-[10px] uppercase text-[#769C7B] tracking-widest mb-2">Estatus</h3>
              <p className="font-black text-[#1A4D2E] text-base">
                {esGuia ? "Principiante" : "Viajero"}
              </p>
            </div>
          </div>
        </aside>

        {/* 3. Columna Derecha */}
        <main className="lg:col-span-8 space-y-12">
          
          {/* Especialidades / Intereses (Diseño intacto) */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold italic">
                {esGuia ? "Especialidad Principal" : "Mis Intereses"}
              </h3>
              {/* Solo el guía puede añadir etiquetas */}
              {esGuia && (
                <button className="text-[#0D601E] flex items-center gap-1 text-xs font-bold hover:scale-105 transition-transform">
                  <FiPlus /> Añadir etiqueta
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {especialidades.map((esp, i) => (
                <div key={i} className="group flex items-center gap-3 bg-white p-4 rounded-3xl border border-[#F6F0E6] shadow-sm relative overflow-hidden">
                  <div className={`w-2 h-2 rounded-full ${esGuia ? "bg-[#0D601E]" : "bg-[#F00808]"}`} />
                  <span className="text-xs font-bold">{esp}</span>
                  {/* Solo el guía puede borrar etiquetas */}
                  {esGuia && (
                    <button className="hidden group-hover:flex text-[#F00808] transition-all">
                      <FiTrash2 size={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Sección de Actividad */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold italic">
              {esGuia ? "Catálogo de experiencias" : "Mis próximos destinos"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {esGuia ? (
                <>
                  {/* Diseño de Guía Original: Botón de nuevo tour */}
                  <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => setShowTourModal(true)}
                    className="bg-[#FAF9F2] rounded-[40px] p-8 border-2 border-dashed border-[#0D601E]/20 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white transition-all min-h-[250px]"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0D601E] mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      <FiPlus size={28} />
                    </div>
                    <h4 className="text-lg font-bold text-[#1A4D2E]">Diseñar nueva experiencia</h4>
                    <p className="text-xs text-[#769C7B] mt-2 px-6">Publica una nueva ruta y comienza a recibir pitzboleros</p>
                    <button className="mt-6 text-[#0D601E] font-bold text-xs underline underline-offset-4">Comenzar ahora</button>
                  </motion.div>
                </>
              ) : (
                /* Diseño de Turista: Placeholder de viajes */
                <div className="col-span-full bg-[#FAF9F2] rounded-[40px] p-12 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                  <FiMap size={40} className="text-gray-300 mb-4" />
                  <h4 className="text-lg font-bold text-[#1A4D2E]">No tienes tours reservados</h4>
                  <p className="text-xs text-[#769C7B] mt-2">¡Explora Pitzbol y encuentra tu próxima aventura!</p>
                  <button className="mt-6 bg-[#1A4D2E] text-white px-8 py-3 rounded-full font-bold text-sm">Explorar tours</button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { 
  FiMessageSquare, FiGlobe, FiNavigation, FiPlus, FiX, FiUser, FiStar, FiArrowLeft, FiEdit2, FiClock, FiDollarSign, FiUsers 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilDetallado() {
  const [perfil, setPerfil] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]); // Lista de tours reales
  const [showTourModal, setShowTourModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para el nuevo tour (Campos obligatorios)
  const [nuevoTour, setNuevoTour] = useState({
    titulo: "",
    duracion: "",
    precio: "",
    maxPersonas: ""
  });

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    setPerfil({
      id: userLocal.id || "temp_id",
      nombre: userLocal.nombre || "Valeria",
      especialidades: ["Arte e Historia", "Vida Nocturna", "Deporte Futbol", "Compras"],
      tipoTour: ["Express", "Familiar"]
    });
  }, []);

  // FUNCIÓN PARA GUARDAR EN BACKEND
  const guardarTour = async () => {
    if (!nuevoTour.titulo || !nuevoTour.duracion || !nuevoTour.precio || !nuevoTour.maxPersonas) {
      alert("Todos los campos son obligatorios");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/guides/add-tour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: perfil.id, ...nuevoTour }),
      });

      if (response.ok) {
        setTours([...tours, nuevoTour]);
        setShowTourModal(false);
        setNuevoTour({ titulo: "", duracion: "", precio: "", maxPersonas: "" });
      }
    } catch (error) {
      console.error("Error al guardar tour:", error);
    }
  };

  if (!perfil) return <div className="h-screen flex items-center justify-center font-black text-[#1A4D2E]">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-white text-black pb-10">
      
      {/* HEADER DINÁMICO */}
      <div className="flex justify-between items-center p-6 sticky top-0 bg-white z-[100] max-w-6xl mx-auto w-full">
        <button className="p-2 text-[#1A4D2E]"><FiArrowLeft size={28} /></button>
        <h1 className="text-xl font-bold md:hidden">{perfil.nombre}</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-[#1A4D2E] relative">
          <FiMessageSquare size={28} />
          <span className="absolute top-1 right-1 w-3 h-3 bg-[#0D601E] border-2 border-white rounded-full" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* COLUMNA IZQUIERDA (LAPTOP: 4 COLUMNAS) - INFO PERSONAL */}
        <aside className="lg:col-span-4 space-y-8">
          <section className="flex flex-col items-center text-center space-y-4">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-[#F6F0E6] flex items-center justify-center">
              <FiUser size={80} className="text-[#1A4D2E]/20" />
            </div>
            <div>
              <h2 className="text-4xl font-black">{perfil.nombre}</h2>

            </div>
          </section>

          {/*  IDIOMAS Y PROFESIONALISMO */}
          <div className="bg-white border border-gray-100 rounded-[35px] p-6 flex divide-x divide-gray-100 shadow-sm">
            <div className="flex-1 pr-2 space-y-2">
              <h3 className="font-bold text-xs uppercase text-gray-400 text-center">Idiomas</h3>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-full text-[9px] font-bold">Español (Nativo)</span>
                <span className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-full text-[9px] font-bold">Inglés (B2)</span>
              </div>
            </div>
            <div className="flex-1 pl-2 text-center flex flex-col justify-center">
              <p className="font-bold text-sm">Principiante</p>
              <p className="text-[10px] text-gray-400 italic">Primera vez</p>
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA (LAPTOP: 8 COLUMNAS) - TOURS Y ESPECIALIDADES */}
        <main className="lg:col-span-8 space-y-10">
          
          <section>
            <h3 className="text-xl font-black italic mb-6">Especialidad Principal</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {perfil.especialidades.map((esp: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-[#0D601E]" />
                  <span className="text-xs font-bold">{esp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN DE TOURS DINÁMICA */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black italic">Catálogo de Tours</h3>
              <button 
                onClick={() => setShowTourModal(true)}
                className="bg-[#1A4D2E] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0D601E] transition-all"
              >
                <FiPlus /> Crear Tour
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TOUR DE DEMOSTRACIÓN (Solo se ve si la lista está vacía) */}
              {tours.length === 0 && (
                <div className="bg-[#FAF9F2] rounded-[40px] p-8 border border-[#F6F0E6] opacity-60">
                  <div className="flex justify-between mb-4">
                    <h4 className="text-lg font-black uppercase">Tour Museo Cabañas (Demo)</h4>
                    <span className="text-[10px] bg-gray-200 px-2 py-1 rounded-md font-bold text-gray-500">EJEMPLO</span>
                  </div>
                  <p className="text-sm text-gray-500 italic mb-4">Este es un ejemplo de cómo se verá tu tour ante los turistas.</p>
                  <div className="space-y-2 text-xs font-bold text-gray-400">
                    <p>⏱ 2 Horas</p>
                    <p>💰 $800 MXN</p>
                    <p>👥 Máx 6 Personas</p>
                  </div>
                </div>
              )}

              {/* LISTA DE TOURS REALES */}
              {tours.map((tour, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  key={i} 
                  className="bg-white rounded-[40px] p-8 border-2 border-[#1A4D2E]/10 shadow-lg relative hover:border-[#1A4D2E] transition-all"
                >
                  <button className="absolute top-6 right-6 text-gray-300 hover:text-[#1A4D2E]"><FiEdit2 /></button>
                  <h4 className="text-xl font-black mb-6 text-[#1A4D2E]">{tour.titulo}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <FiClock className="mx-auto mb-1 opacity-40"/>
                      <p className="text-[10px] font-bold">{tour.duracion}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <FiDollarSign className="mx-auto mb-1 opacity-40"/>
                      <p className="text-[10px] font-bold">{tour.precio}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <FiUsers className="mx-auto mb-1 opacity-40"/>
                      <p className="text-[10px] font-bold">{tour.maxPersonas} Pers.</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* MODAL PARA CREAR TOUR (OBLIGATORIO) */}
      <AnimatePresence>
        {showTourModal && (
          <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[50px] p-10 shadow-2xl">
              <div className="flex justify-between mb-8">
                <h2 className="text-2xl font-black uppercase text-[#1A4D2E]">Configurar Nuevo Tour</h2>
                <button onClick={() => setShowTourModal(false)}><FiX size={28}/></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Título del Tour *</label>
                  <input 
                    placeholder="Ej: Caminata por el Centro Histórico" 
                    className="w-full bg-gray-50 p-4 rounded-3xl outline-none focus:ring-2 ring-[#1A4D2E]/20 mt-2 font-bold"
                    onChange={(e) => setNuevoTour({...nuevoTour, titulo: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Duración *</label>
                    <input placeholder="2 hrs" className="w-full bg-gray-50 p-4 rounded-3xl mt-2 text-center font-bold"
                    onChange={(e) => setNuevoTour({...nuevoTour, duracion: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Precio (MXN) *</label>
                    <input placeholder="$00.00" className="w-full bg-gray-50 p-4 rounded-3xl mt-2 text-center font-bold"
                    onChange={(e) => setNuevoTour({...nuevoTour, precio: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Capacidad *</label>
                    <input placeholder="Máx 6" className="w-full bg-gray-50 p-4 rounded-3xl mt-2 text-center font-bold"
                    onChange={(e) => setNuevoTour({...nuevoTour, maxPersonas: e.target.value})}/>
                  </div>
                </div>

                <button 
                  onClick={guardarTour}
                  className="w-full bg-[#1A4D2E] text-white py-5 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl mt-4"
                >
                  Registrar Tour en Catálogo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
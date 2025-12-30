"use client";
import { useEffect, useState } from "react";
import { 
  FiCamera, FiMessageSquare, FiPlus, FiX, FiUser, FiStar, FiEdit2, FiClock, FiDollarSign, FiUsers, FiTrash2 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilDetallado() {
  const [perfil, setPerfil] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [showTourModal, setShowTourModal] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  
  // Estado para el formulario del modal
  const [tourForm, setTourForm] = useState({ titulo: "", duracion: "", precio: "", maxPersonas: "" });

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    
    const cargarDatosFirestore = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/guides/get-profile/${userLocal.id}`);
        const data = await res.json();
        
        setPerfil(data);
        // --- AQUÍ SE SINCRONIZA CON EL REGISTRO (Campo 07) ---
        setEspecialidades(data["07_especialidades"] || []);
        setFotoPerfil(data.fotoUrl || null);
        
        // Cargar tours existentes
        const toursRes = await fetch(`http://localhost:3001/api/guides/get-tours/${userLocal.id}`);
        const toursData = await toursRes.json();
        setTours(toursData || []);
        
      } catch (error) {
        console.error("Error cargando perfil:", error);
        // Fallback por si el backend no responde
        setPerfil({ nombre: userLocal.nombre, rol: "guía" });
      } finally {
        setLoading(false);
      }
    };

    if (userLocal.id) cargarDatosFirestore();
  }, []);

  // --- FUNCIÓN PARA GUARDAR EN BASE DE DATOS ---
  const guardarExperiencia = async () => {
    if (!tourForm.titulo || !tourForm.duracion || !tourForm.precio || !tourForm.maxPersonas) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/guides/add-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: perfil.id || JSON.parse(localStorage.getItem("pitzbol_user")!).id,
          ...tourForm
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        setTours([...tours, resData.tour]); // Actualiza la lista visualmente
        setShowTourModal(false);
        setTourForm({ titulo: "", duracion: "", precio: "", maxPersonas: "" });
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-[#1A4D2E] bg-[#FDFCF9]">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A4D2E] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-8 py-10 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>Mi perfil</h1>
          <p className="text-xs text-[#769C7B] font-bold uppercase tracking-[0.3em] mt-2">Panel de {perfil["03_rol"] || 'guía'} pitzbol</p>
        </div>
        <button className="relative p-3 bg-white rounded-2xl shadow-sm border border-[#F6F0E6] text-[#1A4D2E] hover:text-[#F00808] transition-all">
          <FiMessageSquare size={24} />
          <span className="absolute top-2 right-2 w-3 h-3 bg-[#0D601E] border-2 border-white rounded-full" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-8">
          <section className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              {!fotoPerfil && (
                <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-[#FF8A00] text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg animate-bounce uppercase tracking-wider z-20">Sube tu foto de perfil</motion.div>
              )}
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-[50px] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center relative z-10">
                {fotoPerfil ? <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" /> : <FiUser size={80} className="text-[#1A4D2E]/10" />}
              </div>
              <motion.label whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute -bottom-2 -right-2 p-4 bg-[#F00808] text-white rounded-2xl shadow-xl cursor-pointer z-30">
                <FiCamera size={20} />
                <input type="file" className="hidden" accept="image/*" />
              </motion.label>
            </div>
            <h2 className="text-3xl font-bold text-[#1A4D2E] mb-1">{perfil["01_nombre"]}</h2>
          </section>

          <div className="bg-white border border-[#F6F0E6] rounded-[40px] p-8 flex divide-x divide-[#F6F0E6] shadow-sm">
            <div className="flex-1 pr-4 space-y-3">
              <h3 className="text-center font-black text-[10px] uppercase text-[#769C7B] tracking-widest">Idiomas</h3>
              <span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-[10px] font-bold text-center block">Español (Nativo)</span>
            </div>
            <div className="flex-1 pl-4 flex flex-col items-center justify-center text-center">
              <h3 className="font-black text-[10px] uppercase text-[#769C7B] tracking-widest mb-2">Estatus</h3>
              <p className="font-black text-[#1A4D2E] text-base">Principiante</p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-12">
          {/* ESPECIALIDADES: Aquí se muestran las categorías del registro */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold italic">Especialidad Principal</h3>
              <button className="text-[#0D601E] flex items-center gap-1 text-xs font-bold hover:scale-105 transition-transform"><FiPlus /> Añadir etiqueta</button>
            </div>
            <div className="flex flex-wrap gap-4">
              {especialidades.map((esp, i) => (
                <div key={i} className="group flex items-center gap-3 bg-white p-4 rounded-3xl border border-[#F6F0E6] shadow-sm relative overflow-hidden">
                  <div className="w-2 h-2 rounded-full bg-[#0D601E]" />
                  <span className="text-xs font-bold">{esp}</span>
                  <button className="hidden group-hover:flex text-[#F00808] transition-all"><FiTrash2 size={14}/></button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xl font-bold italic">Catálogo de experiencias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -5 }} onClick={() => setShowTourModal(true)} className="bg-[#FAF9F2] rounded-[40px] p-8 border-2 border-dashed border-[#0D601E]/20 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white transition-all min-h-[250px]">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0D601E] mb-4 group-hover:scale-110 transition-transform shadow-sm"><FiPlus size={28} /></div>
                <h4 className="text-lg font-bold text-[#1A4D2E]">Diseñar nueva experiencia</h4>
                <p className="text-xs text-[#769C7B] mt-2 px-6">Publica una nueva ruta y comienza a recibir pitzboleros</p>
                <button className="mt-6 text-[#0D601E] font-bold text-xs underline underline-offset-4">Comenzar ahora</button>
              </motion.div>

              {tours.map((tour, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="bg-white rounded-[40px] p-8 border border-[#F6F0E6] shadow-lg relative">
                  <button className="absolute top-6 right-6 text-gray-300 hover:text-[#0D601E]"><FiEdit2 size={16}/></button>
                  <h4 className="text-lg font-black uppercase text-[#1A4D2E]">{tour.titulo}</h4>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#769C7B]"><FiClock/> {tour.duracion}h</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#769C7B]"><FiDollarSign/> ${tour.precio}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#769C7B]"><FiUsers/> máx {tour.maxPersonas}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {showTourModal && (
          <div className="fixed inset-0 z-[150] bg-[#1A4D2E]/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[50px] p-10 shadow-3xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>Nuevo tour</h2>
                <button onClick={() => setShowTourModal(false)} className="text-[#F00808] bg-[#FDF2F2] p-2 rounded-full"><FiX size={24}/></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Nombre de la experiencia *</label>
                  <input value={tourForm.titulo} onChange={(e) => setTourForm({...tourForm, titulo: e.target.value})} type="text" placeholder="Ej: Caminata por el Centro" className="w-full bg-[#FDFCF9] border border-[#F6F0E6] p-4 rounded-3xl outline-none font-bold text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Horas *</label>
                    <input value={tourForm.duracion} onChange={(e) => setTourForm({...tourForm, duracion: e.target.value})} type="number" min="1" placeholder="0" className="w-full bg-[#FDFCF9] border border-[#F6F0E6] p-4 rounded-3xl text-center font-bold text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Precio (MXN) *</label>
                    <input value={tourForm.precio} onChange={(e) => setTourForm({...tourForm, precio: e.target.value.replace(/[^0-9.]/g, '')})} type="text" placeholder="$0" className="w-full bg-[#FDFCF9] border border-[#F6F0E6] p-4 rounded-3xl text-center font-bold text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Cupo *</label>
                    <input value={tourForm.maxPersonas} onChange={(e) => setTourForm({...tourForm, maxPersonas: e.target.value})} type="number" min="1" placeholder="0" className="w-full bg-[#FDFCF9] border border-[#F6F0E6] p-4 rounded-3xl text-center font-bold text-sm outline-none" />
                  </div>
                </div>
                <button onClick={guardarExperiencia} className="w-full bg-[#0D601E] text-white py-5 rounded-full font-bold text-sm shadow-xl mt-4 active:scale-95 transition-transform">Guardar experiencia</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { FiUser, FiCalendar, FiMap, FiDollarSign, FiUsers } from "react-icons/fi";

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null); // Aquí vendrá tu data de Firebase

  // Simulación de carga de rol (Aquí conectarás tu lógica de Firebase)
  useEffect(() => {
    // Ejemplo: const userData = await getDoc(doc(db, "users", auth.currentUser.uid))
    setUser({ 
      nombre: "Shai", 
      role: "guia", // Cambia a 'turista' o 'negociante' para probar
      email: "guia@pitzbol.com" 
    });
  }, []);

  if (!user) return <div className="p-20 text-center uppercase font-black">Cargando Perfil...</div>;

  return (
    <div className="min-h-screen bg-[#F6F0E6] p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* HEADER UNIFICADO */}
        <div className="bg-white rounded-[40px] p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-[#1A4D2E]/10">
          <div className="w-24 h-24 bg-[#1A4D2E] rounded-full flex items-center justify-center text-white text-3xl font-bold uppercase">
            {user.nombre[0]}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-[#1A4D2E] uppercase">{user.nombre}</h1>
            <p className="text-[#769C7B] font-bold uppercase text-[10px] tracking-widest">{user.role} Pitzbol</p>
          </div>
        </div>

        {/* RENDERIZADO DINÁMICO SEGÚN ROL */}
        {user.role === "guia" && <DashboardGuia user={user} />}
        {user.role === "turista" && <DashboardTurista user={user} />}
        {user.role === "negociante" && <DashboardNegociante user={user} />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES PARA CADA ROL ---

const DashboardGuia = ({ user }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-2 bg-white rounded-[40px] p-8 shadow-sm">
      <h2 className="text-[#1A4D2E] font-black uppercase mb-6 flex items-center gap-2">
        <FiUsers /> Reservas de Turistas
      </h2>
      {/* Lista de quienes le reservaron */}
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="flex justify-between items-center p-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-[#1A4D2E]">Turista #{i}</p>
              <p className="text-xs text-gray-500">Tour: Leyendas de GDL</p>
            </div>
            <button className="bg-[#0D601E] text-white text-[10px] px-4 py-2 rounded-full uppercase font-bold">Ver Perfil</button>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#1A4D2E] text-white rounded-[40px] p-8">
      <h3 className="font-bold uppercase text-xs mb-4">Balance Stripe</h3>
      <p className="text-4xl font-black mb-6">$4,500.00</p>
      <button className="w-full bg-white text-[#1A4D2E] py-3 rounded-full text-[10px] font-bold uppercase">Retirar Fondos</button>
    </div>
  </div>
);

const DashboardTurista = ({ user }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-[40px] p-8 shadow-sm">
      <h2 className="text-[#1A4D2E] font-black uppercase mb-6 flex items-center gap-2">
        <FiCalendar /> Mis Próximos Tours
      </h2>
      <p className="text-gray-400 text-sm italic">No tienes tours reservados aún. ¡Explora los guías!</p>
    </div>
    <div className="bg-[#8B0000] text-white rounded-[40px] p-8">
      <h3 className="font-bold uppercase text-xs mb-4">¿Listo para la aventura?</h3>
      <p className="text-sm mb-6">Busca guías verificados por biometría para tu estancia en el Mundial.</p>
      <button className="bg-white text-[#8B0000] px-8 py-3 rounded-full text-[10px] font-bold uppercase">Buscar Guías</button>
    </div>
  </div>
);

const DashboardNegociante = ({ user }: any) => (
  <div className="bg-white rounded-[40px] p-8 shadow-sm">
    <h2 className="text-[#1A4D2E] font-black uppercase mb-6 flex items-center gap-2">
      <FiMap /> Mi Negocio
    </h2>
    {/* Estadísticas de cuanta gente ha visto su promoción */}
  </div>
);
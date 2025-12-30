"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
    FiFilter,
    FiHeart,
    FiInfo,
    FiMapPin,
    FiSearch,
    FiSun
} from "react-icons/fi";

// Los datos de los lugares se mantienen igual
const futbolPlaces = [
    {
        id: 1,
        name: "Estadio Akron",
        type: "Estadio",
        desc: "Casa de las Chivas y sede mundialista 2026.",
        img: "https://estadioakron.mx/img/acceso_directo/acceso_como_llego.jpg",
    },
    {
        id: 2,
        name: "Estadio Jalisco",
        type: "Estadio Histórico",
        desc: "Sede de dos mundiales y del legendario Pelé.",
        img: "https://www.shutterstock.com/shutterstock/photos/2421042901/display_1500/stock-photo-guadalajara-mexico-october-aerial-mastery-drone-perspective-of-estadio-jalisco-2421042901.jpg",
    },
    {
        id: 3,
        name: "Museo Chivas",
        type: "Museo",
        desc: "Historia del equipo Chivas, ubicado dentro del Estadio Akron.",
        img: "https://estadioakron.mx/img/zona-para-eventos/museo-chivas/museochivas1.jpg",
    },
    {
        id: 4,
        name: "Tienda Selección",
        type: "Tienda",
        desc: "Consigue mercancía de la selección y artículos exclusivos para el Mundial 2026.",
        img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1600",
    }
];

export default function FutbolPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [favorites, setFavorites] = useState<number[]>([]);
    
    // Solo necesitamos saber si el usuario existe para los favoritos
    // Estos datos ahora se manejan idealmente vía context o el localStorage global
    const handleFavoriteClick = (id: number) => {
        const storedUser = localStorage.getItem("pitzbol_user");
        if (!storedUser) {
            alert("Por favor, identifícate para guardar favoritos.");
            return;
        }
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
            {/* EL HEADER HA SIDO ELIMINADO: Ahora lo provee layout.tsx */}

            {/* BARRA DE ESTADO RÁPIDA (Opcional, debajo del Nav global) */}
            <div className="bg-[#F6F0E6]/50 px-8 py-2 flex items-center justify-end">
                <div className="flex items-center gap-2 text-[10px] text-[#769C7B] font-bold uppercase tracking-widest">
                    <FiSun size={10} className="text-[#F00808]" /> GDL 28°C • Soleado
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-12 w-full">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-[#1A4D2E] uppercase mb-2" style={{ fontFamily: "'Jockey One', sans-serif" }}>Destinos Futboleros</h2>
                        <p className="text-[#769C7B] font-medium italic">Explora los templos del fútbol en la Perla Tapatía.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" />
                            <input
                                type="text"
                                placeholder="Buscar estadio, museo..."
                                className="w-full pl-12 pr-6 py-4 bg-white border border-[#F6F0E6] rounded-full outline-none focus:border-[#1A4D2E] transition-all shadow-sm text-sm text-black placeholder:text-gray-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="px-6 py-4 bg-white border border-[#F6F0E6] rounded-full text-[#1A4D2E] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-[#F6F0E6] transition-all">
                            <FiFilter /> Filtros
                        </button>
                    </div>
                </div>

                {/* GRID DE TARJETAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {futbolPlaces
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((place) => (
                        <motion.div
                            key={place.id}
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[40px] overflow-hidden shadow-[0_10px_30px_rgba(26,77,46,0.05)] border border-[#F6F0E6] flex flex-col group"
                        >
                            <div className="relative h-56 w-full overflow-hidden">
                                <img src={place.img} alt={place.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#0D601E] z-10">
                                    {place.type}
                                </div>

                                <button
                                    onClick={() => handleFavoriteClick(place.id)}
                                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg z-10 transition-all active:scale-90"
                                >
                                    <FiHeart
                                        className={`transition-colors ${favorites.includes(place.id) ? "text-[#F00808] fill-[#F00808]" : "text-[#769C7B]"}`}
                                        size={18}
                                    />
                                </button>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-black text-[#1A4D2E] uppercase mb-2 leading-tight" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                                    {place.name}
                                </h3>
                                <p className="text-[13px] text-[#769C7B] leading-snug mb-6 flex-1 italic">
                                    {place.desc}
                                </p>

                                <div className="flex items-center justify-between mt-auto gap-2">
                                    <button className="flex-1 bg-[#1A4D2E] text-white py-3 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F00808] transition-colors shadow-md">
                                        <FiMapPin /> Ubicar
                                    </button>
                                    <div className="p-3 bg-[#F6F0E6] rounded-full text-[#1A4D2E]/40 cursor-help">
                                        <FiInfo size={16} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
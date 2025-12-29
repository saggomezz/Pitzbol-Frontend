"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // Añadido AnimatePresence
import { FiHeart, FiUser, FiArrowRight, FiSun } from "react-icons/fi";
import imglogo from "../components/logoPitzbol.png"; 
import AuthModal from "../components/AuthModal";

export default function FavoritosPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">
      
      {/* HEADER IDÉNTICO AL DE CALENDARIO */}
      <header className="bg-[#F6F0E6] px-8 py-0 flex justify-between items-center border-b border-[#1A4D2E]/10 flex-shrink-0 z-50 h-20 md:h-24">
        <div className="flex items-center h-full">
          <Link href="/" className="h-full flex items-center">
            <motion.div 
              whileHover={{ rotate: 190 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="relative h-20 w-20 md:h-32 md:w-32 flex-shrink-0 cursor-pointer"
            >
              <Image 
                src={imglogo} 
                alt="logoPitzbol" 
                fill 
                className="object-contain" 
                priority 
              />
            </motion.div>
          </Link>
          
          <div className="flex flex-col ml-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase leading-none" style={{ fontFamily: "'Jockey One', sans-serif" }}>
              Favoritos
            </h1>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-[#769C7B] font-bold uppercase tracking-widest mt-1">
              <FiSun size={10} className="text-[#F00808]" /> GDL 28°C • Soleado
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-16 rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full z-10"
        >
          <div className="bg-[#FDF2F2] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiHeart size={40} className="text-[#F00808] animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            Guarda tus lugares favoritos
          </h2>
          
          <p className="text-[#769C7B] text-sm leading-relaxed mb-10 font-medium">
            Identifícate para guardar tus estadios, restaurantes y guías favoritos en tu perfil de <span className="text-[#F00808] font-bold">PITZBOL</span>.
          </p>

          <div className="space-y-4">
            {/* BOTÓN CORREGIDO: Ahora abre el modal en lugar de redirigir */}
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FiUser size={16} /> Iniciar Sesión <FiArrowRight />
            </button>

            <Link href="/" className="block py-2 text-[#769C7B] font-bold uppercase tracking-widest text-[10px] hover:text-[#1A4D2E] transition-colors">
              Volver a la página principal
            </Link>
          </div>
        </motion.div>
      </main>

      {/* MODAL DE AUTENTICACIÓN */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => setIsAuthOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
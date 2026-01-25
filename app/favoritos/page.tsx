"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiHeart, FiSun, FiUser } from "react-icons/fi";
import { useTranslations } from "next-intl";
import AuthModal from "../components/AuthModal";
import imglogo from "../components/logoPitzbol.png";

export default function FavoritosPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const t = useTranslations('favorites');
  const tAuth = useTranslations('auth');

  return (
    <div className="h-screen bg-[#FDFCF9] flex flex-col font-sans overflow-hidden">

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-4 flex flex-col bottom-9 items-center justify-center p-6 text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-16 rounded-[50px] shadow-[0_20px_50px_rgba(26,77,46,0.05)] border border-[#F6F0E6] max-w-lg w-full z-10"
        >
          <div className="bg-[#FDF2F2] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiHeart size={40} className="text-[#F00808] animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black text-[#1A4D2E] uppercase mb-4" style={{ fontFamily: "'Jockey One', sans-serif" }}>
            {t('title')}
          </h2>
          
          <p className="text-[#769C7B] text-sm leading-relaxed mb-10 font-medium">
            {t('description')} <span className="text-[#F00808] font-bold">PITZBOL</span>.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-[#0D601E] text-white py-4 rounded-full font-bold tracking-[0.1em] text-[14px] shadow-lg hover:shadow-[#0D601E]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FiUser size={16} /> {t('loginButton')} <FiArrowRight />
            </button>
            <Link href="/" className="block py-2 text-[#769C7B] font-bold  text-[14px] hover:text-[#1A4D2E] transition-colors">
              {t('backHome')}
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
"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    FiBriefcase, FiCalendar, FiHeart, FiMapPin, FiMenu, FiUser, FiX, FiInfo, FiMessageSquare, FiShield, FiLogOut, FiHome
} from "react-icons/fi";

import imglogo from "./logoPitzbol.png";
import imgPasto from "./pastoVerde.png";

interface NavbarProps {
    onOpenAuth: () => void;
    onOpenGuide: () => void;
    onOpenBusiness: () => void;
}

export default function Navbar({ onOpenAuth, onOpenGuide, onOpenBusiness }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Función para leer el usuario
    const checkUser = () => {
        const storedUser = localStorage.getItem("pitzbol_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        checkUser();
        // Listener para cambios locales
        window.addEventListener("storage", checkUser);
        // Listener para evento personalizado de autenticación
        window.addEventListener("authStateChanged", checkUser);
        
        const closeMenu = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", closeMenu);
        
        return () => {
            window.removeEventListener("storage", checkUser);
            window.removeEventListener("authStateChanged", checkUser);
            document.removeEventListener("mousedown", closeMenu);
        };
    }, []);

	const handleLogout = () => {
		
		localStorage.removeItem("pitzbol_user");//Limpiar storage
		//Limpiar estado local
		setUser(null);
		setIsMenuOpen(false);
		//Forzar recarga total al Home para resetear todos los formularios internos
		window.location.href = "/"; 
	};

    // Determinamos si mostramos las opciones de SOCIOS
    // Aparecen si: NO hay usuario O si el usuario NO es guía/negocio
    const showSocios = !user || (user.rol !== "guia" && user.rol !== "negocio" && user.rol !== "negociante");

    return (
        <nav className="flex justify-between items-center bg-[#F6F0E6] px-4 md:px-8 h-20 md:h-24 sticky top-0 z-[100] shadow-sm text-[#1A4D2E]">
            <div className="flex items-center h-full">
                <motion.div whileHover={{ rotate: 190 }} transition={{ duration: 2.0, ease: "easeInOut" }} className="relative h-22 w-22 right-3 md:h-32 md:w-32 flex-shrink-0 cursor-pointer">
                    <Link href="/"><Image src={imglogo} alt="logo" fill className="object-contain" priority /></Link>
                </motion.div>

                <div className="relative flex items-center h-full ml-1 pointer-events-none">
                    <div className="absolute inset-y-0 -left-6 md:top-8 top-6 z-0 flex items-center w-[120%] min-w-[150px] md:min-w-[250px]">
                        <Image src={imgPasto} alt="pasto" className="object-contain" />
                    </div>
                    <h1 className="relative z-10 right-2 text-[35px] md:text-[50px] leading-none drop-shadow-[2px_4px_4px_rgba(0,0,0,0.5)] text-white" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                        PITZ<span className="text-[#F00808]">BOL</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 relative">
                <Link href="/"><FiHome size={24} className="cursor-pointer hover:text-[#F00808] transition-colors" /></Link>
                <Link href="/calendario"><FiCalendar size={24} className="cursor-pointer hover:text-[#F00808] transition-colors" /></Link>
                <Link href="/favoritos"><FiHeart size={24} className="cursor-pointer hover:text-[#F00808] transition-colors" /></Link>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 z-[110] text-[#1A4D2E]">
                    {isMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-[110%] right-0 w-64 md:w-72 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-4 flex flex-col gap-1 z-[120]"
                        >
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">Cuenta</p>
                            {user ? (
                                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-[#1A4D2E] hover:text-white transition-all group">
                                    <div className="w-8 h-8 bg-[#1A4D2E] group-hover:bg-white group-hover:text-[#1A4D2E] rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase transition-colors">{user.nombre ? user.nombre[0] : 'U'}</div>
                                    <span className="font-bold text-sm uppercase">{user.nombre || 'Usuario'}</span>
                                </Link>
                            ) : (
                                <button onClick={() => { setIsMenuOpen(false); onOpenAuth(); }} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left">
                                    <FiUser /> <span className="font-bold text-sm italic">Identificarse</span>
                                </button>
                            )}

                            <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">Explorar</p>
                            <Link href="/mapa" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiMapPin /> Mapa de Lugares
                            </Link>

                            {/* ESTA ES LA CLAVE: Si showSocios es true, aparecen las opciones de registro */}
                            {showSocios && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">Socios</p>
                                    <button onClick={() => { setIsMenuOpen(false); onOpenGuide(); }} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                        <FiMapPin /> Afiliación Guías
                                    </button>
                                    <button onClick={() => { setIsMenuOpen(false); onOpenBusiness(); }} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                        <FiBriefcase /> Alianzas Comerciales
                                    </button>
                                </>
                            )}

                            <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">Pitzbol</p>
                            <Link href="/nosotros" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiInfo /> Nosotros
                            </Link>
                            <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiMessageSquare /> Soporte y Contacto
                            </Link>
                            <Link href="/politica-privacidad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiShield /> Política de Privacidad
                            </Link>

                            {user && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-500 rounded-2xl text-sm font-bold transition-all text-left">
                                        <FiLogOut /> Cerrar Sesión
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
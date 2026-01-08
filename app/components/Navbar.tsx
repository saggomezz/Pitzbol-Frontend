"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiBriefcase,FiCalendar, FiClock, FiCreditCard, FiHeart, FiHome, FiInfo,
    FiLogOut,FiMapPin,FiMenu,FiMessageSquare,FiPlusCircle,FiSearch,FiShield,FiUser,
    FiX, FiAward 
} from "react-icons/fi";
import imglogo from "./logoPitzbol.png";
import imgPasto from "./pastoVerde.png";

interface NavbarProps {
    onOpenAuth: () => void;
    onOpenGuide: () => void;
    onOpenBusiness: () => void;
    onOpenAuthAsGuide: () => void;
    onOpenAuthAsBusiness: () => void;
}

export default function Navbar({ onOpenAuth, onOpenGuide, onOpenBusiness, onOpenAuthAsGuide, onOpenAuthAsBusiness }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const isPendingVerification = user?.guideStatus === "pendiente" && localStorage.getItem("pitzbol_guide_submitted") === "true";

    const checkUser = () => {
        const storedUser = localStorage.getItem("pitzbol_user");
        setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    useEffect(() => {
        checkUser();
        window.addEventListener("storage", checkUser);
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
        localStorage.removeItem("pitzbol_user");
        localStorage.removeItem("pitzbol_token");
        setUser(null);
        setIsMenuOpen(false);
        window.location.href = "/";
    };
    

    // Lógica de roles
    const role = user?.role || user?.rol || "visitor";
    const guideStatus = user?.guide_status || "ninguno"; // pendiente | aprobado

    return (
        <nav className="flex justify-between items-center bg-[#F6F0E6] px-4 md:px-8 h-20 md:h-24 sticky top-0 z-[100] shadow-sm text-[#1A4D2E]">
            {/* LOGO Y NOMBRE */}
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

            {/* BUSCADOR */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#769C7B]" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar tours, guías o lugares..." 
                    className="w-full pl-12 pr-4 py-2.5 bg-white/50 border border-[#1A4D2E]/10 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-sm"
                />
            </div>

            {/* ICONOS DERECHA */}
            <div className="flex items-center gap-3 md:gap-5 relative">
                <Link href="/"><FiHome size={22} className="hover:text-[#F00808] transition-colors" title="Home" /></Link>
                <Link href="/favoritos"><FiHeart size={22} className="hover:text-[#F00808] transition-colors" title="Favoritos" /></Link>
                <Link href="/calendario"><FiCalendar size={22} className="hover:text-[#F00808] transition-colors" title="Calendario" /></Link>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 z-[110] bg-white/40 rounded-full hover:bg-white transition-all shadow-sm">
                    {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                {/* MENÚ DESPLEGABLE */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-[120%] right-0 w-72 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-5 flex flex-col gap-1 z-[120]"
                        >
                            {/* SECCIÓN USUARIO */}
                            <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">Mi Cuenta</p>
                            {user ? (
                                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-[#F6F0E6]/50 rounded-2xl hover:bg-[#1A4D2E] hover:text-white transition-all group">
                                    <div className="w-10 h-10 bg-[#1A4D2E] group-hover:bg-white group-hover:text-[#1A4D2E] rounded-full flex items-center justify-center text-white text-xs font-bold uppercase transition-colors">
                                        {user.nombre ? user.nombre[0] : 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm leading-none">{user.nombre}</span>
                                        <span className="text-[10px] opacity-60 uppercase mt-1">{role}</span>
                                    </div>
                                </Link>
                            ) : (
                                <button onClick={() => { setIsMenuOpen(false); onOpenAuth(); }} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left">
                                    <FiUser className="text-[#0D601E]" /> <span className="font-bold text-sm italic text-[#1A4D2E]">Identificarse</span>
                                </button>
                            )}

                            <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">Explorar</p>
                            <Link href="/mapa" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiMapPin /> Mapa de Lugares
                            </Link>

                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />

                            {/* SECCIÓN DINÁMICA POR ROL */}
                            {role === "admin" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">Administración</p>
                                    <Link href="/perfil/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiShield className="text-red-600" /> Solicitudes de Guías
                                    </Link>
                                    <button className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiPlusCircle className="text-blue-600" /> Agregar Lugares
                                    </button>
                                </>
                            ) : role === "guia" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">Panel Guía</p>
                                    <button className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left">
                                        <FiClock className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Solicitudes de Tour</span>
                                    </button>
                                    <button className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiCreditCard /> Mis Pagos
                                    </button>
                                    <button className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiMessageSquare /> Mensajes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">Oportunidades</p>
                                    {isPendingVerification ? (
                                        <button className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-2xl w-full text-left cursor-default">
                                            <FiClock className="text-orange-700" />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-orange-700 font-bold italic">Verificando datos...</span>
                                                <span className="text-[9px] text-orange-600/60 font-medium tracking-tight">Confirmaremos tu identidad pronto</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => { setIsMenuOpen(false); user ? onOpenGuide() : onOpenAuthAsGuide(); }} 
                                            className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group"
                                        >
                                            <FiAward  className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                            <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Conviértete en Guía</span>
                                        </button>
                                    )}
                                    {/* BOTÓN ALIANZAS COMERCIALES */}
                                    <button onClick={() => { setIsMenuOpen(false); user ? onOpenBusiness() : onOpenAuthAsBusiness(); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group"
                                    >
                                        <FiBriefcase className="text-[#0D601E] group-hover:text-[#F00808]" /> 
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808]">Publica tu Negocio</span>
                                    </button>
                                </>
                            )}

                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />

                            {/* PITZBOL SECCIÓN */}
                            <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">Pitzbol</p>

                            <Link href="/nosotros" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left">
                                <FiInfo className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Nosotros</span>
                            </Link>

                            <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors">
                                <FiMessageSquare className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Soporte y Contacto</span>
                            </Link>

                            <Link href="/politica-privacidad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors">
                                <FiShield className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Política de Privacidad</span>
                            </Link>

                            {/* BOTÓN CERRAR SESIÓN */}
                            {user && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                                    
                                    <button 
                                        onClick={handleLogout} 
                                        className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left transition-colors"
                                    >
                                        <FiLogOut className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" /> 
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">Cerrar Sesión</span>
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
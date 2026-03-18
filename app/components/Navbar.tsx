"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { useTranslations } from 'next-intl';
import {
    FiBriefcase, FiCalendar, FiClock, FiCreditCard, FiHeart, FiHome, FiInfo,
    FiLogOut, FiMapPin, FiMenu, FiMessageSquare, FiPlusCircle, FiSearch, FiShield, FiUser,
    FiX, FiAward, FiFileText, FiCompass, FiShoppingBag, FiChevronLeft, FiChevronDown, FiImage
} from "react-icons/fi";
import imglogo from "./logoPitzbol.png";
import imgPasto from "./pastoVerde.png";
import NotificationsPanel from "./NotificationsPanel";
import HistorialSolicitudesModal from "./HistorialSolicitudesModal";
import LanguageSwitcher from "./LanguageSwitcher";
import { useMessageNotifications } from "@/lib/useMessageNotifications";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface NavbarProps {
    onOpenAuth: () => void;
    onOpenGuide: () => void;
    onOpenBusiness: () => void;
    onOpenAuthAsGuide: () => void;
    onOpenAuthAsBusiness: () => void;
}

interface User {
    uid?: string;
    role?: string;
    guide_status?: string;
    fotoPerfil?: string;
    nombre?: string;
    [key: string]: any;
}

export default function Navbar({ onOpenAuth, onOpenGuide, onOpenBusiness, onOpenAuthAsGuide, onOpenAuthAsBusiness }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBusinessSubmenuOpen, setIsBusinessSubmenuOpen] = useState(false);
    const [businessSubmenuPosition, setBusinessSubmenuPosition] = useState({ top: 0, left: 0 });
    const [user, setUser] = useState<User | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [hasBusinessRequests, setHasBusinessRequests] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const businessTriggerRef = useRef<HTMLDivElement | null>(null);
    const businessCloseTimeoutRef = useRef<number | null>(null);
    const t = useTranslations('navbar');
    const tRoles = useTranslations('roles');

    const clearBusinessCloseTimeout = () => {
        if (businessCloseTimeoutRef.current !== null) {
            window.clearTimeout(businessCloseTimeoutRef.current);
            businessCloseTimeoutRef.current = null;
        }
    };

    const openBusinessSubmenuDesktop = () => {
        if (typeof window === "undefined" || window.innerWidth < 768) return;
        clearBusinessCloseTimeout();
        const rect = businessTriggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const submenuWidth = 240;
        const gap = 8;
        setBusinessSubmenuPosition({
            top: rect.top,
            left: Math.max(8, rect.left - submenuWidth - gap),
        });
        setIsBusinessSubmenuOpen(true);
    };

    const scheduleBusinessSubmenuClose = () => {
        clearBusinessCloseTimeout();
        businessCloseTimeoutRef.current = window.setTimeout(() => {
            setIsBusinessSubmenuOpen(false);
        }, 120);
    };

    useEffect(() => {
        // Prevenir scroll cuando el menú está abierto en móvil
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const storedUser = localStorage.getItem("pitzbol_user");
        setUser(storedUser ? JSON.parse(storedUser) : null);

        // Check if user has any business requests
        const checkBusinessRequests = async () => {
            const token = localStorage.getItem("pitzbol_token");
            if (!token) return;
            try {
                const res = await fetch(`${BACKEND_URL}/api/business/my-requests`, {
                    credentials: "include",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setHasBusinessRequests((data.solicitudes?.length || 0) > 0);
                }
            } catch {
                // Silently fail
            }
        };
        checkBusinessRequests();
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen) {
            setIsBusinessSubmenuOpen(false);
        }
    }, [isMenuOpen]);

    useEffect(() => {
        return () => {
            clearBusinessCloseTimeout();
        };
    }, []);

    // Determinar tipo de usuario para notificaciones
    const isGuide = user?.role === "guide" || user?.role === "guia" || user?.guide_status === "aprobado";
    const userType = isGuide ? "guide" : "tourist";

    // Hook de notificaciones de mensajes
    const { unreadCount, newMessageNotification, clearNotification } = useMessageNotifications({
        userId: user?.uid || '',
        userType: userType,
        enabled: !!user?.uid,
    });

    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem("pitzbol_user");
            setUser(storedUser ? JSON.parse(storedUser) : null);
        };
        const hydrateProfilePhoto = async () => {
            const storedUser = localStorage.getItem("pitzbol_user");
            const token = localStorage.getItem("pitzbol_token");
            if (!storedUser || !token) return;
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.fotoPerfil) return;
            try {
                const resp = await fetch(`${BACKEND_URL}/api/perfil/foto-perfil`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                });
                if (!resp.ok) return;
                const data = await resp.json();
                if (data.fotoPerfil) {
                    const updated = { ...parsedUser, fotoPerfil: data.fotoPerfil };
                    localStorage.setItem("pitzbol_user", JSON.stringify(updated));
                    setUser(updated);
                }
            } catch (err) {
                console.error("No se pudo hidratar foto de perfil", err);
            }
        };
        checkUser();
        hydrateProfilePhoto();
        const refreshFromStorage = () => {
            const storedUser = localStorage.getItem("pitzbol_user");
            setUser(storedUser ? JSON.parse(storedUser) : null);
        };
        const handlePhotoUpdate = (_e: Event) => {
            refreshFromStorage();
        };
        const handleGuideSubmission = (_e: Event) => {
            console.log("🎯 Evento: guideSubmissionCompleted - Actualizando Navbar...");
            refreshFromStorage();
        };
        const closeMenu = (e: MouseEvent | globalThis.MouseEvent) => {
            if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        window.addEventListener("fotoPerfilActualizada", handlePhotoUpdate);
        window.addEventListener("guideSubmissionCompleted", handleGuideSubmission);
        window.addEventListener("authStateChanged", refreshFromStorage);
        window.addEventListener("storage", refreshFromStorage);
        document.addEventListener("mousedown", closeMenu);
        return () => {
            window.removeEventListener("fotoPerfilActualizada", handlePhotoUpdate);
            window.removeEventListener("guideSubmissionCompleted", handleGuideSubmission);
            window.removeEventListener("authStateChanged", refreshFromStorage);
            window.removeEventListener("storage", refreshFromStorage);
            document.removeEventListener("mousedown", closeMenu);
        };
    }, []);

    const role = user?.role || "visitor";
    const guideStatus = user?.guide_status || "ninguno";
    const shouldShowBusinessManager = !!user && hasBusinessRequests;
    const guideSubmissionKey = user?.uid ? `pitzbol_guide_submitted_${user.uid}` : null;
    const hasGuideSubmissionFlag = !!guideSubmissionKey && localStorage.getItem(guideSubmissionKey) === "true";
    const isPendingVerification = !!user?.uid && (
        guideStatus === "pendiente" ||
        guideStatus === "en_revision" ||
        hasGuideSubmissionFlag
    );

    const handleLogout = () => {
        localStorage.removeItem("pitzbol_user");
        localStorage.removeItem("pitzbol_token");
        if (user?.uid) {
            localStorage.removeItem(`pitzbol_guide_submitted_${user.uid}`);
        }
        localStorage.removeItem("pitzbol_guide_submitted");
        setUser(null);
        window.location.href = "/";
    };

    return (
        <nav className="flex justify-between items-center bg-[#F6F0E6] px-3 md:px-8 h-16 md:h-20 lg:h-24 sticky top-0 z-[100] shadow-sm text-[#1A4D2E]">
            {/* LOGO Y NOMBRE */}
            <div className="flex items-center h-full gap-1">
                <motion.div whileHover={{ rotate: 190 }} transition={{ duration: 2.0, ease: "easeInOut" }} className="relative h-14 w-14 md:h-20 md:w-20 lg:h-28 lg:w-28 flex-shrink-0 cursor-pointer">
                    <Link href="/"><Image src={imglogo} alt="logo" fill className="object-contain" priority /></Link>
                </motion.div>
                <div className="relative flex items-center h-full pointer-events-none">
                    <div className="absolute inset-y-0 -left-3 md:-left-5 top-3 md:top-5 lg:top-7 z-0 flex items-center w-[95%] md:w-[105%] min-w-[105px] md:min-w-[125px] lg:min-w-[220px]">
                        <Image src={imgPasto} alt="pasto" className="object-contain" />
                    </div>
                    <h1 className="relative z-10 ml-1 md:ml-2 text-[20px] md:text-[28px] lg:text-[42px] leading-none drop-shadow-[2px_4px_4px_rgba(0,0,0,0.5)] text-white" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                        PITZ<span className="text-[#F00808]">BOL</span>
                    </h1>
                </div>
            </div>
            {/* BUSCADOR */}
            <div className="hidden lg:flex flex-1 max-w-[600px] xl:max-w-[800px] mx-4 xl:mx-8 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#769C7B]" size={18} />
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-2.5 bg-white/50 border border-[#1A4D2E]/10 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-sm"
                />
            </div>
            {/* ICONOS DERECHA */}
            <div className="flex items-center gap-2 md:gap-3 lg:gap-5 relative">
                <Link href="/" className="hidden sm:block"><FiHome size={20} className="md:w-[22px] md:h-[22px] hover:text-[#F00808] transition-colors" title={t('home')} /></Link>
                <Link href="/favoritos"><FiHeart size={20} className="md:w-[22px] md:h-[22px] hover:text-[#F00808] transition-colors" title={t('favorites')} /></Link>
                
                {/* Panel de Notificaciones */}
                {user && <NotificationsPanel userId={user.uid} />}
                {/* Selector de Idioma */}
                <LanguageSwitcher />
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 z-[110] bg-white/40 rounded-full hover:bg-white transition-all shadow-sm relative">
                    {isMenuOpen ? <FiX size={22} className="md:w-[24px] md:h-[24px]" /> : <FiMenu size={22} className="md:w-[24px] md:h-[24px]" />}
                </button>
                {/* MENÚ DESPLEGABLE */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            {/* Overlay para cerrar el menú al hacer clic fuera (solo móvil) */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="fixed inset-0 bg-black/20 z-[105] md:hidden"
                            />
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="fixed md:absolute top-16 md:top-[120%] right-2 md:right-0 w-[calc(100vw-1rem)] max-w-[340px] md:w-72 bg-white rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-100 p-4 md:p-5 flex flex-col gap-1 z-[120] max-h-[calc(100vh-5rem)] md:max-h-[85vh] overflow-y-auto scrollbar-hidden"
                            >
                            <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('myAccount')}</p>
                            {user ? (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        window.location.href = role === "admin" ? "/admin" : "/perfil";
                                    }}
                                    className="flex items-center gap-3 p-3 bg-[#F6F0E6]/50 rounded-2xl hover:bg-[#1A4D2E] hover:text-white transition-all group w-full text-left"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1A4D2E] group-hover:bg-white flex items-center justify-center text-white text-xs font-bold uppercase transition-colors">
                                        {user.fotoPerfil ? (
                                            <img
                                                src={user.fotoPerfil}
                                                alt="Foto de perfil"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="text-sm">{(user.nombre || user["01_nombre"] || "U")[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm leading-none">{user.nombre || user["01_nombre"] || "Usuario"}</span>
                                        <span className="text-[10px] opacity-60 uppercase mt-1">{tRoles(role === "guia_pendiente" || role === "pendiente" ? "turista" : role)}</span>
                                    </div>
                                </button>
                            ) : (
                                <button onClick={() => { setIsMenuOpen(false); onOpenAuth(); }} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-[#F6F0E6] rounded-2xl transition-all text-left">
                                    <FiUser className="text-[#0D601E]" /> <span className="font-bold text-sm italic text-[#1A4D2E]">{t('login')}</span>
                                </button>
                            )}
                            <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">{t('explore')}</p>
                            <Link href="/mapa" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiMapPin /> {t('map')}
                            </Link>
                            <Link href="/calendario" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                <FiCalendar /> {t('calendar')}
                            </Link>
                            {user && (
                                <Link
                                    href="/mensajes"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        clearNotification();
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left relative"
                                >
                                    <FiMessageSquare />
                                    <span>{t('messages')}</span>
                                    {unreadCount > 0 && (
                                        <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            )}
                            {(role === "turista" || role === "admin") && (
                                <Link href="/tours" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium transition-all text-left">
                                    <FiCompass /> {t('tours')}
                                </Link>
                            )}
                            {user?.email === "cua@hotmail.com" && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                                    <Link href="/datos-lugares" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiImage className="text-[#1A4D2E]" /> datosLugares
                                    </Link>
                                </>
                            )}
                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                            {/* SECCIÓN DINÁMICA POR ROL */}
                            {role === "admin" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('administration')}</p>
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiShield className="text-red-600" /> {t('guideRequests')}
                                    </Link>
                                    <Link href="/admin/lugares" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiPlusCircle className="text-blue-600" /> {t('managePlaces')}
                                    </Link>
                                    <Link href="/admin/negocios" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium">
                                        <FiUser className="text-green-600" /> {t('manageBusinesses')}
                                    </Link>
                                </>
                            ) : role === "guia" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('guidePanel')}</p>
                                    <button className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left">
                                        <FiClock className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('tourRequests')}</span>
                                    </button>
                                    <button className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium w-full text-left">
                                        <FiCreditCard /> {t('myPayments')}
                                    </button>
                                    {user && hasBusinessRequests && (
                                        <Link
                                            href="/negocio/mis-solicitudes"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] rounded-2xl text-sm font-medium w-full text-left"
                                        >
                                            <FiShoppingBag className="text-[#0D601E]" />
                                            <span>Gestionar mis negocios</span>
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('opportunities')}</p>
                                    
                                    {isPendingVerification ? (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onOpenGuide(); }}
                                            className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-2xl w-full text-left hover:bg-orange-100 transition-colors"
                                        >
                                            <FiAward className="text-[#0D601E]" />
                                            <div className="flex flex-col">
                                                <span className="text-[#1A4D2E] font-medium text-sm italic">{t('becomeGuide')}</span>
                                                <span className="text-[10px] text-orange-700/80 font-bold italic">{t('verifyingData')}</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); user ? onOpenGuide() : onOpenAuthAsGuide(); }}
                                            className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group"
                                        >
                                            <FiAward className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                            <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('becomeGuide')}</span>
                                        </button>
                                    )}
                                    {shouldShowBusinessManager ? (
                                        <div
                                            ref={businessTriggerRef}
                                            className="relative"
                                            onMouseEnter={openBusinessSubmenuDesktop}
                                            onMouseLeave={scheduleBusinessSubmenuClose}
                                        >
                                            <button
                                                onClick={() => {
                                                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                                                        setIsBusinessSubmenuOpen((prev) => !prev);
                                                        return;
                                                    }
                                                    setIsMenuOpen(false);
                                                    user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                                }}
                                                className="flex items-center justify-between gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group hover:bg-[#F6F0E6] transition-all"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <FiBriefcase className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                                    <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('publishBusiness')}</span>
                                                </span>
                                                <motion.span
                                                    animate={{ rotate: isBusinessSubmenuOpen ? 180 : 0, x: isBusinessSubmenuOpen ? -2 : 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    className="text-[#0D601E] group-hover:text-[#F00808]"
                                                >
                                                    <FiChevronLeft className="hidden md:block" />
                                                    <FiChevronDown className="md:hidden" />
                                                </motion.span>
                                            </button>

                                            <AnimatePresence>
                                                {isBusinessSubmenuOpen && (
                                                    <>
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -12 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -12 }}
                                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                                            style={{ top: businessSubmenuPosition.top, left: businessSubmenuPosition.left }}
                                                            onMouseEnter={clearBusinessCloseTimeout}
                                                            onMouseLeave={scheduleBusinessSubmenuClose}
                                                            className="hidden md:block fixed w-60 z-[200] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setIsMenuOpen(false);
                                                                    user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                                                }}
                                                                className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] text-sm font-medium w-full text-left transition-all"
                                                            >
                                                                <FiPlusCircle className="text-[#0D601E]" />
                                                                <span>{t('publishBusiness')}</span>
                                                            </button>
                                                            <Link
                                                                href="/negocio/mis-solicitudes"
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className="flex items-center gap-3 p-3 hover:bg-[#F6F0E6] text-sm font-medium w-full text-left transition-all"
                                                            >
                                                                <FiShoppingBag className="text-[#0D601E]" />
                                                                <span>Gestionar mis negocios</span>
                                                            </Link>
                                                        </motion.div>

                                                        <motion.div
                                                            initial={{ opacity: 0, y: -4, height: 0 }}
                                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                                            exit={{ opacity: 0, y: -4, height: 0 }}
                                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                                            className="md:hidden bg-[#F6F0E6] rounded-2xl overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setIsMenuOpen(false);
                                                                    user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                                                }}
                                                                className="flex items-center gap-3 p-3 hover:bg-white text-sm font-medium w-full text-left transition-all"
                                                            >
                                                                <FiPlusCircle className="text-[#0D601E]" />
                                                                <span>{t('publishBusiness')}</span>
                                                            </button>
                                                            <Link
                                                                href="/negocio/mis-solicitudes"
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className="flex items-center gap-3 p-3 hover:bg-white text-sm font-medium w-full text-left transition-all"
                                                            >
                                                                <FiShoppingBag className="text-[#0D601E]" />
                                                                <span>Gestionar mis negocios</span>
                                                            </Link>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group hover:bg-[#F6F0E6] transition-all"
                                        >
                                            <FiBriefcase className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                            <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('publishBusiness')}</span>
                                        </button>
                                    )}
                                </>
                            )}
                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('pitzbol')}</p>
                            <Link href="/nosotros" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left">
                                <FiInfo className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('aboutUs')}</span>
                            </Link>
                            <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors">
                                <FiMessageSquare className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('support')}</span>
                            </Link>
                            <Link href="/politica-privacidad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors">
                                <FiShield className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('privacyPolicy')}</span>
                            </Link>
                            {user && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left transition-colors"
                                    >
                                        <FiLogOut className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('logout')}</span>
                                    </button>
                                </>
                            )}
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Notificación Flotante de Nuevo Mensaje */}
            <AnimatePresence>
                {newMessageNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: 50 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -50, x: 50 }}
                        className="fixed top-24 right-4 bg-white rounded-2xl shadow-2xl p-4 max-w-sm border-2 border-[#1A4D2E] z-[200]"
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-[#1A4D2E] text-white p-2 rounded-full">
                                <FiMessageSquare size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-[#1A4D2E]">{newMessageNotification.senderName}</h4>
                                    <button 
                                        onClick={clearNotification}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {newMessageNotification.message}
                                </p>
                                <Link 
                                    href="/mensajes"
                                    onClick={clearNotification}
                                    className="text-xs text-[#0D601E] hover:underline mt-2 inline-block font-semibold"
                                >
                                    Ver mensaje →
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* MODAL DE ESTATUS DE SOLICITUD */}
            <AnimatePresence>
                {showStatusModal && isPendingVerification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center"
                    >
                        <div className="fixed inset-0 bg-black/30" />
                        <div className="relative bg-white rounded-xl shadow-lg p-4 w-64 z-[300] transition-all">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm leading-none">{user?.nombre || user?.["01_nombre"] || "Usuario"}</span>
                                <span className="text-[10px] opacity-60 uppercase mt-1">{role === "guia_pendiente" || role === "pendiente" ? "turista" : role}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
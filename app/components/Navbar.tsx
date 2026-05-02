"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { useTranslations } from 'next-intl';
import {
    FiBriefcase, FiCalendar, FiClock, FiCreditCard, FiHeart, FiHome, FiInfo,
    FiLogOut, FiMapPin, FiMenu, FiMessageSquare, FiPlusCircle, FiSearch, FiShield, FiUser,
    FiX, FiAward, FiCompass, FiShoppingBag, FiImage, FiChevronLeft, FiChevronDown
} from "react-icons/fi";
import imglogo from "./logoPitzbol.png";
import imgPasto from "./pastoVerde.png";
import NotificationsPanel from "./NotificationsPanel";
import HistorialSolicitudesModal from "./HistorialSolicitudesModal";
import { useMessageNotifications } from "@/lib/useMessageNotifications";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = "/api";
const PHOTO_HYDRATE_COOLDOWN_KEY = "pitzbol_profile_photo_hydrate_cooldown_until";
const BUSINESS_REQUESTS_CACHE_KEY_PREFIX = "pitzbol_has_business_requests_";

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
    const [busqueda, setBusqueda] = useState("");
    const [sugerencias, setSugerencias] = useState<{ nombre: string; categoria: string }[]>([]);
    const [todosLugares, setTodosLugares] = useState<{ nombre: string; categoria: string }[]>([]);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [idxSeleccionado, setIdxSeleccionado] = useState(-1);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
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
    }, [isMenuOpen]);

    useEffect(() => {
        const userUid = user?.uid;
        const userRole = (user?.role || "").toLowerCase();

        if (!userUid) {
            setHasBusinessRequests(false);
            return;
        }

        const isBusinessRole = userRole === "business" || userRole === "negocio";
        const cacheKey = `${BUSINESS_REQUESTS_CACHE_KEY_PREFIX}${userUid}`;
        const cachedValue = localStorage.getItem(cacheKey);

        // For business users, keep manager access enabled immediately.
        if (isBusinessRole) {
            setHasBusinessRequests(true);
            return;
        }

        if (cachedValue !== null) {
            setHasBusinessRequests(cachedValue === "true");
            return;
        }

        let isCancelled = false;
        const checkBusinessRequests = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/business/my-requests`, {
                    cache: "no-store",
                });
                const data = await res.json();
                if (!isCancelled && data.success) {
                    const hasRequests = (data.solicitudes?.length || 0) > 0;
                    setHasBusinessRequests(isBusinessRole || hasRequests);
                    localStorage.setItem(cacheKey, String(hasRequests));
                }
            } catch {
                // Keep previous value if request fails.
            }
        };

        checkBusinessRequests();

        return () => {
            isCancelled = true;
        };
    }, [user?.uid, user?.role]);

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

            const cooldownUntilRaw = localStorage.getItem(PHOTO_HYDRATE_COOLDOWN_KEY);
            const cooldownUntil = cooldownUntilRaw ? Number(cooldownUntilRaw) : 0;
            if (Number.isFinite(cooldownUntil) && cooldownUntil > Date.now()) {
                return;
            }

            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.fotoPerfil) return;
            try {
                const resp = await fetch(`${API_BASE}/perfil/foto-perfil`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                });
                if (!resp.ok) return;
                const data = await resp.json();
                if (data.fotoPerfil) {
                    const updated = { ...parsedUser, fotoPerfil: data.fotoPerfil };
                    localStorage.setItem("pitzbol_user", JSON.stringify(updated));
                    localStorage.removeItem(PHOTO_HYDRATE_COOLDOWN_KEY);
                    setUser(updated);
                }
            } catch {
                // If backend is temporarily unavailable, avoid noisy retries and keep UI working.
                localStorage.setItem(PHOTO_HYDRATE_COOLDOWN_KEY, String(Date.now() + 5 * 60 * 1000));
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
            console.log("�x}� Evento: guideSubmissionCompleted - Actualizando Navbar...");
            refreshFromStorage();
        };
        const handleBusinessRequestSubmitted = (_e: Event) => {
            const storedUser = localStorage.getItem("pitzbol_user");
            if (!storedUser) return;
            const parsedUser = JSON.parse(storedUser) as User;
            if (parsedUser?.uid) {
                localStorage.setItem(`${BUSINESS_REQUESTS_CACHE_KEY_PREFIX}${parsedUser.uid}`, "true");
            }
            setHasBusinessRequests(true);
        };
        const handleStorage = (e: StorageEvent) => {
            // Ignorar cambios de notificaciones para evitar setState cruzado durante renders de otros componentes
            if (e.key && e.key !== "pitzbol_user" && e.key !== "pitzbol_token") return;
            refreshFromStorage();
        };
        const closeMenu = (e: MouseEvent | globalThis.MouseEvent) => {
            if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        const closeMenuOnEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener("fotoPerfilActualizada", handlePhotoUpdate);
        window.addEventListener("guideSubmissionCompleted", handleGuideSubmission);
        window.addEventListener("businessRequestSubmitted", handleBusinessRequestSubmitted);
        window.addEventListener("authStateChanged", refreshFromStorage);
        window.addEventListener("storage", handleStorage);
        window.addEventListener("keydown", closeMenuOnEscape);
        document.addEventListener("mousedown", closeMenu);
        return () => {
            window.removeEventListener("fotoPerfilActualizada", handlePhotoUpdate);
            window.removeEventListener("guideSubmissionCompleted", handleGuideSubmission);
            window.removeEventListener("businessRequestSubmitted", handleBusinessRequestSubmitted);
            window.removeEventListener("authStateChanged", refreshFromStorage);
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("keydown", closeMenuOnEscape);
            document.removeEventListener("mousedown", closeMenu);
        };
    }, []);

    const normalizeStr = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    useEffect(() => {
        fetch("/api/lugares")
            .then(r => r.json())
            .then(data => {
                const list = (data.lugares || data || []) as { nombre?: string; categoria?: string }[];
                setTodosLugares(list.filter(l => l.nombre).map(l => ({ nombre: l.nombre!, categoria: l.categoria || "" })));
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!busqueda.trim()) { setSugerencias([]); return; }
        const q = normalizeStr(busqueda);
        const filtered = todosLugares
            .filter(l => normalizeStr(l.nombre).includes(q) || normalizeStr(l.categoria).includes(q))
            .slice(0, 8);
        setSugerencias(filtered);
    }, [busqueda, todosLugares]);

    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setMostrarDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
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
                <motion.div whileHover={{ rotate: 190 }} transition={{ duration: 2.0, ease: "easeInOut" }} className="relative h-16 w-16 md:h-20 md:w-20 lg:h-28 lg:w-28 flex-shrink-0 cursor-pointer">
                    <Link href="/" className="relative block h-full w-full">
                        <Image
                            src={imglogo}
                            alt="logo"
                            fill
                            sizes="(max-width: 768px) 56px, (max-width: 1024px) 80px, 112px"
                            className="object-contain"
                            priority
                        />
                    </Link>
                </motion.div>
                <div className="relative flex items-center h-full pointer-events-none">
                    <div className="absolute inset-y-0 -left-3 md:-left-5 top-6 md:top-5 lg:top-7 z-0 flex items-center w-[95%] md:w-[105%] min-w-[110px] md:min-w-[125px] lg:min-w-[220px]">
                        <Image src={imgPasto} alt="pasto" className="object-contain origin-left" loading="eager" priority />
                    </div>
                    <h1 className="relative z-10 ml-1 md:ml-2 text-[26px] md:text-[28px] lg:text-[42px] leading-none drop-shadow-[2px_4px_4px_rgba(0,0,0,0.5)] text-white" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                        PITZ<span className="text-[#F00808]">BOL</span>
                    </h1>
                </div>
            </div>
            {/* BUSCADOR */}
            <div ref={searchRef} className="hidden lg:flex flex-1 max-w-[600px] xl:max-w-[800px] mx-4 xl:mx-8 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#769C7B] z-10" size={18} />
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); setMostrarDropdown(true); setIdxSeleccionado(-1); }}
                    onFocus={() => { if (sugerencias.length > 0) setMostrarDropdown(true); }}
                    onKeyDown={e => {
                        if (e.key === "ArrowDown") { e.preventDefault(); setIdxSeleccionado(i => Math.min(i + 1, sugerencias.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setIdxSeleccionado(i => Math.max(i - 1, -1)); }
                        else if (e.key === "Enter") {
                            const target = idxSeleccionado >= 0 ? sugerencias[idxSeleccionado] : sugerencias[0];
                            if (target) { router.push("/informacion/" + encodeURIComponent(target.nombre)); setBusqueda(""); setMostrarDropdown(false); }
                        } else if (e.key === "Escape") { setMostrarDropdown(false); setBusqueda(""); }
                    }}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-2.5 bg-white/50 border border-[#1A4D2E]/10 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-sm"
                    autoComplete="off"
                />
                {mostrarDropdown && sugerencias.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[200]">
                        {sugerencias.map((s, i) => (
                            <button
                                key={s.nombre}
                                onMouseDown={() => { router.push("/informacion/" + encodeURIComponent(s.nombre)); setBusqueda(""); setMostrarDropdown(false); }}
                                className={`flex items-center justify-between w-full px-4 py-3 text-left text-sm hover:bg-[#F6F0E6] transition-colors ${i === idxSeleccionado ? "bg-[#F6F0E6]" : ""}`}
                            >
                                <span className="flex items-center gap-2 text-[#1A4D2E] font-medium truncate">
                                    <FiSearch size={14} className="text-[#769C7B] flex-shrink-0" />
                                    {s.nombre}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-[#1A4D2E] px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{s.categoria}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* ICONOS DERECHA */}
            <div className="flex items-center gap-2 md:gap-3 lg:gap-5 relative">
                <Link href="/" className="hidden sm:block"><FiHome size={20} className="md:w-[22px] md:h-[22px] hover:text-[#F00808] transition-colors" title={t('home')} /></Link>
                <Link href="/favoritos"><FiHeart size={20} className="md:w-[22px] md:h-[22px] hover:text-[#F00808] transition-colors" title={t('favorites')} /></Link>
                
                {/* Panel de Notificaciones */}
                {user && <NotificationsPanel userId={user.uid} />}
<button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 z-[110] hover:text-[#F00808] transition-colors relative">
                    {isMenuOpen ? <FiX size={22} className="md:w-[24px] md:h-[24px]" /> : <FiMenu size={22} className="md:w-[24px] md:h-[24px]" />}
                </button>
                {/* MEN�a DESPLEGABLE */}
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
                                    className="flex items-center gap-3 p-3 rounded-2xl transition-colors group w-full text-left hover:text-[#F00808]"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1A4D2E] group- flex items-center justify-center text-white text-xs font-bold uppercase transition-colors">
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
                                <button onClick={() => { setIsMenuOpen(false); onOpenAuth(); }} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl transition-all text-left hover:text-[#F00808]">
                                    <FiUser className="text-[#0D601E]" /> <span className="font-bold text-sm italic text-[#1A4D2E]">{t('login')}</span>
                                </button>
                            )}
                            <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-1">{t('explore')}</p>
                            <Link href="/mapa" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium transition-all text-left hover:text-[#F00808]">
                                <FiMapPin /> {t('map')}
                            </Link>
                            <Link href="/calendario" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium transition-all text-left hover:text-[#F00808]">
                                <FiCalendar /> {t('calendar')}
                            </Link>
                            {user && (
                                <Link
                                    href="/mensajes"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        clearNotification();
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium transition-all text-left relative hover:text-[#F00808]"
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
                                <Link href="/tours" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium transition-all text-left hover:text-[#F00808]">
                                    <FiCompass /> {t('tours')}
                                </Link>
                            )}
                            {user?.email === "cua@hotmail.com" && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                                    <Link href="/datos-lugares" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium hover:text-[#F00808] transition-colors">
                                        <FiImage className="text-[#1A4D2E]" /> datosLugares
                                    </Link>
                                </>
                            )}
                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                            {/* SECCI�N DINÁMICA POR ROL */}
                            {role === "admin" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('administration')}</p>
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium hover:text-[#F00808] transition-colors">
                                        <FiAward className="text-[#0D601E]" /> Gestionar Guias
                                    </Link>
                                    <Link href="/admin/lugares" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium hover:text-[#F00808] transition-colors">
                                        <FiPlusCircle className="text-blue-600" /> {t('managePlaces')}
                                    </Link>
                                    <Link href="/admin/negocios" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium hover:text-[#F00808] transition-colors">
                                        <FiBriefcase className="text-green-600" /> Gestionar negocios
                                    </Link>
                                </>
                            ) : role === "guia" ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('guidePanel')}</p>
                                    <Link href="/guide/solicitudes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left hover:text-[#F00808] transition-colors">
                                        <FiClock className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                        <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('tourRequests')}</span>
                                    </Link>
                                    <Link href="/guide/solicitudes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left hover:text-[#F00808] transition-colors">
                                        <FiCreditCard /> {t('myPayments')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('opportunities')}</p>
                                    
                                    {isPendingVerification ? (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onOpenGuide(); }}
                                            className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-2xl w-full text-left transition-colors hover:text-[#F00808]"
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
                                            className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group hover:text-[#F00808] transition-colors"
                                        >
                                            <FiAward className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                            <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('becomeGuide')}</span>
                                        </button>
                                    )}
                                    <div
                                        ref={businessTriggerRef}
                                        className="relative"
                                        onMouseEnter={shouldShowBusinessManager ? openBusinessSubmenuDesktop : undefined}
                                        onMouseLeave={shouldShowBusinessManager ? scheduleBusinessSubmenuClose : undefined}
                                    >
                                        <button
                                            onClick={() => {
                                                if (shouldShowBusinessManager && typeof window !== "undefined" && window.innerWidth < 768) {
                                                    setIsBusinessSubmenuOpen((prev) => !prev);
                                                    return;
                                                }
                                                setIsMenuOpen(false);
                                                user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                            }}
                                            className="flex items-center justify-between gap-3 p-3 rounded-2xl text-sm font-medium w-full text-left group transition-all hover:text-[#F00808]"
                                        >
                                            <span className="flex items-center gap-3 hover:text-[#F00808] transition-colors">
                                                <FiBriefcase className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('publishBusiness')}</span>
                                            </span>
                                            {shouldShowBusinessManager && (
                                                <motion.span
                                                    animate={{ rotate: isBusinessSubmenuOpen ? 180 : 0, x: isBusinessSubmenuOpen ? -2 : 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    className="text-[#0D601E] group-hover:text-[#F00808]"
                                                >
                                                    <FiChevronLeft className="hidden md:block" />
                                                    <FiChevronDown className="md:hidden" />
                                                </motion.span>
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isBusinessSubmenuOpen && shouldShowBusinessManager && (
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
                                                            className="flex items-center gap-3 p-3 text-sm font-medium w-full text-left transition-all hover:text-[#F00808]"
                                                        >
                                                            <FiPlusCircle className="text-[#0D601E]" />
                                                            <span>{t('publishBusiness')}</span>
                                                        </button>
                                                        <Link
                                                            href="/negocio/mis-solicitudes"
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className="flex items-center gap-3 p-3 text-sm font-medium w-full text-left transition-all hover:text-[#F00808]"
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
                                                        className="md:hidden rounded-2xl overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setIsMenuOpen(false);
                                                                user ? onOpenBusiness() : onOpenAuthAsBusiness();
                                                            }}
                                                            className="flex items-center gap-3 p-3 text-sm font-medium w-full text-left transition-all hover:text-[#F00808]"
                                                        >
                                                            <FiPlusCircle className="text-[#0D601E]" />
                                                            <span>{t('publishBusiness')}</span>
                                                        </button>
                                                        <Link
                                                            href="/negocio/mis-solicitudes"
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className="flex items-center gap-3 p-3 text-sm font-medium w-full text-left transition-all hover:text-[#F00808]"
                                                        >
                                                            <FiShoppingBag className="text-[#0D601E]" />
                                                            <span>Gestionar mis negocios</span>
                                                        </Link>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                            <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                            <p className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold px-3 mb-2">{t('pitzbol')}</p>
                            <Link href="/nosotros" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group w-full text-left hover:text-[#F00808] transition-colors">
                                <FiInfo className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('aboutUs')}</span>
                            </Link>
                            <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors hover:text-[#F00808]">
                                <FiMessageSquare className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('support')}</span>
                            </Link>
                            <Link href="/politica-privacidad" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-sm font-medium group transition-colors hover:text-[#F00808]">
                                <FiShield className="text-[#0D601E] group-hover:text-[#F00808] transition-colors" />
                                <span className="text-[#1A4D2E] group-hover:text-[#F00808] transition-colors">{t('privacyPolicy')}</span>
                            </Link>
                            {user && (
                                <>
                                    <div className="h-[1px] bg-gray-100 my-3 mx-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold group w-full text-left transition-colors"
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
                                    Ver mensaje � 
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



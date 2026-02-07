"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { FiBell, FiCheck, FiX, FiAlertCircle, FiChevronRight, FiLoader, FiBriefcase } from "react-icons/fi";
import { marcarNotificacionComoLeida } from "@/lib/notificaciones";

interface Notification {
  id: string;
  tipo: 'aprobado' | 'rechazado' | 'info' | 'solicitud_guia_pendiente' | 'contacto' | 'llamada' | 'nueva_solicitud_negocio';
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  enlace?: string;
  solicitudId?: string;
  uidSolicitante?: string;
}

interface NotificationsPanelProps {
  userId?: string;
}

export default function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones del backend (Firestore)
  const cargarNotificacionesDelBackend = async () => {
    if (!userId) return;
    setCargando(true);
    const key = `pitzbol_notifications_${userId}`;
    const notificacionesLocal: Notification[] = JSON.parse(localStorage.getItem(key) || '[]');

    try {
      setCargando(true);
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('pitzbol_token');
      const user = localStorage.getItem('pitzbol_user') ? JSON.parse(localStorage.getItem('pitzbol_user') || '{}') : null;
      
      // Obtener notificaciones del usuario (siempre)
      const response = await fetch(`${API_BASE}/api/admin/notificaciones/${userId}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      
      let notificacionesDelBackend: Notification[] = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notificaciones) {
          notificacionesDelBackend = data.notificaciones.map((notif: any) => ({
            id: notif.id,
            tipo: notif.tipo,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            fecha: notif.fecha,
            leido: notif.leido || false,
            enlace: notif.enlace,
            solicitudId: notif.solicitudId,
            uidSolicitante: notif.uidSolicitante
          }));
        }
      }

      // Si es admin, también cargar notificaciones de soporte
      if (user?.role === 'admin') {
        try {
          const supportResponse = await fetch(`${API_BASE}/api/support/notifications`, {
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          });

          if (supportResponse.ok) {
            const supportData = await supportResponse.json();
            if (supportData.success && supportData.notificaciones) {
              const notificacionesSoporte = supportData.notificaciones.map((notif: any) => ({
                id: notif.id,
                tipo: notif.tipo,
                titulo: notif.titulo,
                mensaje: notif.mensaje,
                fecha: notif.fecha,
                leido: notif.leido || false,
                enlace: notif.enlace,
              }));
              notificacionesDelBackend = [...notificacionesDelBackend, ...notificacionesSoporte];
            }
          }
        } catch (error) {
          console.error("Error al cargar notificaciones de soporte:", error);
        }
      }

      // Combinar con localStorage y eliminar duplicados
      const key = `pitzbol_notifications_${userId}`;
      const notificacionesLocal = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Crear un mapa de notificaciones locales por ID para priorizar cambios locales
      const localMap = new Map((notificacionesLocal as Notification[]).map((n: Notification) => [n.id, n]));
      
      // Combinar: Firestore como base, pero localStorage sobrescribe si existe
      const notificacionesCombinadas: Notification[] = notificacionesDelBackend.map((notif: Notification) => 
        localMap.get(notif.id) || notif
      );
      
      // Agregar notificaciones locales que no están en Firestore
      const idsBackend = new Set(notificacionesDelBackend.map((n: Notification) => n.id));
      for (const localNotif of notificacionesLocal as Notification[]) {
        if (!idsBackend.has(localNotif.id)) {
          notificacionesCombinadas.push(localNotif);
        }
      }

      // Ordenar por fecha (más recientes primero)
      notificacionesCombinadas.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setNotificaciones(notificacionesCombinadas);
      setNoLeidas(notificacionesCombinadas.filter((n) => !n.leido).length);

      // Actualizar localStorage
      localStorage.setItem(key, JSON.stringify(notificacionesCombinadas));
    } catch (error) {
      console.error("Error al cargar notificaciones del backend:", error);
      // Cargar solo del localStorage si el backend falla
      cargarNotificacionesLocal();
    } finally {
      setCargando(false);
    }
  };

  // Cargar notificaciones del localStorage
  const cargarNotificacionesLocal = () => {
    if (!userId) return;

    const key = `pitzbol_notifications_${userId}`;
    const stored = localStorage.getItem(key);
    const notifs: Notification[] = stored ? JSON.parse(stored) : [];
    setNotificaciones(notifs);
    setNoLeidas(notifs.filter((n) => !n.leido).length);
  };

  // Efecto inicial para cargar notificaciones
  useEffect(() => {
    if (userId) {
      cargarNotificacionesLocal();
      // Cargar del backend inmediatamente al montar (para admins y badge)
      cargarNotificacionesDelBackend();
    }
  }, [userId]);

  // El efecto de Firestore se elimina. Solo se usa la API REST y localStorage.
  // Recargar notificaciones cuando se abre el panel
  useEffect(() => {
    if (isOpen && userId) {
      cargarNotificacionesDelBackend();
    }
  }, [isOpen, userId]);

  // Polling ligero para admins: refresca cada 30s aunque el panel esté cerrado
  useEffect(() => {
    if (!userId) return;

    const user = localStorage.getItem('pitzbol_user') ? JSON.parse(localStorage.getItem('pitzbol_user') || '{}') : null;
    if (user?.role !== 'admin') return;

    const interval = setInterval(() => {
      cargarNotificacionesDelBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Escuchar cambios en storage
  useEffect(() => {
    const handleStorageChange = () => {
      cargarNotificacionesLocal();
    };
    const handleNotificationsUpdated = (event: Event) => {
      cargarNotificacionesLocal();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pitzbolNotificationsUpdated", handleNotificationsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pitzbolNotificationsUpdated", handleNotificationsUpdated);
    };
  }, [userId]);

  const marcarComoLeida = async (id: string) => {
    if (!userId) return;

    console.log(`📌 Marcando notificación como leída: ${id}`);

    // Usar la función centralizada de notificaciones
    marcarNotificacionComoLeida(userId, id);

    // Actualizar estado local
    const actualizadas = notificaciones.map(n => 
      n.id === id ? { ...n, leido: true } : n
    );
    
    setNotificaciones(actualizadas);
    setNoLeidas(actualizadas.filter(n => !n.leido).length);
    console.log(`✅ Notificación marcada localmente. No leídas: ${actualizadas.filter(n => !n.leido).length}`);

    // Actualizar en el backend
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/admin/notifications/${id}/marcar-leida/${userId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log(`✅ Notificación actualizada en el backend`);
      } else {
        console.warn(`⚠️ Error en la respuesta del backend:`, response.status);
      }
    } catch (error) {
      console.error("❌ Error al marcar como leída en backend:", error);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    if (!userId) return;

    const key = `pitzbol_notifications_${userId}`;
    const filtradas = notificaciones.filter(n => n.id !== id);
    
    localStorage.setItem(key, JSON.stringify(filtradas));
    setNotificaciones(filtradas);
    setNoLeidas(filtradas.filter(n => !n.leido).length);

    // Eliminar en el backend
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Error al eliminar notificación en backend:", error);
    }
  };



  const getIconoNotificacion = (tipo: string) => {
    switch(tipo) {
      case 'aprobado':
        return <FiCheck className="text-green-600" size={20} />;
      case 'rechazado':
        return <FiAlertCircle className="text-red-600" size={20} />;
      case 'contacto':
        return <FiBell className="text-blue-600" size={20} />;
      case 'llamada':
        return <FiBell className="text-purple-600" size={20} />;
      case 'nueva_solicitud_negocio':
        return <FiBriefcase className="text-orange-500" size={20} />;
      default:
        return <FiBell className="text-blue-600" size={20} />;
    }
  };

  const getColorNotificacion = (tipo: string) => {
    switch(tipo) {
      case 'aprobado':
        return 'bg-green-50 border-green-100';
      case 'rechazado':
        return 'bg-red-50 border-red-100';
      case 'contacto':
        return 'bg-blue-50 border-blue-100';
      case 'llamada':
        return 'bg-purple-50 border-purple-100';
      case 'nueva_solicitud_negocio':
        return 'bg-orange-50 border-orange-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const formatearFecha = (fecha: string) => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diff = ahora.getTime() - notifFecha.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return notifFecha.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Botón de Notificaciones */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 relative hover:bg-white/50 rounded-full transition-all"
        title="Notificaciones"
      >
        <FiBell size={22} />
        
        {/* Badge de notificaciones sin leer */}
        <AnimatePresence>
          {noLeidas > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-[#F00808] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel de Notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-[120%] right-0 w-96 max-h-[600px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col z-[120] overflow-hidden"
          >
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Notificaciones</h3>
                <p className="text-white/70 text-xs font-light mt-0.5">
                  {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              {cargando && notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-[#0D601E]/20 border-t-[#0D601E] rounded-full mb-4"
                  />
                  <p className="text-gray-500 font-medium text-sm">Cargando notificaciones...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiBell size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Sin notificaciones</p>
                  <p className="text-gray-400 text-xs mt-1">Te notificaremos cuando haya actualizaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificaciones.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-l-4 ${getColorNotificacion(notif.tipo)} cursor-pointer hover:bg-opacity-75 transition-colors ${
                        !notif.leido ? 'border-l-[#F00808] bg-opacity-60' : 'border-l-gray-200'
                      }`}
                      onClick={() => {
                        marcarComoLeida(notif.id);
                        if (notif.enlace) {
                          window.location.href = notif.enlace;
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIconoNotificacion(notif.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-800">
                              {notif.titulo}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatearFecha(notif.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notif.mensaje}
                          </p>
                          {/* Botón para revisar solicitud de guía pendiente */}
                          {notif.tipo === 'solicitud_guia_pendiente' && notif.enlace && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarComoLeida(notif.id);
                                  if (typeof notif.enlace === 'string') {
                                    window.location.href = notif.enlace;
                                  }
                                }}
                                className="text-xs px-3 py-1 bg-[#0D601E] hover:bg-[#1A4D2E] rounded text-white font-bold transition-colors"
                              >
                                Revisar solicitud
                              </button>
                            </div>
                          )}
                          {!notif.leido && notif.tipo !== 'solicitud_guia_pendiente' && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarComoLeida(notif.id);
                                }}
                                className="text-xs px-2 py-1 bg-white/50 hover:bg-white rounded text-gray-600 font-medium transition-colors"
                              >
                                Marcar leída
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notif.id);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

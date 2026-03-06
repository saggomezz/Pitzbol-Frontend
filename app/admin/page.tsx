"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { enviarNotificacion } from "../../lib/notificaciones";
import { useTranslations } from 'next-intl';
import { FiFileText, FiShield, FiUser, FiX, FiPhone, FiCheck, FiAlertCircle, FiTrash2 } from "react-icons/fi";
import { FaUserTie, FaHistory, FaCheckCircle, FaHourglassHalf, FaSearch, FaEnvelope, FaPhone } from "react-icons/fa";
import AdminHistorialSolicitudesModal from "@/app/components/AdminHistorialSolicitudesModal";

type NotificationType = {
  tipo: 'exito' | 'error' | 'info';
  mensaje: string;
};

type ManagedUser = {
  uid: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  role: 'guia' | 'negociante';
};

const getBackendBaseUrl = () => {
  const rawBase = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').trim();
  const normalized = rawBase.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

export default function AdminPerfil() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    
    if (!user.uid || user.role !== "admin") {
      window.location.href = "/"; 
    }
  }, []);

  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuia, setSelectedGuia] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);
  const [notificacion, setNotificacion] = useState<NotificationType | null>(null);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [guias, setGuias] = useState<ManagedUser[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [eliminandoUid, setEliminandoUid] = useState<string | null>(null);

  useEffect(() => {
    fetchSolicitudes();
    fetchUsuariosGestionables();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('pitzbol_token') || '';
      }
      const response = await fetch(`${API_BASE}/api/admin/solicitudes-pendientes`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      
      if (!response.ok) {
        console.error("Error en respuesta:", response.status);
        return;
      }

      const data = await response.json();
      // Notificar al admin si hay nuevas solicitudes
      if ((data.solicitudes || []).length > solicitudes.length) {
        enviarNotificacion(
          'admin',
          'info',
          'Nueva solicitud de negocio',
          'Ha llegado una nueva solicitud de negocio pendiente.',
          '/admin/negocios'
        );
      }
      setSolicitudes(data.solicitudes || []);
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacion = (tipo: 'exito' | 'error' | 'info', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 5000);
  };

  const fetchUsuariosGestionables = async () => {
    setLoadingUsuarios(true);
    try {
      const API_BASE = getBackendBaseUrl();
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('pitzbol_token') || '';
      }

      const response = await fetch(`${API_BASE}/api/admin/usuarios-gestionables`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          mostrarNotificacion('error', t('adminAuthRequired'));
          setTimeout(() => {
            window.location.href = '/';
          }, 1200);
          setGuias([]);
          return;
        }
        const serverMessage = data?.msg || data?.message || data?.error;
        mostrarNotificacion('error', serverMessage || t('managedUsersLoadError'));
        setGuias([]);
        return;
      }

      setGuias(data.guias || []);
    } catch (error) {
      mostrarNotificacion('error', t('managedUsersLoadError'));
      setGuias([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleEliminarUsuario = async (usuario: ManagedUser) => {
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.correo || usuario.uid;
    const confirmar = window.confirm(
      t('confirmDeleteUser', {
        role: usuario.role === 'guia' ? t('guideSingular') : t('businessSingular'),
        user: nombreCompleto,
      })
    );

    if (!confirmar) return;

    setEliminandoUid(usuario.uid);

    try {
      const API_BASE = getBackendBaseUrl();
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('pitzbol_token') || '';
      }

      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuario.uid}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: usuario.role }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(t('adminAuthRequired'));
        }
        throw new Error(data.message || data.msg || t('userDeletedError'));
      }

      setGuias(prev => prev.filter(item => item.uid !== usuario.uid));

      mostrarNotificacion('exito', t('userDeletedSuccess'));
    } catch (error: any) {
      console.error('❌ Error al eliminar usuario:', error);
      mostrarNotificacion('error', error.message || t('userDeletedError'));
    } finally {
      setEliminandoUid(null);
    }
  };

  const handleDecision = async (uid: string, accion: 'aprobar' | 'rechazar') => {
    setProcesando(true);
    
    console.log('🔍 Procesando solicitud:', { uid, accion });
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('pitzbol_token') || '';
      }
      const response = await fetch(`${API_BASE}/api/admin/gestionar-guia`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ uid, accion })
      });

      const data = await response.json();
      console.log('📦 Respuesta del servidor:', { status: response.status, data });

      if (response.ok && data.success) {
        // Remover de la lista local
        setSolicitudes(prev => prev.filter(s => s.uid !== uid));
        setSelectedGuia(null);
        // Notificar al usuario
        enviarNotificacion(
          uid,
          accion === 'aprobar' ? 'aprobado' : 'rechazado',
          accion === 'aprobar' ? 'Negocio aprobado' : 'Negocio rechazado',
          accion === 'aprobar'
            ? '¡Tu negocio ha sido aprobado y ya es visible para los usuarios!'
            : 'Tu solicitud de negocio fue rechazada. Puedes revisar y volver a intentarlo.',
          '/negocio/estatus'
        );
        // Mostrar notificación de éxito
        mostrarNotificacion(
          'exito',
          accion === 'aprobar' 
            ? 'Guía aprobado exitosamente. El usuario ha sido notificado.' 
            : 'Solicitud rechazada. El usuario permanece como turista.'
        );
      } else {
        // Error del servidor
        console.error('❌ Error del servidor:', data);
        mostrarNotificacion('error', data.message || 'No se pudo procesar la solicitud');
        
        // Si la solicitud ya no existe, refrescar la lista
        if (response.status === 404) {
          setSelectedGuia(null);
          await fetchSolicitudes();
        }
      }
    } catch (error) {
      console.error('💥 Error al procesar solicitud:', error);
      mostrarNotificacion('error', 'Error de conexión. Verifica que el backend esté funcionando.');
    } finally {
      setProcesando(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('pitzbol_token') || '';
  }

  const [tab, setTab] = useState<'solicitudes' | 'guias'>('solicitudes');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSolicitudes = solicitudes.filter((sol) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sol["01_nombre"] || '').toLowerCase().includes(q) ||
      (sol["02_apellido"] || '').toLowerCase().includes(q) ||
      (sol["04_correo"] || '').toLowerCase().includes(q)
    );
  });

  const filteredGuias = guias.filter((guia) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${guia.nombre || ''} ${guia.apellido || ''}`.toLowerCase().includes(q) ||
      (guia.correo || '').toLowerCase().includes(q)
    );
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin"></div>
          <FaUserTie className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
        </div>
        <p className="text-gray-600 font-medium">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0D601E] to-[#1A4D2E] p-4 rounded-2xl shadow-lg">
              <FaUserTie className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A4D2E] flex items-center gap-2">
                {t('title')}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-[#0D601E]/20 text-[#0D601E] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              onClick={() => window.location.href = '/admin/mensajes'}
            >
              <FaEnvelope /> {t('messages')}
            </button>
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-[#0D601E]/20 text-[#0D601E] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              onClick={() => setShowHistorialModal(true)}
            >
              <FaHistory /> {t('history')}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === 'solicitudes'
                ? 'bg-[#EAB308] text-black scale-105 shadow-lg font-extrabold'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105'
            }`}
            onClick={() => setTab('solicitudes')}
          >
            <FaHourglassHalf /> {t('pendingRequests')} ({solicitudes.length})
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center gap-2 ${
              tab === 'guias'
                ? 'bg-[#0D601E] text-white scale-105 shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105'
            }`}
            onClick={() => setTab('guias')}
          >
            <FaCheckCircle /> {t('guidesListTitle')} ({guias.length})
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={tab === 'solicitudes' ? 'Buscar solicitudes por nombre o correo...' : 'Buscar guías por nombre o correo...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#0D601E]/20 focus:border-[#0D601E] focus:outline-none bg-white shadow-md text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
        </motion.div>

        {/* Tab: Solicitudes Pendientes */}
        {tab === 'solicitudes' && (
          <>
            {solicitudes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] rounded-2xl border-2 border-[#0D601E]/50 shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                      <FaHourglassHalf className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">{t('pendingRequests')}</h2>
                      <p className="text-white/90 text-sm font-semibold mt-1">Tienes {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} pendiente{solicitudes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                      <span className="text-white font-black text-2xl">{solicitudes.length}</span>
                      <p className="text-white/80 text-xs font-semibold">Pendientes</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {filteredSolicitudes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 flex flex-col items-center gap-4"
              >
                <div className="bg-white p-8 rounded-full shadow-lg">
                  <FaUserTie className="text-gray-300 text-6xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">{t('noRequests')}</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Intenta con otra búsqueda' : 'No hay solicitudes pendientes'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredSolicitudes.map((sol, index) => (
                    <motion.div
                      key={sol.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                      onClick={() => setSelectedGuia(sol)}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent hover:border-[#0D601E]/20 cursor-pointer"
                    >
                      {/* Header con foto */}
                      <div className="relative h-32 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center overflow-hidden">
                        {sol["13_foto_rostro"] ? (
                          <div className="relative w-full h-full">
                            <img
                              src={sol["13_foto_rostro"]}
                              alt={`${sol["01_nombre"]} ${sol["02_apellido"]}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <FiUser className="text-[#0D601E]/30 text-6xl mb-2" />
                            <span className="text-xs text-gray-400 font-medium">Sin foto</span>
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaHourglassHalf />{t('pendingReview')}
                          </motion.span>
                        </div>
                        {/* Biometric Badge */}
                        {sol.validacion_biometrica && (
                          <div className="absolute top-3 left-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                              sol.validacion_biometrica.coincide
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              🔐 {sol.validacion_biometrica.porcentaje || 0}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-xl text-[#1A4D2E] mb-1 line-clamp-1">
                          {sol["01_nombre"] || t('noName')} {sol["02_apellido"] || ''}
                        </h3>

                        <div className="space-y-2 text-xs mb-4 mt-3">
                          {sol["04_correo"] && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <FaEnvelope className="text-[#0D601E]" />
                              <span className="truncate">{sol["04_correo"]}</span>
                            </div>
                          )}
                          {sol["06_telefono"] && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <FaPhone className="text-[#0D601E]" />
                              <span>{sol["06_telefono"]}</span>
                            </div>
                          )}
                          {sol["05_rfc"] && (
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-lg">
                              <FiShield className="text-[#0D601E]" />
                              <span className="font-medium">RFC: {sol["05_rfc"]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        {/* Tab: Guías Gestionados */}
        {tab === 'guias' && (
          <>
            {loadingUsuarios ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin"></div>
                  <FaUserTie className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0D601E] text-xl" />
                </div>
                <p className="text-gray-600 font-medium">{t('loadingManagedUsers')}</p>
              </motion.div>
            ) : filteredGuias.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 flex flex-col items-center gap-4"
              >
                <div className="bg-white p-8 rounded-full shadow-lg">
                  <FaUserTie className="text-gray-300 text-6xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">{t('noGuidesToManage')}</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Intenta con otra búsqueda' : 'No hay guías registrados'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredGuias.map((guia, index) => (
                    <motion.div
                      key={guia.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-transparent hover:border-[#0D601E]/20"
                    >
                      <div className="relative h-20 bg-gradient-to-br from-[#0D601E]/5 to-[#1A4D2E]/10 flex items-center justify-center">
                        <div className="absolute top-3 right-3">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                          >
                            <FaCheckCircle />Activo
                          </motion.span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-xl text-[#1A4D2E] mb-1 line-clamp-1">
                          {`${guia.nombre || ''} ${guia.apellido || ''}`.trim() || t('noName')}
                        </h3>

                        <div className="space-y-2 text-xs mb-4 mt-3">
                          {guia.correo && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <FaEnvelope className="text-[#0D601E]" />
                              <span className="truncate">{guia.correo}</span>
                            </div>
                          )}
                          {guia.telefono && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <FaPhone className="text-[#0D601E]" />
                              <span>{guia.telefono}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => handleEliminarUsuario(guia)}
                            disabled={eliminandoUid === guia.uid}
                            className="px-4 py-2 rounded-xl bg-red-50 border-2 border-red-100 text-red-500 hover:bg-red-100 text-xs font-bold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105"
                          >
                            <FiTrash2 size={14} />
                            {eliminandoUid === guia.uid ? tCommon('processing') : t('deleteUser')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Detalle del Guía */}
      <AnimatePresence>
        {selectedGuia && (
          <div className="fixed inset-0 top-22 z-[500] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/10 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-4xl h-[95vh] md:h-[85vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <button onClick={() => setSelectedGuia(null)} className="text-gray-400 hover:text-gray-800 flex items-center gap-2 text-sm font-light">
                  <FiX /> {t('closeReview')}
                </button>
                <div className="text-right">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">{t('pendingReview')}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                  {/* Perfil y Rostro */}
                  <div className="w-full md:w-1/3 flex flex-col items-center space-y-6">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-gray-50 shadow-sm">
                      <img src={selectedGuia["13_foto_rostro"]} className="w-full h-full object-cover" alt="Rostro" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-medium text-gray-800">{selectedGuia["01_nombre"]} {selectedGuia["02_apellido"]}</h4>
                      <p className="text-gray-400 font-light text-sm">{selectedGuia["05_rfc"]}</p>
                    </div>
                  </div>

                  {/* Documentos Identificación y Validación */}
                  <div className="w-full md:w-2/3 space-y-8">
                    
                    {/* Resultado de Validación Biométrica (IA) */}
                    <div className={`p-6 rounded-[28px] border-2 ${selectedGuia.validacion_biometrica?.coincide ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedGuia.validacion_biometrica?.coincide ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <FiShield size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('identityAnalysis')}</p>
                          <h4 className={`text-lg font-bold ${selectedGuia.validacion_biometrica?.coincide ? 'text-green-700' : 'text-red-700'}`}>
                            {selectedGuia.validacion_biometrica?.coincide ? t('identityConfirmed') : t('possibleImpersonation')}
                          </h4>
                          <p className="text-xs text-gray-500 italic">
                            {t('facialMatch', { percentage: selectedGuia.validacion_biometrica?.porcentaje || "0" })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fotos de Identificación */}
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-300 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        <FiFileText /> {t('officialId')}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Frente */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-400 uppercase font-bold pl-2">{t('front')}</p>
                          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center min-h-[150px]">
                            {selectedGuia["11_foto_frente"] ? (
                              <img src={selectedGuia["11_foto_frente"]} className="w-full h-auto" alt="INE Frente" />
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">{t('imageNotAvailable')}</p>
                            )}
                          </div>
                        </div>

                        {/* Reverso */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-400 uppercase font-bold pl-2">{t('back')}</p>
                          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center min-h-[150px]">
                            {selectedGuia["12_foto_reverso"] ? (
                              <img src={selectedGuia["12_foto_reverso"]} className="w-full h-auto" alt="INE Reverso" />
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">{t('imageNotAvailable')}</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                    {/* Información de Contacto */}
                    <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-4">{t('contactInfo')}</p>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-gray-400">
                            <FiPhone size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{t('contactPhone')}</p>
                            <p className="text-gray-700 font-medium">{selectedGuia["06_telefono"]}</p>
                          </div>
                        </div>
                        {/* El espacio para Stripe .................... */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/50">
                <button 
                  onClick={() => handleDecision(selectedGuia.uid, 'rechazar')}
                  disabled={procesando}
                  className="flex-1 py-4 bg-white text-red-400 rounded-2xl text-sm font-medium border border-red-50 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                      />
                      {tCommon('processing')}
                    </>
                  ) : (
                    <>
                      <FiX size={18} />
                      {t('rejectRegistration')}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleDecision(selectedGuia.uid, 'aprobar')}
                  disabled={procesando}
                  className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-sm font-medium shadow-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      {tCommon('processing')}
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      {t('approveAsGuide')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sistema de Notificaciones */}
      <AnimatePresence>
        {notificacion && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-8 right-8 z-[600] max-w-md"
          >
            <div className={`rounded-[24px] shadow-2xl p-6 border-4 border-white ${
              notificacion.tipo === 'exito' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : notificacion.tipo === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center"
                  >
                    {notificacion.tipo === 'exito' ? (
                      <FiCheck className="text-green-600" size={24} strokeWidth={3} />
                    ) : notificacion.tipo === 'error' ? (
                      <FiAlertCircle className="text-red-600" size={24} strokeWidth={3} />
                    ) : (
                      <FiShield className="text-blue-600" size={24} strokeWidth={3} />
                    )}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {notificacion.tipo === 'exito' ? t('successOperation') : 
                     notificacion.tipo === 'error' ? t('errorOperation') : 
                     t('information')}
                  </h3>
                  <p className="text-white/90 text-sm font-medium leading-relaxed">
                    {notificacion.mensaje}
                  </p>
                </div>
                <button
                  onClick={() => setNotificacion(null)}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminHistorialSolicitudesModal open={showHistorialModal} onClose={() => setShowHistorialModal(false)} token={token} />
    </div>
  );
}
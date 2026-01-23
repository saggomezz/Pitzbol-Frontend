"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { enviarNotificacion } from "../../lib/notificaciones";
import { FiChevronRight, FiFileText, FiLogOut, FiShield, FiUser, FiX, FiPhone, FiCheck, FiAlertCircle } from "react-icons/fi";
import AdminHistorialSolicitudesModal from "@/app/components/AdminHistorialSolicitudesModal";

type NotificationType = {
  tipo: 'exito' | 'error' | 'info';
  mensaje: string;
};

export default function AdminPerfil() {
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

  useEffect(() => {
    fetchSolicitudes();
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFCF9] font-light text-gray-400 italic">
      Sincronizando panel de control...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col">
      <header className="px-8 py-10 max-w-6xl mx-auto w-full flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-gray-800 tracking-tight">Panel de administración</h1>
          <p className="text-gray-400 text-sm font-light">Validación de nuevos perfiles Pitzbol</p>
        </div>
        <button onClick={() => setShowHistorialModal(true)} className="p-3 text-[#0D601E] hover:text-[#F00808] transition-colors">
          <FiFileText size={20} />
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-8 pb-20">
        <div className="grid grid-cols-1 gap-12">
          {/* Sección de Solicitudes */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center text-xs font-bold">
                {solicitudes.length}
              </span>
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-widest">Solicitudes en espera</h2>
            </div>

            {solicitudes.length === 0 ? (
              <div className="bg-white rounded-[35px] border border-gray-100 p-20 text-center">
                <FiShield className="mx-auto text-gray-100 mb-4" size={48} />
                <p className="text-gray-300 font-light italic">No hay guías pendientes por el momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitudes.map((sol) => (
                  <motion.div 
                    layoutId={sol.uid}
                    key={sol.uid}
                    onClick={() => setSelectedGuia(sol)}
                    className="bg-white p-6 rounded-[28px] border border-gray-100 hover:border-green-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-green-600 transition-colors">
                        {sol["13_foto_rostro"] ? (
                          <img 
                            src={sol["13_foto_rostro"]} 
                            alt="Miniatura" 
                            className="w-full h-full object-cover rounded-2xl" 
                          />
                        ) : (
                          <FiUser size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-gray-700 font-medium">
                          {(sol["01_nombre"] || "Sin nombre")} {(sol["02_apellido"] || "")}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-light italic">
                          {sol["04_correo"] || "Sin correo registrado"}
                        </p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-200 group-hover:text-green-600 transition-all" />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

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
                  <FiX /> Cerrar revisión
                </button>
                <div className="text-right">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Revisión pendiente</span>
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
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Análisis de Identidad</p>
                          <h4 className={`text-lg font-bold ${selectedGuia.validacion_biometrica?.coincide ? 'text-green-700' : 'text-red-700'}`}>
                            {selectedGuia.validacion_biometrica?.coincide ? 'Identidad Confirmada' : 'Posible Suplantación'}
                          </h4>
                          <p className="text-xs text-gray-500 italic">
                            Coincidencia facial del {selectedGuia.validacion_biometrica?.porcentaje || "0"}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fotos de Identificación */}
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-300 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        <FiFileText /> Credencial oficial (INE)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Frente */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-400 uppercase font-bold pl-2">Frente</p>
                          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center min-h-[150px]">
                            {selectedGuia["11_foto_frente"] ? (
                              <img src={selectedGuia["11_foto_frente"]} className="w-full h-auto" alt="INE Frente" />
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">Imagen no disponible</p>
                            )}
                          </div>
                        </div>

                        {/* Reverso */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-400 uppercase font-bold pl-2">Reverso</p>
                          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center min-h-[150px]">
                            {selectedGuia["12_foto_reverso"] ? (
                              <img src={selectedGuia["12_foto_reverso"]} className="w-full h-auto" alt="INE Reverso" />
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">Imagen no disponible</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                    {/* Información de Contacto */}
                    <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-4">Información de Contacto</p>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-gray-400">
                            <FiPhone size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Teléfono de contacto</p>
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
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiX size={18} />
                      Rechazar registro
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
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      Aprobar como guía oficial
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
                    {notificacion.tipo === 'exito' ? '¡Operación Exitosa!' : 
                     notificacion.tipo === 'error' ? 'Error en la Operación' : 
                     'Información'}
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
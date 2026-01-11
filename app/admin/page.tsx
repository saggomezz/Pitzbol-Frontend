"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiChevronRight, FiFileText, FiLogOut, FiShield, FiUser, FiX, FiPhone } from "react-icons/fi";

export default function AdminPerfil() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuia, setSelectedGuia] = useState<any>(null);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/solicitudes-pendientes');
      
      if (!response.ok) {
        console.error("Error en respuesta:", response.status);
        return;
      }

      const data = await response.json();
      setSolicitudes(data.solicitudes || []);
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (uid: string, accion: 'aprobar' | 'rechazar') => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/gestionar-guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, accion })
      });

      if (response.ok) {
        setSolicitudes(prev => prev.filter(s => s.uid !== uid));
        setSelectedGuia(null);
      }
    } catch (error) {
      alert("Error al procesar la solicitud");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

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
        <button onClick={handleLogout} className="p-3 text-gray-300 hover:text-red-400 transition-colors">
          <FiLogOut size={20} />
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
                  className="flex-1 py-4 bg-white text-red-400 rounded-2xl text-sm font-light border border-red-50 hover:bg-red-50 transition-all"
                >
                  Rechazar registro
                </button>
                <button 
                  onClick={() => handleDecision(selectedGuia.uid, 'aprobar')}
                  className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-sm font-medium shadow-sm hover:bg-green-700 transition-all"
                >
                  Aprobar como guía oficial
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
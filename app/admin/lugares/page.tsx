"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiImage, FiTrash2, FiMapPin, FiSearch, FiUpload, FiLink } from "react-icons/fi";
import Papa from "papaparse";
import dynamic from "next/dynamic";
import { fetchWithAuth } from "../../../lib/fetchWithAuth";
import { getBackendOrigin } from "@/lib/backendUrl";

// Importar minimapa dinámicamente para evitar problemas con SSR
const MinimapaLocationPicker = dynamic(
  () => import("../../components/MinimapaLocationPicker"),
  { ssr: false }
);

interface Lugar {
  id?: string;
  nombre: string;
  categoria?: string;
  ubicacion?: string;
  fotos?: string[];
  latitud?: string;
  longitud?: string;
  descripcion?: string;
}

export default function AdminLugaresPage() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    
    const role = (user.role || "").toLowerCase();
    if (!user.uid || (role !== "admin" && role !== "admins")) {
      window.location.href = "/";
    }
  }, []);

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fotosUrl, setFotosUrl] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState({
    nombre: '',
    categoria: '',
    ubicacion: '',
    latitud: '',
    longitud: '',
    descripcion: ''
  });
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [editPlaceData, setEditPlaceData] = useState<Partial<Lugar>>({});
  const [buscandoCoordenadasEdicion, setBuscandoCoordenadasEdicion] = useState(false);

  // Categorías del sistema (igual que en mapa/page.tsx y placeImages.ts)
  const categoriasSistema = [
    'Fútbol',
    'Gastronomía',
    'Arte',
    'Cultura',
    'Eventos',
    'Casas de Cambio',
    'Hospitales',
    'Médico'
  ];

  // Función para obtener coordenadas usando el endpoint del backend (evita problemas de CORS)
  const buscarCoordenadas = async (direccion: string) => {
    if (!direccion.trim()) return;

    setBuscandoCoordenadas(true);
    try {
      // Usar el endpoint del backend que hace la geocodificación
      const response = await fetch(`/api/lugares/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direccion: direccion.trim() })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del servidor:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.latitud && data.longitud) {
        setNuevoLugar(prev => ({
          ...prev,
          latitud: data.latitud,
          longitud: data.longitud
        }));
        mostrarNotificacion('exito', `Coordenadas encontradas: ${parseFloat(data.latitud).toFixed(6)}, ${parseFloat(data.longitud).toFixed(6)}`);
      } else {
        mostrarNotificacion('error', data.message || 'No se encontraron coordenadas para esta dirección');
      }
    } catch (error: any) {
      console.error('Error buscando coordenadas:', error);
      mostrarNotificacion('error', `Error de conexión: ${error.message || 'No se pudo conectar al servicio'}`);
    } finally {
      setBuscandoCoordenadas(false);
    }
  };

  const BACKEND_URL = getBackendOrigin();

  useEffect(() => {
    fetchLugares();
  }, []);

  const mostrarNotificacion = (tipo: 'exito' | 'error', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 5000);
  };

  // Buscar coordenadas cuando cambie la ubicación (con debounce)
  useEffect(() => {
    if (!nuevoLugar.ubicacion.trim() || nuevoLugar.latitud || nuevoLugar.longitud) {
      return; // No buscar si está vacío o ya hay coordenadas
    }

    const timer = setTimeout(() => {
      if (nuevoLugar.ubicacion.trim().length > 10) { // Solo buscar si la dirección tiene al menos 10 caracteres
        buscarCoordenadas(nuevoLugar.ubicacion);
      }
    }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [nuevoLugar.ubicacion]);

  const fetchLugares = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar lugares del CSV (fuente principal)
      const csvResponse = await fetch("/datosLugares.csv");
      const csvText = await csvResponse.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: async (results) => {
          const lugaresCSV = results.data
            .filter((row: any) => row["Nombre del Lugar"])
            .map((row: any) => {
              const nombre = String(row["Nombre del Lugar"] || "").trim();
              const categoria = String(row["Categoría"] || "").trim();
              const categoriaPrimera = categoria.split(",")[0].trim();
              
              return {
                nombre,
                categoria: categoriaPrimera,
                descripcion: String(row["Nota para IA"] || "").trim(),
                ubicacion: String(row["Dirección"] || "").trim(),
                latitud: String(row["Latitud"] || "").replace(",", ".").trim(),
                longitud: String(row["Longitud"] || "").replace(",", ".").trim(),
                fotos: [] // Se llenará desde Firestore
              };
            })
            .filter((lugar: Lugar) => lugar.nombre !== "");
          
          console.log("📊 Lugares del CSV:", lugaresCSV.length);
          
          // 2. Obtener fotos guardadas de Firestore para cada lugar
          try {
            const firestoreResponse = await fetch(`/api/lugares`);
            if (firestoreResponse.ok) {
              const firestoreData = await firestoreResponse.json();
              const lugaresConFotos = firestoreData.lugares || [];
              
              // Crear un mapa de fotos por nombre
              const fotosMap: Record<string, string[]> = {};
              lugaresConFotos.forEach((lugar: any) => {
                if (lugar.nombre && lugar.fotos) {
                  fotosMap[lugar.nombre] = lugar.fotos;
                }
              });
              
              // Combinar lugares del CSV con fotos de Firestore
              const lugaresCombinados = lugaresCSV.map(lugar => ({
                ...lugar,
                fotos: fotosMap[lugar.nombre] || []
              }));
              
              // Agregar lugares que solo están en Firestore (creados manualmente)
              lugaresConFotos.forEach((lugarFirestore: any) => {
                const nombreFirestore = lugarFirestore.nombre;
                if (!nombreFirestore) return;
                const existeEnCSV = lugaresCombinados.some(l => l.nombre === nombreFirestore);
                if (!existeEnCSV) {
                  lugaresCombinados.push({
                    nombre: nombreFirestore,
                    categoria: lugarFirestore.categoria || '',
                    ubicacion: lugarFirestore.ubicacion || '',
                    latitud: lugarFirestore.latitud || '',
                    longitud: lugarFirestore.longitud || '',
                    descripcion: lugarFirestore.descripcion || '',
                    fotos: lugarFirestore.fotos || []
                  });
                }
              });
              
              console.log("✅ Lugares combinados con fotos:", lugaresCombinados.length);
              setLugares(lugaresCombinados);
            } else {
              // Si Firestore falla, usar solo CSV
              setLugares(lugaresCSV);
            }
          } catch (error) {
            console.error("Error obteniendo fotos de Firestore:", error);
            // Usar solo lugares del CSV si Firestore falla
            setLugares(lugaresCSV);
          }
        }
      });
    } catch (error) {
      console.error("Error obteniendo lugares:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalFotos = (lugar: Lugar) => {
    setSelectedPlace(lugar);
    setFotosUrl(lugar.fotos || []);
    setUrlInput("");
    // Inicializar datos editables del lugar
    setEditPlaceData({
      nombre: lugar.nombre,
      categoria: lugar.categoria || '',
      ubicacion: lugar.ubicacion || '',
      latitud: lugar.latitud || '',
      longitud: lugar.longitud || '',
      descripcion: lugar.descripcion || ''
    });
    setShowPhotoModal(true);
  };

  const agregarUrl = () => {
    if (urlInput.trim() && urlInput.startsWith('http')) {
      setFotosUrl(prev => [...prev, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const eliminarUrl = (index: number) => {
    setFotosUrl(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPlace) return;

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('fotos', file);
      });

      const token = localStorage.getItem('pitzbol_token');
      const response = await fetchWithAuth(`/api/lugares/${encodeURIComponent(selectedPlace.nombre)}/fotos`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        mostrarNotificacion('exito', `${data.message || 'Fotos agregadas correctamente'}`);
        await fetchLugares();
        abrirModalFotos({ ...selectedPlace, fotos: data.lugar?.fotos || selectedPlace.fotos });
      } else {
        const error = await response.json();
        mostrarNotificacion('error', error.message || 'Error al subir fotos');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error de conexión');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const guardarFotosUrl = async () => {
    if (!selectedPlace || fotosUrl.length === 0) return;

    setUploading(true);

    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetchWithAuth(`/api/lugares/${encodeURIComponent(selectedPlace.nombre)}/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotosUrl })
      });

      if (response.ok) {
        const data = await response.json();
        mostrarNotificacion('exito', `${data.message || 'Fotos guardadas correctamente'}`);
        await fetchLugares();
        abrirModalFotos({ ...selectedPlace, fotos: data.lugar?.fotos || fotosUrl });
      } else {
        const error = await response.json();
        mostrarNotificacion('error', error.message || 'Error al guardar fotos');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const eliminarFoto = async (index: number) => {
    if (!selectedPlace) return;

    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetchWithAuth(`/api/lugares/${encodeURIComponent(selectedPlace.nombre)}/fotos/${index}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mostrarNotificacion('exito', 'Foto eliminada correctamente');
        await fetchLugares();
        const fotosActualizadas = [...(selectedPlace.fotos || [])];
        fotosActualizadas.splice(index, 1);
        abrirModalFotos({ ...selectedPlace, fotos: fotosActualizadas });
      } else {
        const error = await response.json();
        mostrarNotificacion('error', error.message || 'Error al eliminar foto');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error de conexión');
    }
  };

  // Buscar coordenadas para el lugar en edición
  const buscarCoordenadasEdicion = async (direccion: string) => {
    if (!direccion.trim() || !selectedPlace) return;

    setBuscandoCoordenadasEdicion(true);
    try {
      const response = await fetch(`/api/lugares/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direccion: direccion.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.latitud && data.longitud) {
          setEditPlaceData(prev => ({
            ...prev,
            latitud: data.latitud,
            longitud: data.longitud
          }));
          mostrarNotificacion('exito', `Coordenadas encontradas: ${parseFloat(data.latitud).toFixed(6)}, ${parseFloat(data.longitud).toFixed(6)}`);
        } else {
          mostrarNotificacion('error', data.message || 'No se encontraron coordenadas para esta dirección');
        }
      }
    } catch (error: any) {
      console.error('Error buscando coordenadas:', error);
      mostrarNotificacion('error', `Error de conexión: ${error.message || 'No se pudo conectar al servicio'}`);
    } finally {
      setBuscandoCoordenadasEdicion(false);
    }
  };

  // Actualizar datos del lugar
  const actualizarDatosLugar = async () => {
    if (!selectedPlace || !editPlaceData.nombre) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetchWithAuth(`/api/lugares/${encodeURIComponent(selectedPlace.nombre)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editPlaceData.nombre,
          categoria: editPlaceData.categoria,
          ubicacion: editPlaceData.ubicacion,
          latitud: editPlaceData.latitud,
          longitud: editPlaceData.longitud,
          descripcion: editPlaceData.descripcion
        })
      });

      if (response.ok) {
        mostrarNotificacion('exito', 'Datos del lugar actualizados correctamente');
        await fetchLugares();
        // Actualizar selectedPlace con los nuevos datos
        const lugarActualizado = {
          ...selectedPlace,
          ...editPlaceData
        };
        setSelectedPlace(lugarActualizado);
      } else {
        const error = await response.json();
        mostrarNotificacion('error', error.message || 'Error al actualizar datos');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const crearLugar = async () => {
    if (!nuevoLugar.nombre.trim()) {
      mostrarNotificacion('error', 'El nombre del lugar es requerido');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetchWithAuth(`/api/lugares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoLugar)
      });

      if (response.ok) {
        const data = await response.json();
        mostrarNotificacion('exito', `Lugar "${data.lugar.nombre}" creado correctamente`);
        await fetchLugares();
        setShowCreateModal(false);
        setNuevoLugar({
          nombre: '',
          categoria: '',
          ubicacion: '',
          latitud: '',
          longitud: '',
          descripcion: ''
        });
      } else {
        const error = await response.json();
        mostrarNotificacion('error', error.message || 'Error al crear lugar');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const lugaresFiltrados = lugares.filter(lugar =>
    (lugar.nombre || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A4D2E] mx-auto"></div>
          <p className="mt-4 text-[#769C7B]">Cargando lugares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#1A4D2E] uppercase mb-2" style={{ fontFamily: 'var(--font-jockey)' }}>
              Gestión de Lugares
            </h1>
            <p className="text-[#769C7B]">Administra y agrega fotos a los lugares existentes</p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A4D2E] text-white rounded-full hover:bg-[#0D601E] transition-colors font-bold shadow-lg"
          >
            <FiPlus size={20} />
            Agregar Lugar
          </motion.button>
        </div>

        {/* BUSCADOR */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#769C7B]" size={20} />
            <input
              type="text"
              placeholder="Buscar lugar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E]"
            />
          </div>
        </div>

        {/* LISTA DE LUGARES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lugaresFiltrados.map((lugar) => (
            <motion.div
              key={lugar.id || lugar.nombre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => abrirModalFotos(lugar)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1A4D2E] mb-1">{lugar.nombre}</h3>
                  {lugar.categoria && (
                    <span className="inline-block px-3 py-1 bg-[#0D601E]/10 text-[#0D601E] rounded-full text-xs font-bold uppercase">
                      {lugar.categoria}
                    </span>
                  )}
                </div>
                <button className="p-2 hover:bg-[#F6F0E6] rounded-full transition-colors">
                  <FiImage className="text-[#769C7B]" size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <FiMapPin size={14} />
                <span>{lugar.ubicacion || "Sin ubicación"}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#769C7B]">
                <FiImage size={14} />
                <span>{lugar.fotos?.length || 0} foto(s)</span>
              </div>
            </motion.div>
          ))}

          {lugaresFiltrados.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FiMapPin size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron lugares' : 'No hay lugares registrados'}
              </p>
            </div>
          )}
        </div>

        {/* MODAL PARA AGREGAR FOTOS */}
        <AnimatePresence>
          {showPhotoModal && selectedPlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPhotoModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER MODAL */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
                      {selectedPlace.nombre}
                    </h2>
                    <p className="text-sm text-[#769C7B] mt-1">Agregar o gestionar fotos</p>
                  </div>
                  <button
                    onClick={() => setShowPhotoModal(false)}
                    className="p-2 hover:bg-[#F6F0E6] rounded-full transition-colors"
                  >
                    <FiX size={24} className="text-gray-600" />
                  </button>
                </div>

                {/* CONTENIDO MODAL */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  {/* EDITAR DATOS DEL LUGAR */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h3 className="text-lg font-bold text-[#1A4D2E] mb-4 flex items-center gap-2">
                      <FiMapPin size={20} />
                      Editar Datos del Lugar
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Nombre del Lugar <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editPlaceData.nombre || ''}
                          onChange={(e) => setEditPlaceData({ ...editPlaceData, nombre: e.target.value })}
                          className="w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E]"
                        />
                      </div>

                      {/* Categoría */}
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Categoría
                        </label>
                        <select
                          value={editPlaceData.categoria || ''}
                          onChange={(e) => setEditPlaceData({ ...editPlaceData, categoria: e.target.value })}
                          className="w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E] bg-white"
                        >
                          <option value="">Selecciona una categoría</option>
                          {categoriasSistema.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ubicación */}
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Dirección / Ubicación
                        </label>
                        <input
                          type="text"
                          value={editPlaceData.ubicacion || ''}
                          onChange={(e) => {
                            setEditPlaceData({ 
                              ...editPlaceData, 
                              ubicacion: e.target.value,
                              latitud: '', // Limpiar coordenadas si cambia la dirección
                              longitud: ''
                            });
                          }}
                          className="w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E]"
                        />
                        {editPlaceData.ubicacion && !buscandoCoordenadasEdicion && !editPlaceData.latitud && (
                          <button
                            type="button"
                            onClick={() => buscarCoordenadasEdicion(editPlaceData.ubicacion || '')}
                            className="mt-2 text-xs text-[#1A4D2E] hover:text-[#0D601E] font-medium underline"
                          >
                            Buscar coordenadas automáticamente
                          </button>
                        )}
                      </div>

                      {/* Latitud y Longitud */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                            Latitud {editPlaceData.latitud && <span className="text-green-600 text-xs">✓</span>}
                          </label>
                          <input
                            type="text"
                            value={editPlaceData.latitud || ''}
                            onChange={(e) => setEditPlaceData({ ...editPlaceData, latitud: e.target.value })}
                            className={`w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E] ${editPlaceData.latitud ? 'bg-green-50' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                            Longitud {editPlaceData.longitud && <span className="text-green-600 text-xs">✓</span>}
                          </label>
                          <input
                            type="text"
                            value={editPlaceData.longitud || ''}
                            onChange={(e) => setEditPlaceData({ ...editPlaceData, longitud: e.target.value })}
                            className={`w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E] ${editPlaceData.longitud ? 'bg-green-50' : ''}`}
                          />
                      </div>
                    </div>

                      {/* Minimapa para ajustar ubicación */}
                      {(editPlaceData.latitud && editPlaceData.longitud) && (
                        <div>
                          <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                            Ajustar Ubicación en el Mapa
                          </label>
                          <MinimapaLocationPicker
                            latitud={editPlaceData.latitud}
                            longitud={editPlaceData.longitud}
                            onLocationChange={(lat, lng) => {
                              setEditPlaceData({
                                ...editPlaceData,
                                latitud: lat,
                                longitud: lng
                              });
                            }}
                            height="300px"
                          />
                        </div>
                      )}

                      {/* Descripción */}
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Descripción / Nota para IA
                        </label>
                        <textarea
                          value={editPlaceData.descripcion || ''}
                          onChange={(e) => setEditPlaceData({ ...editPlaceData, descripcion: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-[#1A4D2E]/20 rounded-xl outline-none focus:border-[#0D601E] text-[#1A4D2E] resize-none"
                        />
                      </div>

                      {/* Botón guardar datos */}
                      <button
                        onClick={actualizarDatosLugar}
                        disabled={uploading || !editPlaceData.nombre?.trim()}
                        className="w-full py-2 bg-[#1A4D2E] text-white rounded-full hover:bg-[#0D601E] transition-colors font-bold disabled:opacity-50"
                      >
                        {uploading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="mb-6 border-t border-gray-200"></div>

                  {/* FOTOS EXISTENTES */}
                  {fotosUrl.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-[#1A4D2E] mb-4">Fotos Actuales</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {fotosUrl.map((foto, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={foto}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl"
                            />
                            <button
                              onClick={() => eliminarFoto(index)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AGREGAR URL */}
                  <div className="mb-6 p-4 bg-[#F6F0E6] rounded-2xl">
                    <h3 className="text-lg font-bold text-[#1A4D2E] mb-3 flex items-center gap-2">
                      <FiLink size={20} />
                      Agregar URL de Imagen
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && agregarUrl()}
                        className="flex-1 px-4 py-2 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] text-[#1A4D2E]"
                      />
                      <button
                        onClick={agregarUrl}
                        className="px-6 py-2 bg-[#0D601E] text-white rounded-full hover:bg-[#094d18] transition-colors font-bold"
                      >
                        Agregar
                      </button>
                    </div>
                    {fotosUrl.length > 0 && (
                      <button
                        onClick={guardarFotosUrl}
                        disabled={uploading}
                        className="mt-3 w-full py-2 bg-[#1A4D2E] text-white rounded-full hover:bg-[#0D601E] transition-colors font-bold disabled:opacity-50"
                      >
                        {uploading ? 'Guardando...' : 'Guardar URLs'}
                      </button>
                    )}
                  </div>

                  {/* SUBIR ARCHIVOS */}
                  <div className="p-4 bg-[#F6F0E6] rounded-2xl">
                    <h3 className="text-lg font-bold text-[#1A4D2E] mb-3 flex items-center gap-2">
                      <FiUpload size={20} />
                      Subir Imágenes
                    </h3>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="border-2 border-dashed border-[#1A4D2E]/30 rounded-xl p-8 text-center hover:border-[#0D601E] transition-colors">
                        <FiUpload size={32} className="mx-auto text-[#769C7B] mb-2" />
                        <p className="text-[#1A4D2E] font-medium">
                          {uploading ? 'Subiendo...' : 'Haz clic para seleccionar imágenes'}
                        </p>
                        <p className="text-sm text-[#769C7B] mt-1">
                          Máximo 10 imágenes (JPG, PNG, WebP)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL PARA CREAR NUEVO LUGAR */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER MODAL */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>
                      Agregar Nuevo Lugar
                    </h2>
                    <p className="text-sm text-[#769C7B] mt-1">Completa los datos del lugar</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-[#F6F0E6] rounded-full transition-colors"
                  >
                    <FiX size={24} className="text-gray-600" />
                  </button>
                </div>

                {/* CONTENIDO MODAL */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                        Nombre del Lugar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nuevoLugar.nombre}
                        onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })}
                        placeholder="Ej: Catedral Metropolitana"
                        className="w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E]"
                      />
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                        Categoría
                      </label>
                      <select
                        value={nuevoLugar.categoria}
                        onChange={(e) => setNuevoLugar({ ...nuevoLugar, categoria: e.target.value })}
                        className="w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E] bg-white cursor-pointer"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categoriasSistema.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                        Dirección / Ubicación
                        {buscandoCoordenadas && (
                          <span className="ml-2 text-xs text-[#769C7B] font-normal">
                            (Buscando coordenadas...)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={nuevoLugar.ubicacion}
                        onChange={(e) => {
                          setNuevoLugar({ 
                            ...nuevoLugar, 
                            ubicacion: e.target.value,
                            latitud: '', // Limpiar coordenadas si cambia la dirección
                            longitud: ''
                          });
                        }}
                        placeholder="Ej: C. Damián Carmona 54, La Penal, 44730 Guadalajara, Jal."
                        className="w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E]"
                      />
                      {nuevoLugar.ubicacion && !buscandoCoordenadas && !nuevoLugar.latitud && (
                        <button
                          type="button"
                          onClick={() => buscarCoordenadas(nuevoLugar.ubicacion)}
                          className="mt-2 text-xs text-[#1A4D2E] hover:text-[#0D601E] font-medium underline"
                        >
                          Buscar coordenadas automáticamente
                        </button>
                      )}
                    </div>

                    {/* Latitud y Longitud */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Latitud {nuevoLugar.latitud && <span className="text-green-600 text-xs">✓</span>}
                        </label>
                        <input
                          type="text"
                          value={nuevoLugar.latitud}
                          onChange={(e) => setNuevoLugar({ ...nuevoLugar, latitud: e.target.value })}
                          placeholder="Ej: 20.6597"
                          readOnly={!!nuevoLugar.latitud && buscandoCoordenadas === false}
                          className={`w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E] ${nuevoLugar.latitud && 'bg-green-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Longitud {nuevoLugar.longitud && <span className="text-green-600 text-xs">✓</span>}
                        </label>
                        <input
                          type="text"
                          value={nuevoLugar.longitud}
                          onChange={(e) => setNuevoLugar({ ...nuevoLugar, longitud: e.target.value })}
                          placeholder="Ej: -103.3496"
                          readOnly={!!nuevoLugar.longitud && buscandoCoordenadas === false}
                          className={`w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-full outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E] ${nuevoLugar.longitud && 'bg-green-50'}`}
                        />
                      </div>
                    </div>

                    {/* Minimapa para ajustar ubicación */}
                    {(nuevoLugar.latitud && nuevoLugar.longitud) && (
                      <div>
                        <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                          Ajustar Ubicación en el Mapa
                        </label>
                        <MinimapaLocationPicker
                          latitud={nuevoLugar.latitud}
                          longitud={nuevoLugar.longitud}
                          onLocationChange={(lat, lng) => {
                            setNuevoLugar({
                              ...nuevoLugar,
                              latitud: lat,
                              longitud: lng
                            });
                          }}
                          height="300px"
                        />
                      </div>
                    )}

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-bold text-[#1A4D2E] mb-2">
                        Descripción / Nota para IA
                      </label>
                      <textarea
                        value={nuevoLugar.descripcion}
                        onChange={(e) => setNuevoLugar({ ...nuevoLugar, descripcion: e.target.value })}
                        placeholder="Información adicional sobre el lugar..."
                        rows={4}
                        className="w-full px-4 py-3 border border-[#1A4D2E]/20 rounded-xl outline-none focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 transition-all text-[#1A4D2E] resize-none"
                      />
                    </div>
                  </div>

                  {/* BOTONES */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={crearLugar}
                      disabled={uploading || !nuevoLugar.nombre.trim()}
                      className="flex-1 px-6 py-3 bg-[#1A4D2E] text-white rounded-full hover:bg-[#0D601E] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Creando...' : 'Crear Lugar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NOTIFICACIÓN */}
        <AnimatePresence>
          {notificacion && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl z-50 ${
                notificacion.tipo === 'exito' ? 'bg-green-500' : 'bg-red-500'
              } text-white font-bold`}
            >
              {notificacion.mensaje}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

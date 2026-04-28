"use client";
import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import {
  FiCheck, FiChevronDown, FiChevronUp, FiClock,
  FiImage, FiMapPin, FiPlus, FiSave, FiTrash2, FiUpload, FiX
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const EMAIL_AUTORIZADO = "cua@hotmail.com";

const CATEGORY_CONFIG: Record<string, string[]> = {
  "Restaurante / Cafetería": ["Gastronomía mexicana", "Cafeterías", "Comida calle", "Postre", "Vegana", "Internacional"],
  "Artesanías / Souvenirs": ["Artesanías", "Souvenirs", "Arte popular", "Joyería artesanal", "Textiles", "Talavera"],
  "Clubs / Bar": ["Club / Antro", "Bar", "Cantina", "Pub", "Música en vivo"],
  "Casas de cambio": ["Cambio de divisas", "Transferencias internacionales"],
  "Explora más lugares": ["Compras", "Mercados locales", "Centros comerciales", "Aventura", "Fotografía", "Naturaleza"],
  "Cultura / Historia": ["Museo", "Monumento", "Iglesia", "Plaza", "Teatro", "Galería"],
  "Fútbol": ["Estadio", "Tienda oficial", "Fan zone", "Bar deportivo"],
  "Hoteles": ["Hotel", "Hostal", "Boutique"],
  "Transporte": ["Metro", "Bus", "Aeropuerto"],
  "Parques / Naturaleza": ["Parque", "Jardín", "Bosque"],
};

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
type DiaSemana = typeof DIAS[number];
const NOMBRE_DIA_DISPLAY: Record<DiaSemana, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miérc.',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

interface DiaHorario { cerrado: boolean; apertura: string; cierre: string; }
const defaultHorario = (): Record<DiaSemana, DiaHorario> =>
  Object.fromEntries(DIAS.map(d => [d, { cerrado: false, apertura: '09:00', cierre: '20:00' }])) as Record<DiaSemana, DiaHorario>;

interface Lugar { nombre: string; categoria: string; }

export default function DatosLugaresPage() {
  const router = useRouter();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [fotosMap, setFotosMap] = useState<Record<string, string[]>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [inputFotos, setInputFotos] = useState<string[]>(["", "", ""]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<(number | null)[]>([null, null, null]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRefsArray = useRef<(HTMLInputElement | null)[]>([]);

  // Estado formulario nuevo lugar
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevasSubcategorias, setNuevasSubcategorias] = useState<string[]>([]);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaLat, setNuevaLat] = useState("");
  const [nuevaLng, setNuevaLng] = useState("");
  const [nuevoHorario, setNuevoHorario] = useState<Record<DiaSemana, DiaHorario>>(defaultHorario);
  const [nuevoInputFotos, setNuevoInputFotos] = useState<string[]>(["", "", ""]);
  const [nuevoUploadProgress, setNuevoUploadProgress] = useState<(number | null)[]>([null, null, null]);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [mensajeNuevo, setMensajeNuevo] = useState("");
  const nuevoFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    if (userLocal.email !== EMAIL_AUTORIZADO) {
      router.replace("/");
      return;
    }
    setAutorizado(true);

    fetch("/datosLugares.csv")
      .then(r => r.text())
      .then(text => {
        const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
        setLugares(
          (data as any[])
            .map(row => ({ nombre: row["Nombre del Lugar"] || "", categoria: row["Categoría"] || "" }))
            .filter(l => l.nombre)
        );
      });

    fetch(`/api/lugares`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, string[]> = {};
        (data.lugares || []).forEach((l: any) => {
          if (l.nombre && l.fotos?.length) map[l.nombre] = l.fotos;
        });
        setFotosMap(map);
      })
      .catch(() => {});
  }, []);

  const abrirLugar = (nombre: string) => {
    if (expandido === nombre) { setExpandido(null); return; }
    const fotos = fotosMap[nombre] || [];
    const slots = fotos.length > 0 ? [...fotos, ""] : ["", "", ""];
    setInputFotos(slots);
    setUploadProgress(slots.map(() => null));
    setExpandido(nombre);
    setMensaje("");
  };

  const handleFileUpload = (slot: number, file: File) => {
    const nombreLugar = expandido || "lugar";
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `lugares/${nombreLugar.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${slot + 1}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prev => { const n = [...prev]; n[slot] = pct; return n; });
      },
      () => {
        setUploadProgress(prev => { const n = [...prev]; n[slot] = null; return n; });
        setMensaje("Error al subir imagen");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setInputFotos(prev => { const n = [...prev]; n[slot] = url; return n; });
        setUploadProgress(prev => { const n = [...prev]; n[slot] = null; return n; });
      }
    );
  };

  const agregarSlot = () => {
    setInputFotos(prev => [...prev, ""]);
    setUploadProgress(prev => [...prev, null]);
  };

  const eliminarSlot = (i: number) => {
    setInputFotos(prev => prev.filter((_, idx) => idx !== i));
    setUploadProgress(prev => prev.filter((_, idx) => idx !== i));
  };

  const eliminarLugar = async (nombre: string) => {
    const token = localStorage.getItem("pitzbol_token");
    try {
      const res = await fetch(`/api/lugares/${encodeURIComponent(nombre)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        setFotosMap(prev => { const n = { ...prev }; delete n[nombre]; return n; });
        setExpandido(null);
        setConfirmDelete(null);
      }
    } catch { /* silencioso */ }
  };

  const guardarFotos = async (nombre: string) => {
    setGuardando(true);
    setMensaje("");
    const fotosLimpias = inputFotos.filter(u => u.trim().startsWith("http"));
    const token = localStorage.getItem("pitzbol_token");
    try {
      const res = await fetch(`/api/lugares/${encodeURIComponent(nombre)}/fotos`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ fotos: fotosLimpias }),
      });
      if (res.ok) {
        setFotosMap(prev => ({ ...prev, [nombre]: fotosLimpias }));
        setMensaje("✓ Guardado");
      } else {
        setMensaje("Error al guardar");
      }
    } catch {
      setMensaje("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Handlers formulario nuevo lugar
  const handleNuevoFileUpload = (slot: number, file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `lugares/${(nuevoNombre || "nuevo").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${slot + 1}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setNuevoUploadProgress(prev => { const n = [...prev]; n[slot] = pct; return n; });
      },
      () => {
        setNuevoUploadProgress(prev => { const n = [...prev]; n[slot] = null; return n; });
        setMensajeNuevo("Error al subir imagen");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setNuevoInputFotos(prev => { const n = [...prev]; n[slot] = url; return n; });
        setNuevoUploadProgress(prev => { const n = [...prev]; n[slot] = null; return n; });
      }
    );
  };

  const toggleSubcategoria = (sub: string) => {
    setNuevasSubcategorias(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const updateDiaHorario = (dia: DiaSemana, field: keyof DiaHorario, value: string | boolean) => {
    setNuevoHorario(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value },
    }));
  };

  const agregarLugar = async () => {
    if (!nuevoNombre.trim()) { setMensajeNuevo("El nombre es requerido"); return; }
    if (!nuevaCategoria) { setMensajeNuevo("La categoría es requerida"); return; }

    setGuardandoNuevo(true);
    setMensajeNuevo("");

    const token = localStorage.getItem("pitzbol_token");
    const fotosLimpias = nuevoInputFotos.filter(u => u.trim().startsWith("http"));

    try {
      const res1 = await fetch(`/api/lugares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          categoria: nuevaCategoria,
          latitud: nuevaLat,
          longitud: nuevaLng,
          descripcion: nuevaDescripcion.trim(),
          fotos: fotosLimpias,
        }),
      });

      if (!res1.ok) {
        const data = await res1.json().catch(() => ({}));
        setMensajeNuevo(data.message || "Error al crear lugar");
        setGuardandoNuevo(false);
        return;
      }

      const nombre = nuevoNombre.trim();

      // Guardar categorias + subcategorias
      const todasCategorias = nuevasSubcategorias.length > 0
        ? [nuevaCategoria, ...nuevasSubcategorias]
        : [nuevaCategoria];

      await fetch(`/api/lugares/${encodeURIComponent(nombre)}/categorias`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ categorias: todasCategorias }),
      });

      // Guardar horario
      const horarioObj: Record<string, any> = {};
      for (const dia of DIAS) {
        const d = nuevoHorario[dia];
        horarioObj[dia] = d.cerrado ? 'cerrado' : { apertura: d.apertura, cierre: d.cierre };
      }

      await fetch(`/api/lugares/${encodeURIComponent(nombre)}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horariosJson: JSON.stringify(horarioObj) }),
      });

      // Calcular horaApertura, horaCierre y diasCerrado para el CSV de la IA
      const diasCerrado: string[] = DIAS.filter(d => nuevoHorario[d].cerrado);
      const diasAbiertos = DIAS.filter(d => !nuevoHorario[d].cerrado);
      const horaApertura = diasAbiertos.length > 0 ? nuevoHorario[diasAbiertos[0]].apertura : '';
      const horaCierre = diasAbiertos.length > 0
        ? diasAbiertos.reduce((max, d) => {
            const c = nuevoHorario[d].cierre;
            // Comparar como horas; si el cierre es < apertura asume que es del día siguiente (mayor)
            return c >= horaApertura ? (c > max ? c : max) : (max || c);
          }, nuevoHorario[diasAbiertos[0]].cierre)
        : '';

      await fetch('/api/ia-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          categoria: nuevaCategoria,
          latitud: nuevaLat,
          longitud: nuevaLng,
          horaApertura,
          horaCierre,
          diasCerrado,
          imagen: fotosLimpias[0] || '',
          tiempoEstancia: '60',
        }),
      }).catch(() => {});

      setMensajeNuevo("✓ Lugar creado correctamente");
      setNuevoNombre(""); setNuevaCategoria(""); setNuevasSubcategorias([]);
      setNuevaDescripcion(""); setNuevaLat(""); setNuevaLng("");
      setNuevoHorario(defaultHorario()); setNuevoInputFotos(["", "", ""]);
      setTimeout(() => { setMostrarFormNuevo(false); setMensajeNuevo(""); }, 2000);

    } catch {
      setMensajeNuevo("Error de conexión");
    } finally {
      setGuardandoNuevo(false);
    }
  };

  if (!autorizado) return null;

  const lugaresFiltrados = lugares.filter(
    l =>
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const conImagen = Object.keys(fotosMap).length;

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#1A4D2E]">Imágenes de Lugares</h1>
          <button
            onClick={() => { setMostrarFormNuevo(v => !v); setMensajeNuevo(""); }}
            className="flex items-center gap-1.5 bg-[#1A4D2E] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#0D601E] transition-colors"
          >
            {mostrarFormNuevo ? <FiX size={14} /> : <FiPlus size={14} />}
            {mostrarFormNuevo ? "Cancelar" : "Agregar Lugar"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {lugares.length} lugares en el CSV &bull; {conImagen} con imagen asignada
        </p>

        {/* Formulario agregar lugar */}
        {mostrarFormNuevo && (
          <div className="bg-white rounded-xl border border-[#1A4D2E]/20 p-4 mb-6 space-y-4">
            <h2 className="text-base font-semibold text-[#1A4D2E]">Nuevo Lugar</h2>

            {/* Nombre */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Nombre *</label>
              <input
                type="text"
                placeholder="Nombre del lugar"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Categoría *</label>
              <select
                value={nuevaCategoria}
                onChange={e => { setNuevaCategoria(e.target.value); setNuevasSubcategorias([]); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#1A4D2E] bg-white"
              >
                <option value="">Seleccionar categoría...</option>
                {Object.keys(CATEGORY_CONFIG).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subcategorías */}
            {nuevaCategoria && CATEGORY_CONFIG[nuevaCategoria]?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Subcategorías</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_CONFIG[nuevaCategoria].map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubcategoria(sub)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        nuevasSubcategorias.includes(sub)
                          ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#1A4D2E]"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Descripción</label>
              <textarea
                placeholder="Descripción breve del lugar..."
                value={nuevaDescripcion}
                onChange={e => setNuevaDescripcion(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#1A4D2E] resize-none"
              />
            </div>

            {/* Coordenadas */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                <FiMapPin size={11} /> Coordenadas
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Latitud (ej. 20.6597)"
                  value={nuevaLat}
                  onChange={e => setNuevaLat(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
                />
                <input
                  type="text"
                  placeholder="Longitud (ej. -103.3496)"
                  value={nuevaLng}
                  onChange={e => setNuevaLng(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
                />
              </div>
            </div>

            {/* Horario */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-2">
                <FiClock size={11} /> Horario por día
              </label>
              <div className="space-y-1.5">
                {DIAS.map(dia => {
                  const d = nuevoHorario[dia];
                  return (
                    <div key={dia} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{NOMBRE_DIA_DISPLAY[dia]}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.cerrado}
                          onChange={e => updateDiaHorario(dia, 'cerrado', e.target.checked)}
                          className="accent-[#1A4D2E]"
                        />
                        <span className="text-xs text-gray-500">Cerrado</span>
                      </label>
                      {!d.cerrado && (
                        <>
                          <input
                            type="time"
                            value={d.apertura}
                            onChange={e => updateDiaHorario(dia, 'apertura', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                          />
                          <span className="text-xs text-gray-400">–</span>
                          <input
                            type="time"
                            value={d.cierre}
                            onChange={e => updateDiaHorario(dia, 'cierre', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-2">
                <FiImage size={11} /> Imágenes — pega un URL o sube un archivo
              </label>
              {nuevoInputFotos.map((foto, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <FiImage size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="url"
                    placeholder={`URL imagen ${i + 1}`}
                    value={foto}
                    onChange={e => {
                      const n = [...nuevoInputFotos]; n[i] = e.target.value; setNuevoInputFotos(n);
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                  />
                  <input
                    ref={el => { nuevoFileInputRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleNuevoFileUpload(i, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => nuevoFileInputRefs.current[i]?.click()}
                    disabled={nuevoUploadProgress[i] !== null}
                    className="flex-shrink-0 p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {nuevoUploadProgress[i] !== null
                      ? <span className="text-[10px] text-[#1A4D2E] font-medium w-7 text-center block">{nuevoUploadProgress[i]}%</span>
                      : <FiUpload size={13} className="text-gray-500" />
                    }
                  </button>
                  {nuevoInputFotos.length > 1 && (
                    <button
                      onClick={() => {
                        setNuevoInputFotos(prev => prev.filter((_, idx) => idx !== i));
                        setNuevoUploadProgress(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <FiX size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => { setNuevoInputFotos(prev => [...prev, ""]); setNuevoUploadProgress(prev => [...prev, null]); }}
                className="flex items-center gap-1 text-xs text-[#1A4D2E] hover:text-[#0D601E] transition-colors"
              >
                <FiPlus size={13} /> Agregar otra imagen
              </button>
            </div>

            {/* Botón guardar */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={agregarLugar}
                disabled={guardandoNuevo || nuevoUploadProgress.some(p => p !== null)}
                className="flex items-center gap-1.5 bg-[#1A4D2E] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#0D601E] disabled:opacity-50 transition-colors"
              >
                <FiSave size={13} />
                {guardandoNuevo ? "Creando..." : "Crear lugar"}
              </button>
              {mensajeNuevo && (
                <span className={`text-xs font-medium ${mensajeNuevo.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                  {mensajeNuevo}
                </span>
              )}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Buscar lugar o categoría..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 mb-4 text-sm text-black focus:outline-none focus:border-[#1A4D2E]"
        />

        <div className="space-y-2">
          {lugaresFiltrados.map(lugar => {
            const tieneImagen = (fotosMap[lugar.nombre]?.length || 0) > 0;
            const abierto = expandido === lugar.nombre;

            return (
              <div key={lugar.nombre} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => abrirLugar(lugar.nombre)}
                    className="flex-1 flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-[#1A4D2E] truncate">{lugar.nombre}</span>
                      {tieneImagen && (
                        <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                          <FiCheck size={9} /> imagen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">{lugar.categoria}</span>
                      {abierto ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </div>
                  </button>
                  {confirmDelete === lugar.nombre ? (
                    <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                      <button
                        onClick={() => eliminarLugar(lugar.nombre)}
                        className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-gray-400 px-2 py-1 hover:text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(lugar.nombre); }}
                      title="Eliminar lugar"
                      className="p-2 mr-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>

                {abierto && (
                  <div className="px-3 pb-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mt-2 mb-2">Imágenes — pega un URL o sube un archivo</p>
                    {inputFotos.map((foto, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <FiImage size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="url"
                          placeholder={`URL imagen ${i + 1}`}
                          value={foto}
                          onChange={e => {
                            const nuevo = [...inputFotos];
                            nuevo[i] = e.target.value;
                            setInputFotos(nuevo);
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                        />
                        <input
                          ref={el => { fileInputRefsArray.current[i] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(i, file);
                            e.target.value = "";
                          }}
                        />
                        <button
                          onClick={() => fileInputRefsArray.current[i]?.click()}
                          disabled={uploadProgress[i] !== null}
                          title="Subir imagen"
                          className="flex-shrink-0 p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {uploadProgress[i] !== null
                            ? <span className="text-[10px] text-[#1A4D2E] font-medium w-7 text-center block">{uploadProgress[i]}%</span>
                            : <FiUpload size={13} className="text-gray-500" />
                          }
                        </button>
                        {inputFotos.length > 1 && (
                          <button
                            onClick={() => eliminarSlot(i)}
                            title="Eliminar este campo"
                            className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <FiX size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={agregarSlot}
                      className="flex items-center gap-1 text-xs text-[#1A4D2E] hover:text-[#0D601E] mb-3 transition-colors"
                    >
                      <FiPlus size={13} /> Agregar otra imagen
                    </button>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => guardarFotos(lugar.nombre)}
                        disabled={guardando || uploadProgress.some(p => p !== null)}
                        className="flex items-center gap-1.5 bg-[#1A4D2E] text-white text-xs px-4 py-1.5 rounded-lg hover:bg-[#0D601E] disabled:opacity-50 transition-colors"
                      >
                        <FiSave size={12} />
                        {guardando ? "Guardando..." : "Guardar"}
                      </button>
                      {mensaje && (
                        <span className={`text-xs font-medium ${mensaje.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                          {mensaje}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

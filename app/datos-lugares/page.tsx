"use client";
import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { FiCheck, FiChevronDown, FiChevronUp, FiImage, FiSave, FiTrash2, FiUpload } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const EMAIL_AUTORIZADO = "cua@hotmail.com";

interface Lugar {
  nombre: string;
  categoria: string;
}

export default function DatosLugaresPage() {
  const router = useRouter();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [fotosMap, setFotosMap] = useState<Record<string, string[]>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [inputFotos, setInputFotos] = useState<[string, string, string]>(["", "", ""]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  // progreso de subida por slot: null = idle, 0-100 = subiendo
  const [uploadProgress, setUploadProgress] = useState<[number | null, number | null, number | null]>([null, null, null]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

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
    setInputFotos([fotos[0] || "", fotos[1] || "", fotos[2] || ""]);
    setUploadProgress([null, null, null]);
    setExpandido(nombre);
    setMensaje("");
  };

  const handleFileUpload = (slot: 0 | 1 | 2, file: File) => {
    const nombreLugar = expandido || "lugar";
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `lugares/${nombreLugar.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${slot + 1}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prev => {
          const next = [...prev] as [number | null, number | null, number | null];
          next[slot] = pct;
          return next;
        });
      },
      () => {
        setUploadProgress(prev => { const n = [...prev] as [number | null, number | null, number | null]; n[slot] = null; return n; });
        setMensaje("Error al subir imagen");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setInputFotos(prev => {
          const n = [...prev] as [string, string, string];
          n[slot] = url;
          return n;
        });
        setUploadProgress(prev => { const n = [...prev] as [number | null, number | null, number | null]; n[slot] = null; return n; });
      }
    );
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
        <h1 className="text-2xl font-bold text-[#1A4D2E] mb-1">Imágenes de Lugares</h1>
        <p className="text-sm text-gray-500 mb-6">
          {lugares.length} lugares en el CSV &bull; {conImagen} con imagen asignada
        </p>

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
                  {/* Botón eliminar */}
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
                    <p className="text-xs text-gray-400 mt-2 mb-2">Imágenes (máx. 3) — pega un URL o sube un archivo</p>
                    {([0, 1, 2] as const).map(i => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <FiImage size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="url"
                          placeholder={`URL imagen ${i + 1}`}
                          value={inputFotos[i]}
                          onChange={e => {
                            const nuevo: [string, string, string] = [...inputFotos] as [string, string, string];
                            nuevo[i] = e.target.value;
                            setInputFotos(nuevo);
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-[#1A4D2E]"
                        />
                        {/* Botón subir archivo */}
                        <input
                          ref={fileInputRefs[i]}
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
                          onClick={() => fileInputRefs[i].current?.click()}
                          disabled={uploadProgress[i] !== null}
                          title="Subir imagen a Firebase"
                          className="flex-shrink-0 p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {uploadProgress[i] !== null
                            ? <span className="text-[10px] text-[#1A4D2E] font-medium w-7 text-center block">{uploadProgress[i]}%</span>
                            : <FiUpload size={13} className="text-gray-500" />
                          }
                        </button>
                      </div>
                    ))}
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

"use client";
import { useTranslations } from 'next-intl';
import { usePitzbolUser } from "@/lib/usePitzbolUser";
type WeekDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type DaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
};

type WeeklySchedule = Record<WeekDayKey, DaySchedule>;

interface FormState {
  nombre: string;
  categoria: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  local: string;
  ciudad: string;
  estado: string;
  referencias: string;
  sitioWeb: string;
  rfc: string;
  cp: string;
  descripcion: string;
  horario: WeeklySchedule;
  costoEstimado: string;
  tiempoSugerido: string;
  subcategorias: string[];
  galeria: (File | null)[];
  logo: File | null;
}
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { 
  FiX, FiBriefcase, FiMapPin, FiGlobe, FiImage, 
  FiChevronLeft, FiCheckCircle, FiInfo, FiTag, FiUser, FiChevronDown, FiClock, FiPlus
} from "react-icons/fi";
import Image from "next/image";
import imglogo from "./logoPitzbol.png";
import MinimapaLocationPicker from "./MinimapaLocationPicker";
  type ImagePreviewState = {
    logoUrl: string | null;
    galeriaUrls: (string | null)[];
  };

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  enabled: false,
  open: "09:00",
  close: "18:00",
};

const createDefaultSchedule = (): WeeklySchedule => ({
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: { ...DEFAULT_DAY_SCHEDULE },
  sunday: { ...DEFAULT_DAY_SCHEDULE },
});

const DAY_LABELS: { key: WeekDayKey; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const WEEKDAY_KEYS: WeekDayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const COST_OPTIONS: { label: string; value: string; accent: string }[] = [
  { label: "Bajo", value: "$100 - $250 MXN", accent: "$" },
  { label: "Medio", value: "$250 - $500 MXN", accent: "$$" },
  { label: "Alto", value: "$500 - $900 MXN", accent: "$$$" },
  { label: "Premium", value: "$900+ MXN", accent: "$$$$" },
];

const IMAGE_PREVIEW_DB = "pitzbolBusinessDraftDb";
const IMAGE_PREVIEW_STORE = "draftCache";
const IMAGE_PREVIEW_IDB_KEY = "businessImages";
const GALLERY_SLOT_COUNT = 4;
const createEmptyGallery = <T,>(value: T): T[] => Array.from({ length: GALLERY_SLOT_COUNT }, () => value);

const openPreviewDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }

    const request = window.indexedDB.open(IMAGE_PREVIEW_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_PREVIEW_STORE)) {
        db.createObjectStore(IMAGE_PREVIEW_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB"));
  });

const getPreviewCacheFromIdb = async (): Promise<ImagePreviewState | null> => {
  try {
    const db = await openPreviewDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_PREVIEW_STORE, "readonly");
      const store = tx.objectStore(IMAGE_PREVIEW_STORE);
      const req = store.get(IMAGE_PREVIEW_IDB_KEY);
      req.onsuccess = () => {
        const value = req.result;
        if (!value || typeof value !== "object") {
          resolve(null);
          return;
        }
        resolve(value as ImagePreviewState);
      };
      req.onerror = () => reject(req.error || new Error("No se pudo leer cache de imágenes"));
    });
  } catch {
    return null;
  }
};

const setPreviewCacheInIdb = async (value: ImagePreviewState): Promise<void> => {
  const db = await openPreviewDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IMAGE_PREVIEW_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("No se pudo guardar cache en IndexedDB"));
    tx.objectStore(IMAGE_PREVIEW_STORE).put(value, IMAGE_PREVIEW_IDB_KEY);
  });
};

const clearPreviewCacheInIdb = async (): Promise<void> => {
  try {
    const db = await openPreviewDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IMAGE_PREVIEW_STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("No se pudo limpiar cache en IndexedDB"));
      tx.objectStore(IMAGE_PREVIEW_STORE).delete(IMAGE_PREVIEW_IDB_KEY);
    });
  } catch {
    // noop
  }
};

const BusinessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const t = useTranslations('businessModal');
  const tCommon = useTranslations('common');
  const pitzbolUser = usePitzbolUser();
  
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);


  // Estado persistente para los datos del negocio, inicializando desde localStorage si existe
  const [form, setForm] = useState<FormState>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pitzbol_business_draft") : null;
    const defaults: FormState = {
      nombre: "",
      categoria: "",
      correo: "",
      telefono: "",
      ubicacion: "",
      latitud: "",
      longitud: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      local: "",
      ciudad: "Guadalajara",
      estado: "Jalisco",
      referencias: "",
      sitioWeb: "",
      rfc: "",
      cp: "",
      descripcion: "",
      horario: createDefaultSchedule(),
      costoEstimado: "",
      tiempoSugerido: "",
      subcategorias: [],
      galeria: createEmptyGallery<File | null>(null),
      logo: null
    } as FormState;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Los Files no se guardan, siempre empezar como null
        return {
          ...defaults,
          ...parsed,
          galeria: createEmptyGallery<File | null>(null),
          logo: null
        };
      } catch {}
    }
    return defaults;
  });
  const [rfcError, setRfcError] = useState("");
  const [cpError, setCpError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [categoriaError, setCategoriaError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [ubicacionError, setUbicacionError] = useState("");
  const [calleError, setCalleError] = useState("");
  const [numeroError, setNumeroError] = useState("");
  const [coloniaError, setColoniaError] = useState("");
  const [codigoPostalError, setCodigoPostalError] = useState("");
  const [ciudadError, setCiudadError] = useState("");
  const [estadoError, setEstadoError] = useState("");
  const [sitioWebError, setSitioWebError] = useState("");
  const [descripcionError, setDescripcionError] = useState("");
  const [horarioError, setHorarioError] = useState("");
  const [subcategoriasError, setSubcategoriasError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [subcategoriaInput, setSubcategoriaInput] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSelection, setScheduleSelection] = useState<WeekDayKey[]>(WEEKDAY_KEYS);
  const [bulkOpenTime, setBulkOpenTime] = useState("09:00");
  const [bulkCloseTime, setBulkCloseTime] = useState("18:00");
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [previewCacheReady, setPreviewCacheReady] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    logoUrl: null,
    galeriaUrls: createEmptyGallery<string | null>(null),
  });
  const [logoSquareSize, setLogoSquareSize] = useState<number | null>(null);
  
  // Estado separado para los archivos File (no se puede serializar en localStorage)
  const [files, setFiles] = useState<{ logo: File | null; galeria: (File | null)[] }>({
    logo: null,
    galeria: createEmptyGallery<File | null>(null)
  });
  
  const [galeriaErrors, setGaleriaErrors] = useState<string[]>(createEmptyGallery<string>(""));
  const [isValidating, setIsValidating] = useState(false);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const galleryContentRef = useRef<HTMLDivElement | null>(null);
  const lastGeocodeRef = useRef<string>("");
  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualMapChangeRef = useRef<boolean>(false);

  const IMAGES_CACHE_KEY = "pitzbol_business_images";

  const getBusinessApiUrl = (path: string) => path;

  // Validaciones de imagen
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  function validateImageFile(file: File): string | null {
    const ext = file.name.toLowerCase().slice(-4);
    if (!allowedExts.includes(ext)) {
      return "Extensión de archivo no permitida. Solo: JPG, PNG, WebP";
    }
    if (file.size > maxFileSize) {
      return "El archivo excede el tamaño máximo de 5MB.";
    }
    return null;
  }

  // Previsualización y validación para logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        setLogoError(error);
        setFiles((f) => ({ ...f, logo: null }));
        setImagePreview(prev => ({ ...prev, logoUrl: null }));
        console.error("[Logo]", error);
        return;
      }
      setLogoError("");
      const reader = new FileReader();
      reader.onload = ev => {
        setImagePreview(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
        setFiles((f) => ({ ...f, logo: file }));
        console.log("[Logo] Imagen cargada correctamente:", file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoError("");
      setImagePreview(prev => ({ ...prev, logoUrl: null }));
      setFiles((f) => ({ ...f, logo: null }));
    }
  };

  // Previsualización y validación para galería
  const handleGaleriaChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setGaleriaErrors((prev: string[]) => {
      const arr = [...prev];
      arr[i] = "";
      return arr;
    });
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        setGaleriaErrors((prev: string[]) => {
          const arr = [...prev];
          arr[i] = error;
          return arr;
        });
        setFiles((f) => {
          const gal = [...f.galeria];
          gal[i] = null;
          return { ...f, galeria: gal };
        });
        setImagePreview(prev => {
          const arr = [...prev.galeriaUrls];
          arr[i] = null;
          return { ...prev, galeriaUrls: arr };
        });
        console.error(`[Galería ${i+1}]`, error);
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        setImagePreview(prev => {
          const arr = [...prev.galeriaUrls];
          arr[i] = ev.target?.result as string;
          return { ...prev, galeriaUrls: arr };
        });
        setFiles((f) => {
          const gal = [...f.galeria];
          gal[i] = file;
          return { ...f, galeria: gal };
        });
        setGaleriaErrors((prev: string[]) => {
          const arr = [...prev];
          arr[i] = "";
          return arr;
        });
        console.log(`[Galería ${i+1}] Imagen cargada correctamente:`, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setFiles((f) => {
        const gal = [...f.galeria];
        gal[i] = null;
        return { ...f, galeria: gal };
      });
      setImagePreview(prev => {
        const arr = [...prev.galeriaUrls];
        arr[i] = null;
        return { ...prev, galeriaUrls: arr };
      });
      setGaleriaErrors((prev: string[]) => {
        const arr = [...prev];
        arr[i] = "";
        return arr;
      });
    }
  };

  // Resetear solo los errores y el paso al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsFinishing(false);
      setRfcError("");
      setCpError("");
      setSaveError("");
      setCalleError("");
      setNumeroError("");
      setColoniaError("");
      setCodigoPostalError("");
      setCiudadError("");
      setEstadoError("");
      setDescripcionError("");
      setHorarioError("");
      setSubcategoriasError("");
      setGeocodeError("");
      setSubcategoriaInput("");
    }
  }, [isOpen]);

  // Permite cerrar con Escape: primero el submodal de horario y luego el modal principal.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isScheduleModalOpen) {
        setIsScheduleModalOpen(false);
        return;
      }
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isScheduleModalOpen, onClose]);

  // Guardar automáticamente en localStorage cada vez que cambia form
  useEffect(() => {
    // No guardar Files en localStorage, solo los otros campos
    const formToSave = {
      nombre: form.nombre,
      categoria: form.categoria,
      correo: form.correo,
      telefono: form.telefono,
      ubicacion: form.ubicacion,
      latitud: form.latitud,
      longitud: form.longitud,
      calle: form.calle,
      numero: form.numero,
      colonia: form.colonia,
      codigoPostal: form.codigoPostal,
      local: form.local,
      ciudad: form.ciudad,
      estado: form.estado,
      referencias: form.referencias,
      sitioWeb: form.sitioWeb,
      rfc: form.rfc,
      cp: form.cp,
      descripcion: form.descripcion,
      horario: form.horario,
      costoEstimado: form.costoEstimado,
      tiempoSugerido: form.tiempoSugerido,
      subcategorias: form.subcategorias
    };
    localStorage.setItem("pitzbol_business_draft", JSON.stringify(formToSave));
  }, [form]);

  // Rehidratar previsualizaciones al abrir para mantener las imágenes al cerrar/abrir el modal.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isOpen) {
      setPreviewCacheReady(false);
      return;
    }

    let cancelled = false;
    setPreviewCacheReady(false);

    const normalizePreviewState = (parsed: ImagePreviewState) => ({
      logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : null,
      galeriaUrls: Array.isArray(parsed.galeriaUrls)
        ? createEmptyGallery<string | null>(null).map((_, i) => parsed.galeriaUrls[i] || null)
        : createEmptyGallery<string | null>(null),
    });

    (async () => {
      const fromIdb = await getPreviewCacheFromIdb();
      if (fromIdb && !cancelled) {
        setImagePreview(normalizePreviewState(fromIdb));
        setPreviewCacheReady(true);
        return;
      }

      try {
        // Solo para migrar cache legado desde Storage a IndexedDB.
        const cached = localStorage.getItem(IMAGES_CACHE_KEY) || sessionStorage.getItem(IMAGES_CACHE_KEY);
        if (!cached || cancelled) return;

        const parsed = JSON.parse(cached) as ImagePreviewState;
        if (!parsed || typeof parsed !== "object") return;
        const normalized = normalizePreviewState(parsed);
        setImagePreview(normalized);
        setPreviewCacheInIdb(normalized).catch(() => {
          // noop
        });

        // Limpiar el respaldo legado para evitar quota errors recurrentes.
        localStorage.removeItem(IMAGES_CACHE_KEY);
        sessionStorage.removeItem(IMAGES_CACHE_KEY);
      } catch (error) {
        console.warn("No se pudieron restaurar previsualizaciones de imágenes:", error);
      } finally {
        if (!cancelled) {
          setPreviewCacheReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Persistir previsualizaciones para conservar el estado visual aunque se cierre el modal.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen || !previewCacheReady) return;

    const hasAnyPreview = Boolean(imagePreview.logoUrl) || imagePreview.galeriaUrls.some((url) => Boolean(url));

    if (!hasAnyPreview) {
      localStorage.removeItem(IMAGES_CACHE_KEY);
      sessionStorage.removeItem(IMAGES_CACHE_KEY);
      clearPreviewCacheInIdb();
      return;
    }

    setPreviewCacheInIdb(imagePreview).catch((error) => {
      console.warn("No se pudo persistir cache de imágenes en IndexedDB:", error);
    });

    // Mantener limpio cualquier cache legado en Storage.
    localStorage.removeItem(IMAGES_CACHE_KEY);
    sessionStorage.removeItem(IMAGES_CACHE_KEY);
  }, [imagePreview, isOpen, previewCacheReady]);

  // En paso 3, igualar el alto total de galería+nota con el cuadro cuadrado del logo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen || step !== 2) return;

    const target = galleryContentRef.current;
    if (!target) return;

    const updateSize = () => {
      const measured = Math.round(target.getBoundingClientRect().height);
      if (!measured) return;
      const clamped = Math.max(240, Math.min(measured, 460));
      setLogoSquareSize(clamped);
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, step, imagePreview.galeriaUrls]);

  // Función para obtener coordenadas usando el endpoint del backend
  const buscarCoordenadas = async (direccion: string) => {
    if (!direccion.trim()) return;

    setBuscandoCoordenadas(true);
    setGeocodeError("");
    try {
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
        setGeocodeError(`Error al buscar: ${response.status} ${response.statusText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.latitud && data.longitud) {
        // Marcar que este cambio NO es manual (viene del geocoding automático)
        isManualMapChangeRef.current = false;
        setForm((f: FormState) => ({
          ...f,
          latitud: data.latitud,
          longitud: data.longitud
        }));
        setGeocodeError("");
        // Realizar reverse geocoding después de obtener coordenadas
        await obtenerCiudadEstado(data.latitud, data.longitud);
      } else {
        // Si no tuvo éxito, mostrar error
        setGeocodeError(data.message || "No se encontraron coordenadas para esta dirección. Completa más campos o ajusta manualmente en el mapa.");
        console.warn('Búsqueda sin éxito:', data.message);
      }
    } catch (error: any) {
      console.error('Error buscando coordenadas:', error);
      setGeocodeError("No se pudo buscar las coordenadas. Intenta de nuevo o ajusta manualmente.");
    } finally {
      setBuscandoCoordenadas(false);
    }
  };

  // Función para reverse geocoding usando Nominatim
  const obtenerCiudadEstado = async (lat: string, lng: string) => {
    if (!lat || !lng) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=mx`
      );
      
      if (!response.ok) throw new Error('Error en reverse geocoding');
      
      const address = await response.json();
      console.log('Reverse Geocoding Response:', address);
      
      // Extraer información
      const calle = address.address?.road || '';
      const ciudad = address.address?.city || address.address?.town || address.address?.municipality || '';
      const estado = address.address?.state || '';
      const colonia = address.address?.neighbourhood || address.address?.suburb || address.address?.village || address.address?.hamlet || address.address?.county || '';
      const numero = address.address?.house_number || '';
      const codigoPostal = address.address?.postcode || '';
      
      // Solo actualizar calle si fue un cambio manual del marcador
      const isManualChange = isManualMapChangeRef.current;
      console.log('Cambio manual del mapa:', isManualChange);
      
      // Actualizar form con los datos extraídos
      setForm((f: FormState) => ({
        ...f,
        // Solo sobrescribir la calle si el usuario movió el marcador manualmente
        calle: isManualChange ? (calle || f.calle) : f.calle,
        ciudad: ciudad || f.ciudad,
        estado: estado || f.estado,
        colonia: colonia || f.colonia,
        numero: numero || f.numero,
        codigoPostal: codigoPostal || f.codigoPostal
      }));
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
    }
  };

  // Calcular si debemos hacer geocoding automático
  const shouldAutoGeocode = useMemo(() => {
    // Solo si tiene CALLE + (COLONIA O CODIGO POSTAL) y no tiene coordenadas
    return (
      form.calle.trim() !== "" &&
      (form.colonia.trim() !== "" || form.codigoPostal.trim() !== "") &&
      !form.latitud &&
      !form.longitud
    );
  }, [form.calle, form.colonia, form.codigoPostal, form.latitud, form.longitud]);

  // Buscar coordenadas automáticamente cuando se cumplen las condiciones (con debounce)
  useEffect(() => {
    if (!shouldAutoGeocode || buscandoCoordenadas) {
      if (!shouldAutoGeocode) {
        setGeocodeError("");
      }
      return;
    }

    const direccion = composeDireccion(form);
    const trimmed = direccion.trim();
    
    if (trimmed.length < 4) {
      return;
    }

    if (lastGeocodeRef.current === trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      lastGeocodeRef.current = trimmed;
      buscarCoordenadas(trimmed);
    }, 1000);

    return () => clearTimeout(timer);
  }, [shouldAutoGeocode, buscandoCoordenadas]);

  // Reverse geocoding cuando el marcador del mapa cambia (con debounce)
  useEffect(() => {
    if (!form.latitud || !form.longitud) return;

    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }

    reverseGeocodeTimeoutRef.current = setTimeout(() => {
      obtenerCiudadEstado(form.latitud, form.longitud);
    }, 500);

    return () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    };
  }, [form.latitud, form.longitud]);

  const validateEmail = (valor: string) => {
    if (!valor) return false;
    // Regex simple para email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  };
  
  const validatePhone = (valor: string) => {
    // Validar que sea un número de 10 dígitos
    return valor !== "" && /^\d{10}$/.test(valor);
  };

  const validateURL = (valor: string) => {
    if (!valor) return false;
    // Regex para validar URL o dominio
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return urlPattern.test(valor);
  };
  
  const validateRFC = (valor: string) => {
    const rfcRegex = /^[A-Z&\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
    return valor !== "" && rfcRegex.test(valor);
  };
  const validateCP = (valor: string) => {
    return valor !== "" && /^\d{5}$/.test(valor);
  };

  const composeDireccion = (values: FormState) => {
    const partes = [
      values.calle && values.numero ? `${values.calle} ${values.numero}` : values.calle,
      values.local ? `Local ${values.local}` : "",
      values.colonia,
      values.ciudad,
      values.estado,
      values.codigoPostal
    ].filter(Boolean);

    return partes.join(", ");
  };

  const updateScheduleDay = (day: WeekDayKey, patch: Partial<DaySchedule>) => {
    setForm((prev: FormState) => ({
      ...prev,
      horario: {
        ...prev.horario,
        [day]: {
          ...prev.horario[day],
          ...patch,
        },
      },
    }));

    if (horarioError) {
      setHorarioError("");
    }
  };

  const enabledScheduleCount = useMemo(
    () => DAY_LABELS.filter((day) => form.horario[day.key].enabled).length,
    [form.horario]
  );

  const activeSchedulePreview = useMemo(
    () =>
      DAY_LABELS
        .filter((day) => form.horario[day.key].enabled)
        .map((day) => ({
          label: day.label,
          open: form.horario[day.key].open,
          close: form.horario[day.key].close,
        })),
    [form.horario]
  );

  const schedulePreviewCards = useMemo(
    () => (activeSchedulePreview.length > 4 ? activeSchedulePreview.slice(0, 4) : activeSchedulePreview),
    [activeSchedulePreview]
  );

  const scheduleOverflowText = useMemo(() => {
    if (activeSchedulePreview.length <= 4) return "";
    return activeSchedulePreview
      .slice(4)
      .map((item) => item.label)
      .join(" • ");
  }, [activeSchedulePreview]);

  useEffect(() => {
    if (!isScheduleModalOpen) return;

    const enabledDays = DAY_LABELS.filter((day) => form.horario[day.key].enabled).map((day) => day.key);
    const firstEnabled = enabledDays[0];

    setScheduleSelection(enabledDays.length > 0 ? enabledDays : WEEKDAY_KEYS);
    setBulkOpenTime(firstEnabled ? form.horario[firstEnabled].open : "09:00");
    setBulkCloseTime(firstEnabled ? form.horario[firstEnabled].close : "18:00");
  }, [isScheduleModalOpen, form.horario]);

  const toggleScheduleSelection = (day: WeekDayKey) => {
    setScheduleSelection((prev) =>
      prev.includes(day) ? prev.filter((key) => key !== day) : [...prev, day]
    );
  };

  const applyScheduleToSelection = () => {
    if (!bulkOpenTime || !bulkCloseTime || bulkOpenTime >= bulkCloseTime || scheduleSelection.length === 0) {
      setHorarioError("Selecciona al menos un día y un rango válido (apertura menor a cierre)");
      return;
    }

    setForm((prev: FormState) => {
      const nextSchedule: WeeklySchedule = { ...prev.horario };
      scheduleSelection.forEach((day) => {
        nextSchedule[day] = {
          ...nextSchedule[day],
          enabled: true,
          open: bulkOpenTime,
          close: bulkCloseTime,
        };
      });
      return {
        ...prev,
        horario: nextSchedule,
      };
    });

    setHorarioError("");
  };

  const applyPresetSchedule = (days: WeekDayKey[], open: string, close: string) => {
    setScheduleSelection(days);
    setBulkOpenTime(open);
    setBulkCloseTime(close);

    setForm((prev: FormState) => {
      const nextSchedule: WeeklySchedule = { ...prev.horario };
      days.forEach((day) => {
        nextSchedule[day] = {
          ...nextSchedule[day],
          enabled: true,
          open,
          close,
        };
      });

      return {
        ...prev,
        horario: nextSchedule,
      };
    });

    setHorarioError("");
  };

  const disableScheduleDay = (day: WeekDayKey) => {
    updateScheduleDay(day, { enabled: false });
  };

  const clearAllSchedules = () => {
    setForm((prev: FormState) => ({
      ...prev,
      horario: createDefaultSchedule(),
    }));
    setScheduleSelection(WEEKDAY_KEYS);
    setBulkOpenTime("09:00");
    setBulkCloseTime("18:00");
    setHorarioError("");
  };

  const addSubcategory = (rawValue: string) => {
    const sanitized = rawValue.trim().replace(/\s+/g, " ");
    if (!sanitized) return;
    if (sanitized.length > 40) {
      setSubcategoriasError("Cada subcategoría debe tener máximo 40 caracteres");
      return;
    }

    setForm((prev: FormState) => {
      const exists = prev.subcategorias.some((item) => item.toLowerCase() === sanitized.toLowerCase());
      if (exists) return prev;
      if (prev.subcategorias.length >= 10) {
        setSubcategoriasError("Máximo 10 subcategorías");
        return prev;
      }
      return {
        ...prev,
        subcategorias: [...prev.subcategorias, sanitized],
      };
    });

    setSubcategoriasError("");
    setSubcategoriaInput("");
  };

  const removeSubcategory = (value: string) => {
    setForm((prev: FormState) => ({
      ...prev,
      subcategorias: prev.subcategorias.filter((item) => item !== value),
    }));
  };

  // Mantener la ubicación compuesta a partir de los campos
  useEffect(() => {
    const compuesta = composeDireccion(form);
    if (compuesta !== form.ubicacion) {
      setForm((f: FormState) => ({ ...f, ubicacion: compuesta }));
    }
  }, [form.calle, form.numero, form.colonia, form.codigoPostal, form.local, form.ciudad, form.estado, form.ubicacion]);

  // Validar unicidad de datos en el servidor
  const validateUniqueness = async (field: 'nombre' | 'correo' | 'telefono', value: string) => {
    if (!value) return;
    
    setIsValidating(true);
    try {
      const body: any = {};
      if (field === 'nombre') body.businessName = value;
      if (field === 'correo') body.email = value;
      if (field === 'telefono') body.phone = value;

      const res = await fetch(getBusinessApiUrl("/api/business/validate-uniqueness"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (!data.valid && data.errors) {
        if (field === 'nombre' && data.errors.businessName) {
          setNombreError(data.errors.businessName);
        }
        if (field === 'correo' && data.errors.email) {
          setEmailError(data.errors.email);
        }
        if (field === 'telefono' && data.errors.phone) {
          setTelefonoError(data.errors.phone);
        }
      }
    } catch (error) {
      console.error("Error validando unicidad:", error);
    } finally {
      setIsValidating(false);
    }
  };


  // Guardar en Firestore
  const [success, setSuccess] = useState(false);

  // Función para validar el paso 1 antes de avanzar
  const validateStep1 = async () => {
    setNombreError("");
    setEmailError("");
    setTelefonoError("");
    setCategoriaError("");

    let hasErrors = false;

    // Validar nombre
    if (!form.nombre.trim()) {
      setNombreError("El nombre del negocio es obligatorio");
      hasErrors = true;
    }

    // Validar categoría
    if (!form.categoria.trim()) {
      setCategoriaError("Debes seleccionar una categoría");
      hasErrors = true;
    }

    // Validar email
    if (!form.correo.trim()) {
      setEmailError("El correo electrónico es obligatorio");
      hasErrors = true;
    } else if (!validateEmail(form.correo)) {
      setEmailError("El formato del correo es inválido");
      hasErrors = true;
    }

    // Validar teléfono
    if (!form.telefono.trim()) {
      setTelefonoError("El teléfono es obligatorio");
      hasErrors = true;
    } else if (!validatePhone(form.telefono)) {
      setTelefonoError("El teléfono debe tener 10 dígitos");
      hasErrors = true;
    }

    if (hasErrors) return false;

    // Validar unicidad en el servidor
    setIsValidating(true);
    try {
      const res = await fetch(getBusinessApiUrl("/api/business/validate-uniqueness"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.nombre,
          email: form.correo,
          phone: form.telefono
        })
      });

      const data = await res.json();
      
      if (!data.valid && data.errors) {
        if (data.errors.businessName) {
          setNombreError(data.errors.businessName);
          hasErrors = true;
        }
        if (data.errors.email) {
          setEmailError(data.errors.email);
          hasErrors = true;
        }
        if (data.errors.phone) {
          setTelefonoError(data.errors.phone);
          hasErrors = true;
        }
      }
    } catch (error) {
      console.error("Error validando unicidad:", error);
      setSaveError("Error de red al validar los datos");
      return false;
    } finally {
      setIsValidating(false);
    }

    return !hasErrors;
  };

  // Función para validar el paso 2 (Dirección del negocio) antes de avanzar
  const validateStep2 = async () => {
    setUbicacionError("");
    setCalleError("");
    setNumeroError("");
    setColoniaError("");
    setCodigoPostalError("");
    setCiudadError("");
    setEstadoError("");
    setSitioWebError("");

    let hasErrors = false;

    // Validar dirección
    if (!form.calle.trim()) {
      setCalleError("La calle es obligatoria");
      hasErrors = true;
    }
    if (!form.numero.trim()) {
      setNumeroError("El número es obligatorio");
      hasErrors = true;
    }
    if (!form.colonia.trim()) {
      setColoniaError("La colonia es obligatoria");
      hasErrors = true;
    }
    if (!form.codigoPostal.trim()) {
      setCodigoPostalError("El código postal es obligatorio");
      hasErrors = true;
    } else if (!validateCP(form.codigoPostal)) {
      setCodigoPostalError("El código postal debe tener 5 dígitos");
      hasErrors = true;
    }
    if (!form.ciudad.trim()) {
      setCiudadError("La ciudad es obligatoria");
      hasErrors = true;
    }
    if (!form.estado.trim()) {
      setEstadoError("El estado es obligatorio");
      hasErrors = true;
    }

    const ubicacionCompuesta = composeDireccion(form);
    if (!ubicacionCompuesta.trim()) {
      setUbicacionError("La ubicación es obligatoria");
      hasErrors = true;
    } else {
      // Validar unicidad de ubicación
      try {
        const res = await fetch(getBusinessApiUrl("/api/business/validate-uniqueness"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: ubicacionCompuesta })
        });

        const data = await res.json();
        if (!data.valid && data.errors?.location) {
          setUbicacionError(data.errors.location);
          hasErrors = true;
        }
      } catch (error) {
        console.error("Error validando ubicación:", error);
      }
    }

    return !hasErrors;
  };

  // Función para validar el paso 3 (Imagen del negocio) antes de avanzar
  const validateStep3 = () => {
    setLogoError("");

    if (!files.logo && !imagePreview.logoUrl) {
      setLogoError("El logo del negocio es obligatorio");
      return false;
    }

    return true;
  };

  // Función para validar el paso 4 (Información adicional) antes de avanzar
  const validateStep4 = async () => {
    setDescripcionError("");
    setSitioWebError("");
    setHorarioError("");

    let hasErrors = false;

    if (!form.descripcion.trim()) {
      setDescripcionError("La descripción del negocio es obligatoria");
      hasErrors = true;
    }

    if (!form.sitioWeb.trim()) {
      setSitioWebError("El sitio web o redes sociales son obligatorios");
      hasErrors = true;
    } else if (!validateURL(form.sitioWeb)) {
      setSitioWebError("URL no válida. Ejemplo: https://facebook.com/tunegocio");
      hasErrors = true;
    }

    const enabledDays = (Object.values(form.horario) as DaySchedule[]).filter((day: DaySchedule) => day.enabled);
    const hasInvalidSchedule = enabledDays.some((day: DaySchedule) => !day.open || !day.close || day.open >= day.close);
    if (hasInvalidSchedule) {
      setHorarioError("Revisa el horario: la hora de apertura debe ser menor a la de cierre");
      hasErrors = true;
    }

    if (hasErrors) return false;

    try {
      const res = await fetch(getBusinessApiUrl("/api/business/validate-uniqueness"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: form.sitioWeb })
      });

      const data = await res.json();
      if (!data.valid && data.errors?.website) {
        setSitioWebError(data.errors.website);
        return false;
      }
    } catch (error) {
      console.error("Error validando sitio web:", error);
    }

    return true;
  };

  // Función para convertir Data URL a File
  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleFinish = async () => {
    setSaveError("");
    setEmailError("");
    setNombreError("");
    setCategoriaError("");
    setRfcError("");
    setCpError("");
    let firstErrorStep = null;
    if (!form.nombre.trim()) {
      setNombreError("El nombre es obligatorio");
      if (firstErrorStep === null) firstErrorStep = 0;
    }
    if (!form.categoria.trim()) {
      setCategoriaError("Selecciona una categoría");
      if (firstErrorStep === null) firstErrorStep = 0;
    }
    if (!validateEmail(form.correo)) {
      setEmailError("Correo inválido");
      if (firstErrorStep === null) firstErrorStep = 0;
    }
    if (!files.logo && !imagePreview.logoUrl) {
      setLogoError("El logo del negocio es obligatorio");
      if (firstErrorStep === null) firstErrorStep = 2;
    }
    if (!form.descripcion.trim()) {
      setDescripcionError("La descripción del negocio es obligatoria");
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (!form.sitioWeb.trim() || !validateURL(form.sitioWeb)) {
      setSitioWebError("URL no válida. Ejemplo: https://facebook.com/tunegocio");
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (!validateRFC(form.rfc)) {
      setRfcError("RFC inválido");
      if (firstErrorStep === null) firstErrorStep = 4;
    }
    if (!validateCP(form.cp)) {
      setCpError("CP inválido");
      if (firstErrorStep === null) firstErrorStep = 4;
    }
    if (firstErrorStep !== null) {
      setStep(firstErrorStep);
      return;
    }

    // Validar unicidad de RFC y CP
    try {
      const res = await fetch(getBusinessApiUrl("/api/business/validate-uniqueness"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfc: form.rfc,
          cp: form.cp
        })
      });

      const data = await res.json();
      if (!data.valid && data.errors) {
        if (data.errors.rfc) {
          setRfcError(data.errors.rfc);
          setStep(4);
          return;
        }
        if (data.errors.cp) {
          setCpError(data.errors.cp);
          setStep(4);
          return;
        }
      }
    } catch (error) {
      console.error("Error validando RFC y CP:", error);
      setSaveError("Error al validar los datos. Intenta de nuevo.");
      return;
    }

    setIsFinishing(true);
    setSuccess(false);
    try {
      let ownerUid: string | undefined;
      
      // PRIORIDAD 1: Usar el usuario del hook (más confiable)
      if (pitzbolUser?.uid) {
        ownerUid = pitzbolUser.uid;
        console.log("[BusinessModal] [OK] ownerUid obtenido del hook usePitzbolUser:", ownerUid);
      } else {
        // PRIORIDAD 2: Si no está en el hook, intentar localStorage
        try {
          const storedUser = localStorage.getItem("pitzbol_user");
          console.log("[BusinessModal] localStorage storedUser:", storedUser);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            ownerUid = parsedUser?.uid;
            console.log("[BusinessModal] ownerUid extraído del localStorage:", ownerUid);
            console.log("[BusinessModal] Usuario completo:", parsedUser);
          }
        } catch (error) {
          console.error("[BusinessModal] Error al parsear pitzbol_user:", error);
          ownerUid = undefined;
        }
      }
      
      if (!ownerUid) {
        console.warn("[BusinessModal] [WARN] No se pudo obtener ownerUid, la notificacion no llegara al usuario");
      }

      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append("email", form.correo);
      formData.append("businessName", form.nombre);
      formData.append("category", form.categoria);
      formData.append("phone", form.telefono);
      const ubicacionCompuesta = composeDireccion(form);
      formData.append("location", ubicacionCompuesta);
      if (form.latitud) formData.append("latitud", form.latitud);
      if (form.longitud) formData.append("longitud", form.longitud);
      formData.append("website", form.sitioWeb);
      formData.append("rfc", form.rfc);
      formData.append("cp", form.cp);
      if (form.descripcion) {
        formData.append("description", form.descripcion);
      }
      formData.append("schedule", JSON.stringify(form.horario));
      if (form.costoEstimado.trim()) {
        formData.append("estimatedCost", form.costoEstimado.trim());
      }
      if (form.tiempoSugerido.trim()) {
        formData.append("suggestedStayTime", form.tiempoSugerido.trim());
      }
      formData.append("subcategories", JSON.stringify(form.subcategorias));
      if (ownerUid) {
        formData.append("ownerUid", ownerUid);
        console.log("[BusinessModal] [OK] ownerUid agregado al FormData:", ownerUid);
      } else {
        console.log("[BusinessModal] [WARN] No se agrego ownerUid porque es undefined");
      }
      
      // Agregar logo - convertir Data URL a File si es necesario
      if (files.logo) {
        formData.append("logo", files.logo);
      } else if (imagePreview.logoUrl) {
        // Si no hay File object pero hay una Data URL, convertir
        const logoFile = dataUrlToFile(imagePreview.logoUrl, "logo.png");
        formData.append("logo", logoFile);
      }
      
      // Agregar imágenes de galería - convertir Data URLs a Files si es necesario
      files.galeria.forEach((file: File | null, index: number) => {
        if (file) {
          formData.append("images", file);
        } else if (imagePreview.galeriaUrls[index]) {
          // Si no hay File object pero hay una Data URL, convertir
          const galeriaFile = dataUrlToFile(imagePreview.galeriaUrls[index], `galeria_${index}.png`);
          formData.append("images", galeriaFile);
        }
      });
      
      console.log("[BusinessModal] Enviando FormData:", {
        email: form.correo,
        businessName: form.nombre,
        category: form.categoria,
        phone: form.telefono,
        location: ubicacionCompuesta,
        latitud: form.latitud,
        longitud: form.longitud,
        website: form.sitioWeb,
        schedule: form.horario,
        estimatedCost: form.costoEstimado,
        suggestedStayTime: form.tiempoSugerido,
        subcategories: form.subcategorias,
        rfc: form.rfc,
        cp: form.cp,
        description: form.descripcion || "NO PRESENTE",
        ownerUid: ownerUid || "NO PRESENTE",
        logo: files.logo || imagePreview.logoUrl ? "Presente" : "NO PRESENTE",
        galeria: (files.galeria.filter(f => f).length + imagePreview.galeriaUrls.filter(u => u).length) + " archivos"
      });
      
      const res = await fetch(getBusinessApiUrl("/api/business/register-with-images"), {
        method: "POST",
        body: formData
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        console.error("[BusinessModal] Error del servidor:", data);
        setSaveError(data.message || "Error al guardar el negocio. Intenta de nuevo.");
        if (data.missingFields) {
          console.error("[BusinessModal] Campos faltantes:", data.missingFields);
        }
        setIsFinishing(false);
        return;
      }
      
      localStorage.removeItem("pitzbol_business_draft");
      localStorage.removeItem(IMAGES_CACHE_KEY);
      sessionStorage.removeItem(IMAGES_CACHE_KEY);
      clearPreviewCacheInIdb();
      setFiles({ logo: null, galeria: createEmptyGallery<File | null>(null) });

      setSuccess(true);

      // Notify business-management pages to refresh request lists without full page reload.
      window.dispatchEvent(new Event("businessRequestSubmitted"));

      setTimeout(() => {
        setIsFinishing(false);
        setSuccess(false);
        onClose();
      }, 3500);
    } catch (e) {
      console.error("Error:", e);
      setSaveError("Error de red al guardar el negocio. Verifica tu conexión.");
      setIsFinishing(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-sm";
  const labelClass = "text-[10px] uppercase tracking-widest text-[#4F6757] font-black ml-4 mb-2 block";
  const cardClass = "bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,96,30,0.1)] hover:border-[#0D601E]/80";
  
  const btnPrimary = "w-full bg-[#0D601E] text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#094d18] transition-all active:scale-95";
  const btnFinish = "w-full bg-[#8B0000] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] transition-transform active:scale-95";
  const formContainerClass = step === 1 ? "max-w-5xl mx-auto space-y-2" : step === 2 ? "w-fit max-w-full mx-auto space-y-2" : "max-w-2xl mx-auto space-y-2";
  const modalWidthClass = step === 2 ? "w-fit" : "w-full";
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white ${modalWidthClass} rounded-[50px] shadow-2xl border border-white/20 ${
          step === 1
            ? "max-w-[900px] max-h-[92vh] overflow-hidden p-4 md:p-6"
            : step === 2
            ? "max-w-[840px] max-h-[96vh] overflow-hidden p-3 md:p-5"
            : step === 3
            ? "max-w-[850px] h-[calc(100vh-1.25rem)] md:h-[calc(100vh-2rem)] max-h-[calc(100vh-1.25rem)] overflow-hidden p-4 md:p-6"
            : "max-w-[850px] min-h-[500px] max-h-[90vh] overflow-hidden p-6 md:p-8"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isFinishing ? (
            <motion.div key="form" exit={{ opacity: 0, scale: 0.9 }}>
              <button onClick={onClose} className="absolute top-6 right-8 z-[310] text-gray-400 hover:text-red-500 transition-all">
                <FiX size={28} />
              </button>
              
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="absolute top-8 left-10 text-[#769C7B] hover:text-[#0D601E] flex items-center gap-1 text-xs font-bold uppercase transition-all">
                  <FiChevronLeft size={20} /> {t('back')}
                </button>
              )}

              {saveError && (
                <div className="mb-6 px-6 py-3 rounded-2xl bg-[#8B0000] text-white text-center font-bold text-sm shadow-lg animate-pulse border-2 border-[#8B0000]/60">
                  {saveError}
                </div>
              )}
              <div className={`text-center ${step === 1 ? "mb-5" : step === 2 ? "mb-4" : step === 3 ? "mb-2.5" : "mb-6"}`}>
                <h2 className={`${step === 1 ? "text-[22px] md:text-[28px]" : "text-[28px] md:text-[36px]"} text-[#8B0000] font-black uppercase leading-none`} style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0
                    ? t('step1Title')
                    : step === 1
                    ? t('step2Title')
                    : step === 2
                    ? t('step3Title')
                    : step === 3
                    ? t('step4Title')
                    : t('step5Title')}
                </h2>
                <p className={`${step === 1 ? "text-xs" : "text-sm"} text-[#1A4D2E] italic mt-1`}>{t('stepProgress', { current: step + 1, total: 5 })}</p>
              </div>

              <div className={formContainerClass}>
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                    <div className={cardClass}>
                      <span className={labelClass}>{t('brandIdentity')}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative pb-3">
                          <input 
                            placeholder={t('businessName')} 
                            className={inputClass + (nombreError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.nombre} 
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, nombre: e.target.value }));
                              if (!e.target.value.trim()) setNombreError("El nombre es obligatorio");
                              else setNombreError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) {
                                setNombreError("El nombre es obligatorio");
                              } else {
                                setNombreError("");
                                validateUniqueness('nombre', e.target.value);
                              }
                            }}
                          />
                          {nombreError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{nombreError}</p>}
                        </div>
                        <div className="relative pb-5">
                          <select 
                            className={inputClass + " appearance-none cursor-pointer pr-10" + (categoriaError ? " border-red-500 bg-red-50/50" : "")}
                            value={form.categoria}
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, categoria: e.target.value }));
                              if (!e.target.value.trim()) setCategoriaError("Selecciona una categoría");
                              else setCategoriaError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) setCategoriaError("Selecciona una categoría");
                              else setCategoriaError("");
                            }}
                          >
                            <option value="" disabled>{t('partnerCategory')}</option>
                            <option value="Restaurante / Bar">{t('categories.restaurant')}</option>
                            <option value="Cafetería / Desayunos">{t('categories.cafe')}</option>
                            <option value="Hotelería / Hostal / Airbnb">{t('categories.hotel')}</option>
                            <option value="Transporte / Traslados">{t('categories.transport')}</option>
                            <option value="Renta de Equipo Deportivo">{t('categories.equipment')}</option>
                            <option value="Artesanías / Souvenirs">{t('categories.crafts')}</option>
                            <option value="Vida Nocturna / Club">{t('categories.nightlife')}</option>
                          </select>
                          <FiChevronDown 
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#769C7B]" 
                            size={18} 
                          />
                          {categoriaError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{categoriaError}</p>}
                        </div>
                      </div>
                    </div>
                    <div className={cardClass}>
                      <span className={labelClass}>{t('officialContact')}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative pb-3">
                          <input 
                            placeholder={t('businessEmail')} 
                            className={inputClass + (emailError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.correo} 
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, correo: e.target.value }));
                              if (!e.target.value.trim()) setEmailError("El correo es obligatorio");
                              else if (!validateEmail(e.target.value)) setEmailError("Formato de correo inválido");
                              else setEmailError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) {
                                setEmailError("El correo es obligatorio");
                              } else if (!validateEmail(e.target.value)) {
                                setEmailError("Formato de correo inválido");
                              } else {
                                setEmailError("");
                                validateUniqueness('correo', e.target.value);
                              }
                            }}
                          />
                          {emailError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{emailError}</p>}
                        </div>
                        <div className="relative pb-5">
                          <input 
                            placeholder={t('whatsappPhone')} 
                            className={inputClass + (telefonoError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.telefono} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setForm((f: FormState) => ({ ...f, telefono: val }));
                              if (!val) setTelefonoError("El teléfono es obligatorio");
                              else if (val.length !== 10) setTelefonoError("Debe tener 10 dígitos");
                              else setTelefonoError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) {
                                setTelefonoError("El teléfono es obligatorio");
                              } else if (!validatePhone(e.target.value)) {
                                setTelefonoError("Debe tener 10 dígitos");
                              } else {
                                setTelefonoError("");
                                validateUniqueness('telefono', e.target.value);
                              }
                            }}
                            maxLength={10}
                          />
                          {telefonoError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{telefonoError}</p>}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const isValid = await validateStep1();
                        if (isValid) setStep(1);
                      }} 
                      className={btnPrimary}
                      disabled={isValidating}
                    >
                      {isValidating ? "Validando..." : t('nextStep')}
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.25fr] gap-2 md:items-stretch">
                      <div className="p-2 rounded-[24px] border border-[#1A4D2E]/10 bg-[#F6F0E6]/30 min-h-[340px] md:h-full flex flex-col">
                          <span className="block text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-2 mb-1">
                            Ubicación en el mapa
                          </span>
                          <div className="h-[180px] md:flex-1 md:min-h-[280px]">
                            <MinimapaLocationPicker
                              latitud={form.latitud}
                              longitud={form.longitud}
                              onLocationChange={(lat, lng) => {
                                console.log("MinimapaLocationPicker - Coordenadas actualizadas:", { lat, lng });
                                // Marcar que este cambio SÍ es manual (usuario movió el marcador)
                                isManualMapChangeRef.current = true;
                                setForm((f: FormState) => ({
                                  ...f,
                                  latitud: lat,
                                  longitud: lng
                                }));
                              }}
                              height="100%"
                            />
                          </div>
                          <p className="mt-2 text-[10px] text-[#1A4D2E] px-2">
                            Mueve el pin para ajustar el punto exacto del negocio. Esto mejora la precisión en resultados de mapa y rutas.
                          </p>
                        </div>
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative pb-2">
                              <input
                                placeholder="Calle"
                                className={inputClass + " text-[12px] py-2" + (calleError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.calle}
                                onChange={e => {
                                  setForm((f: FormState) => ({ ...f, calle: e.target.value, latitud: "", longitud: "" }));
                                  if (!e.target.value.trim()) setCalleError("La calle es obligatoria");
                                  else setCalleError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setCalleError("La calle es obligatoria");
                                  else setCalleError("");
                                }}
                              />
                              {calleError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{calleError}</p>}
                            </div>
                            <div className="relative pb-2">
                              <input
                                placeholder="Número"
                                className={inputClass + " text-[12px] py-2" + (numeroError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.numero}
                                onChange={e => {
                                  setForm((f: FormState) => ({ ...f, numero: e.target.value }));
                                  if (!e.target.value.trim()) setNumeroError("El número es obligatorio");
                                  else setNumeroError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setNumeroError("El número es obligatorio");
                                  else setNumeroError("");
                                }}
                              />
                              {numeroError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{numeroError}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mb-1">
                            <button
                              type="button"
                              onClick={() => buscarCoordenadas(composeDireccion(form))}
                              disabled={!(form.calle || form.colonia || form.codigoPostal)}
                              className="text-[10px] px-3 py-1 rounded-full bg-[#0D601E]/10 text-[#0D601E] hover:bg-[#0D601E]/20 font-bold disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              Calcular coordenadas en el mapa
                            </button>
                            {buscandoCoordenadas && (
                              <span className="text-[11px] text-[#769C7B] italic">Buscando coordenadas...</span>
                            )}
                          </div>
                          {geocodeError && (
                            <p className="text-[9px] text-red-500 mb-2 ml-4 italic bg-red-50 p-2 rounded border border-red-200">{geocodeError}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative pb-2">
                              <input
                                placeholder="Colonia"
                                disabled
                                className={inputClass.replace('bg-transparent', '') + " text-[12px] py-2 bg-gray-300 text-gray-800 border-gray-400 cursor-not-allowed" + (coloniaError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.colonia}
                                onChange={e => {
                                  setForm((f: FormState) => ({ ...f, colonia: e.target.value }));
                                  if (!e.target.value.trim()) setColoniaError("La colonia es obligatoria");
                                  else setColoniaError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setColoniaError("La colonia es obligatoria");
                                  else setColoniaError("");
                                }}
                              />
                              {coloniaError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{coloniaError}</p>}
                            </div>
                            <div className="relative pb-2">
                              <input
                                placeholder="Código Postal"
                                className={inputClass + " text-[12px] py-2" + (codigoPostalError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.codigoPostal}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                  setForm((f: FormState) => ({ ...f, codigoPostal: val, latitud: "", longitud: "" }));
                                  if (!val) setCodigoPostalError("El código postal es obligatorio");
                                  else if (!validateCP(val)) setCodigoPostalError("El código postal debe tener 5 dígitos");
                                  else setCodigoPostalError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setCodigoPostalError("El código postal es obligatorio");
                                  else if (!validateCP(e.target.value)) setCodigoPostalError("El código postal debe tener 5 dígitos");
                                  else setCodigoPostalError("");
                                }}
                                maxLength={5}
                              />
                              {codigoPostalError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{codigoPostalError}</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative pb-2">
                              <input
                                placeholder="Ciudad"
                                disabled
                                className={inputClass.replace('bg-transparent', '') + " text-[12px] py-2 bg-gray-300 text-gray-800 border-gray-400 cursor-not-allowed" + (ciudadError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.ciudad}
                                onChange={e => {
                                  setForm((f: FormState) => ({ ...f, ciudad: e.target.value }));
                                  if (!e.target.value.trim()) setCiudadError("La ciudad es obligatoria");
                                  else setCiudadError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setCiudadError("La ciudad es obligatoria");
                                  else setCiudadError("");
                                }}
                              />
                              {ciudadError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{ciudadError}</p>}
                            </div>
                            <div className="relative pb-2">
                              <input
                                placeholder="Estado"
                                disabled
                                className={inputClass.replace('bg-transparent', '') + " text-[12px] py-2 bg-gray-300 text-gray-800 border-gray-400 cursor-not-allowed" + (estadoError ? " border-red-500 bg-red-50/50" : "")}
                                value={form.estado}
                                onChange={e => {
                                  setForm((f: FormState) => ({ ...f, estado: e.target.value }));
                                  if (!e.target.value.trim()) setEstadoError("El estado es obligatorio");
                                  else setEstadoError("");
                                }}
                                onBlur={e => {
                                  if (!e.target.value.trim()) setEstadoError("El estado es obligatorio");
                                  else setEstadoError("");
                                }}
                              />
                              {estadoError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{estadoError}</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative pb-2 md:col-span-2">
                              <input
                                placeholder="Local (opcional)"
                                className={inputClass + " text-[12px] py-2"}
                                value={form.local}
                                onChange={e => setForm((f: FormState) => ({ ...f, local: e.target.value }))}
                              />
                            </div>
                            <div className="relative pb-2 md:col-span-2">
                              <input
                                placeholder="Referencias (opcional)"
                                className={inputClass + " text-[12px] py-2"}
                                value={form.referencias}
                                onChange={e => setForm((f: FormState) => ({ ...f, referencias: e.target.value }))}
                              />
                            </div>
                          </div>
                          {ubicacionError && (
                            <p className="text-[9px] text-red-500 mt-1 ml-4 italic">{ubicacionError}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative pb-2">
                            <label className="block text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-1">
                              Latitud {form.latitud && <span className="text-green-600 text-[9px]">OK</span>}
                            </label>
                            <input
                              placeholder="Ej: 20.6597"
                              className={inputClass + " text-[12px] py-2" + (form.latitud ? " bg-green-50" : "")}
                              value={form.latitud}
                              onChange={e => setForm((f: FormState) => ({ ...f, latitud: e.target.value }))}
                            />
                          </div>
                          <div className="relative pb-2">
                            <label className="block text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-1">
                              Longitud {form.longitud && <span className="text-green-600 text-[9px]">OK</span>}
                            </label>
                            <input
                              placeholder="Ej: -103.3496"
                              className={inputClass + " text-[12px] py-2" + (form.longitud ? " bg-green-50" : "")}
                              value={form.longitud}
                              onChange={e => setForm((f: FormState) => ({ ...f, longitud: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="p-2 bg-[#ECF4EE] rounded-2xl border border-[#0D601E]/20 text-[10px] text-[#1A4D2E] font-medium">
                           <FiInfo className="inline mr-1"/> {t('locationHelp')}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const isValid = await validateStep2();
                        if (isValid) setStep(2);
                      }} 
                      className={btnPrimary}
                    >
                      {t('nextPhotos')}
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2.5 pb-1">
                    <div className={cardClass.replace("p-6", "p-3.5 md:p-4.5") + " !rounded-[28px] w-fit mx-auto"}>
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-2 md:gap-2.5 items-stretch w-fit mx-auto">
                        <div className="w-full max-w-[260px] sm:max-w-[300px] md:max-w-[330px] flex flex-col">
                          <span className={labelClass + " ml-1"}>Logo del Negocio</span>
                          <label
                            className="block w-full aspect-square min-h-[240px] border-2 border-dashed border-[#769C7B]/40 rounded-2xl cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all relative overflow-hidden"
                            style={logoSquareSize ? { width: `${logoSquareSize}px`, height: `${logoSquareSize}px`, maxWidth: "100%" } : undefined}
                          >
                            {imagePreview.logoUrl ? (
                              <img src={imagePreview.logoUrl} alt="Logo preview" className="absolute inset-0 w-full h-full object-cover z-10" style={{ background: '#fff', width: '100%', height: '100%' }} />
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center px-2 text-center">
                                <FiImage size={30} className="text-[#769C7B] mb-2" />
                                <p className="text-[10px] md:text-xs font-black text-[#1A4D2E] uppercase leading-tight">{t('businessLogo')}</p>
                                <p className="text-[9px] text-red-500 mt-1 font-bold">* Obligatorio</p>
                              </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" ref={el => { logoInput.current = el; }} onChange={handleLogoChange} />
                            {logoError && <span className="text-[9px] text-red-500 mt-2 font-bold absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/80 px-2 rounded">{logoError}</span>}
                          </label>
                        </div>

                        <div className="w-full max-w-[260px] sm:max-w-[300px] md:max-w-[330px] flex flex-col">
                          <span className={labelClass + " ml-1"}>Galería del Establecimiento</span>
                          <div ref={galleryContentRef} className="space-y-0.5">
                            <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                              {Array.from({ length: GALLERY_SLOT_COUNT }, (_, i) => i).map((i) => (
                                <label key={i} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-[#769C7B]/40 rounded-2xl cursor-pointer hover:bg-[#F6F0E6]/50 transition-all relative overflow-hidden">
                                  {imagePreview.galeriaUrls[i] ? (
                                    <img src={imagePreview.galeriaUrls[i] as string} alt={`Galería preview ${i + 1}`} className="absolute inset-0 w-full h-full object-cover z-10" style={{ background: '#fff', width: '100%', height: '100%' }} />
                                  ) : (
                                    <>
                                      <FiImage className="text-[#769C7B] mb-1" size={18} />
                                      <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase">Foto {i + 1}</span>
                                    </>
                                  )}
                                  <input type="file" className="hidden" accept="image/*" ref={el => { fileInputs.current[i] = el; }} onChange={e => handleGaleriaChange(i, e)} />
                                  {galeriaErrors[i] && <span className="text-[8px] md:text-[9px] text-red-500 mt-1 font-bold absolute bottom-1 left-1/2 -translate-x-1/2 z-20 bg-white/85 px-1.5 rounded">{galeriaErrors[i]}</span>}
                                </label>
                              ))}
                            </div>
                            <div className="bg-[#F6F0E6] rounded-2xl border border-[#1A4D2E]/10 p-1.5 md:p-2">
                              <p className="text-[8px] md:text-[9px] text-[#1A4D2E] leading-relaxed italic">
                                <FiInfo className="inline mb-0.5 mr-1 text-[#0D601E]" />
                                <strong>Nota:</strong> Estas imágenes son clave para validar tu perfil. Podrás subir más fotos detalladas cuando sea aprobado.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const isValid = validateStep3();
                        if (isValid) setStep(3);
                      }} 
                      className={btnPrimary + " py-3 text-xs"}
                    >
                      Siguiente: Información adicional
                    </button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="h-full min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0.25 md:gap-0.5"
                    style={{ height: "100%" }}
                  >
                    <div className="flex items-center gap-2 px-1 text-[#1E3A29] shrink-0">
                      <FiInfo size={18} className="shrink-0 text-[#2E5A3D]" />
                      <h4 className="font-black uppercase text-[11px] md:text-xs tracking-tighter">Información complementaria</h4>
                    </div>

                    <div className={cardClass + " !bg-[#FBFAF7] !border-[#D6E0D7] hover:!border-[#D6E0D7] hover:!shadow-none !p-2.5 md:!p-3 min-h-0 overflow-hidden flex flex-col"}>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0.75 lg:gap-2 items-stretch flex-1 min-h-0">
                        <div className="lg:col-span-6 space-y-0.75 md:space-y-1">
                          <div>
                            <label className={labelClass + " mb-1"}>Descripción del Negocio</label>
                            <textarea
                              placeholder="Describe tu negocio, servicios y especialidades"
                              className={`w-full px-4 py-2 bg-white/70 border rounded-2xl outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-[12px] md:text-sm resize-none h-[92px] md:h-[18vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                                descripcionError ? "border-red-500 bg-red-50/50" : "border-[#1A4D2E]/20"
                              }`}
                              value={form.descripcion}
                              onChange={e => {
                                const nextValue = e.target.value;
                                setForm((f: FormState) => ({ ...f, descripcion: nextValue }));
                                if (nextValue.trim()) setDescripcionError("");
                              }}
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-red-500 italic min-h-[12px]">{descripcionError}</p>
                              <p className="text-[10px] text-[#769C7B]">{form.descripcion.length}/500</p>
                            </div>
                          </div>

                          <div className="relative pb-0">
                            <label className={labelClass + " mb-1"}>{t('websiteSocial')}</label>
                            <input
                              placeholder="https://tunegocio.com"
                              className={inputClass + " pl-11" + (sitioWebError ? " border-red-500 bg-red-50/50" : "")}
                              value={form.sitioWeb}
                              onChange={e => {
                                setForm((f: FormState) => ({ ...f, sitioWeb: e.target.value }));
                                if (!e.target.value.trim()) setSitioWebError("El sitio web es obligatorio");
                                else if (!validateURL(e.target.value)) setSitioWebError("URL no válida");
                                else setSitioWebError("");
                              }}
                              onBlur={e => {
                                if (!e.target.value.trim()) setSitioWebError("El sitio web o redes sociales son obligatorios");
                                else if (!validateURL(e.target.value)) setSitioWebError("URL no válida. Ej: https://facebook.com/tunegocio");
                                else setSitioWebError("");
                              }}
                            />
                            <FiGlobe className="absolute left-[22px] top-[39px] text-[#769C7B] pointer-events-none" size={16} />
                            {sitioWebError && <p className="text-[10px] text-red-500 mt-1 ml-1 italic">{sitioWebError}</p>}
                          </div>
                        </div>

                        <div className="lg:col-span-6 space-y-0.75 md:space-y-1 flex flex-col">
                          <div>
                            <label className={labelClass + " mb-1"}>Rango estimado (opcional)</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {COST_OPTIONS.map((option) => {
                                const isSelected = form.costoEstimado === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                      setForm((f: FormState) => ({
                                        ...f,
                                        costoEstimado: isSelected ? "" : option.value,
                                      }))
                                    }
                                    className={`flex min-h-[48px] flex-col items-center justify-center rounded-2xl border px-3 py-1.5 text-center transition-all active:scale-[0.98] ${
                                      isSelected
                                        ? "border-[#0D601E] bg-[#0D601E] text-white shadow-[0_8px_18px_rgba(13,96,30,0.18)]"
                                        : "border-[#C9D4CB] bg-white text-[#1F3528] hover:border-[#8BA592] hover:bg-[#FAFCFA]"
                                    }`}
                                  >
                                    <span className={`w-full text-center text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-white/85" : "text-[#5C7564]"}`}>
                                      {option.label}
                                    </span>
                                    <span className="mt-0.5 w-full text-center text-[13px] font-black leading-none">{option.accent}</span>
                                    <span className={`mt-0.5 w-full text-center text-[10px] font-semibold ${isSelected ? "text-white/85" : "text-[#5C7564]"}`}>
                                      {option.value}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="mt-1 text-[10px] text-[#5C7564] italic text-center">
                              {form.costoEstimado ? `Seleccionado: ${form.costoEstimado}` : "Toca un rango para definir el costo estimado"}
                            </p>
                          </div>

                          <div className="mt-0.5">
                            <label className={labelClass + " mb-1"}>Tiempo sugerido (opcional)</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="Ej. 1.5"
                                className={inputClass + " pr-20"}
                                value={form.tiempoSugerido}
                                onChange={(e) => setForm((f: FormState) => ({ ...f, tiempoSugerido: e.target.value }))}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5C7564] font-bold">horas</span>
                            </div>
                          </div>

                        </div>

                        <div className="lg:col-span-6 mt-0.25 md:mt-0.5 h-full flex flex-col">
                          <label className={labelClass + " mb-1"}>Subcategorías (palabras clave)</label>
                          <div className="border border-[#C9D4CB] rounded-2xl p-1.5 bg-white min-h-[96px] md:min-h-[22vh] flex flex-col">
                            <input
                              placeholder="Escribe subcategoría y presiona Enter"
                              className={inputClass}
                              value={subcategoriaInput}
                              onChange={(e) => setSubcategoriaInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  addSubcategory(subcategoriaInput);
                                }
                              }}
                              onBlur={() => {
                                if (subcategoriaInput.trim()) addSubcategory(subcategoriaInput);
                              }}
                            />
                            <div className="mt-1.5 flex flex-wrap gap-1.5 min-h-[36px] md:min-h-[15vh]">
                              {form.subcategorias.slice(0, 6).map((sub) => (
                                <span key={sub} className="inline-flex items-center gap-1 bg-[#EEF4EF] text-[#245038] border border-[#C9D4CB] px-2.5 py-1 rounded-full text-[11px] font-bold">
                                  {sub}
                                  <button type="button" onClick={() => removeSubcategory(sub)} className="text-[#8B0000] font-black">x</button>
                                </span>
                              ))}
                              {form.subcategorias.length > 6 && (
                                <span className="inline-flex items-center bg-[#EEF4EF] text-[#245038] border border-[#C9D4CB] px-2.5 py-1 rounded-full text-[11px] font-bold">
                                  +{form.subcategorias.length - 6}
                                </span>
                              )}
                            </div>
                          </div>
                          {subcategoriasError && <p className="text-[10px] text-red-500 mt-1 italic">{subcategoriasError}</p>}
                        </div>

                        <div className="lg:col-span-6 mt-0.25 md:mt-0.5 shrink-0 h-full flex flex-col">
                          <label className={labelClass + " mb-1"}>Horario (opcional)</label>
                          <div className="border border-[#C9D4CB] rounded-2xl p-1 bg-white min-h-[96px] md:min-h-[24vh] flex flex-col">
                            <div className="flex h-full flex-col gap-2">
                              <div className="min-w-0 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-[#1F3528]">
                                  <FiClock size={13} className="text-[#2E5A3D]" />
                                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide">
                                    {enabledScheduleCount > 0 ? `${enabledScheduleCount} día(s) configurado(s)` : "Sin horario configurado"}
                                  </p>
                                </div>

                                {activeSchedulePreview.length > 0 && (
                                  <div
                                    className={`grid gap-1 mt-1 flex-1 min-h-0 ${
                                      schedulePreviewCards.length === 4
                                        ? "grid-cols-2 grid-rows-2 auto-rows-fr content-center"
                                        : "grid-cols-1 sm:grid-cols-2 place-content-center"
                                    }`}
                                  >
                                    {schedulePreviewCards.map((item) => {
                                      const compactLabel = item.label.slice(0, 3);
                                      const compactOpen = item.open.replace(":00", "");
                                      const compactClose = item.close.replace(":00", "");
                                      return (
                                        <div key={item.label} className="rounded-lg border border-[#BFD0C2] bg-[#F8FBF8] px-2 py-1 min-w-0 h-full flex items-center justify-center">
                                          <p className="text-[10px] md:text-[11px] font-black text-[#245038] leading-tight truncate uppercase text-center">
                                            {compactLabel} {compactOpen}-{compactClose}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {scheduleOverflowText && (
                                  <p className="mt-1 text-[10px] font-semibold text-[#5C7564] italic leading-tight truncate text-center">
                                    Más días: {scheduleOverflowText}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#0A4D19] bg-[#0D601E] text-white text-[11px] md:text-[12px] font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95 shadow-[0_6px_16px_rgba(13,96,30,0.22)] mt-1"
                              >
                                <FiPlus size={13} />
                                Agregar Horario
                              </button>
                            </div>
                          </div>
                          {horarioError && <p className="text-[10px] text-red-500 mt-1 italic">{horarioError}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0 pb-0">
                      <button
                        onClick={async () => {
                          const isValid = await validateStep4();
                          if (isValid) setStep(4);
                        }}
                        className={btnPrimary + " shadow-[0_10px_24px_rgba(13,96,30,0.16)] text-[11px] md:text-xs py-2"}
                      >
                        Siguiente: Información Fiscal
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className={cardClass}>
                      <div className="flex items-center gap-2 mb-4 text-[#0D601E]">
                        <FiUser size={20} />
                        <h4 className="font-bold uppercase text-xs tracking-tighter">{t('billing')}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative pb-5">
                          <input 
                            placeholder={t('companyRFC')} 
                            className={`${inputClass} uppercase ${rfcError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={form.rfc}
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, rfc: e.target.value.toUpperCase() }));
                              if (!validateRFC(e.target.value.toUpperCase())) setRfcError("RFC inválido");
                              else setRfcError("");
                            }}
                            onBlur={e => {
                              if (!validateRFC(e.target.value.toUpperCase())) setRfcError("RFC inválido");
                              else setRfcError("");
                            }}
                            maxLength={13}
                          />
                          {rfcError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{rfcError}</p>}
                        </div>
                        <div className="relative pb-5">
                          <input 
                            placeholder={t('fiscalPostalCode')} 
                            className={`${inputClass} ${cpError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={form.cp}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setForm((f: FormState) => ({ ...f, cp: val }));
                              if (!validateCP(val)) setCpError("CP inválido");
                              else setCpError("");
                            }}
                            onBlur={e => {
                              if (!validateCP(e.target.value)) setCpError("CP inválido");
                              else setCpError("");
                            }}
                            maxLength={5}
                          />
                          {cpError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{cpError}</p>}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFinish} className={btnFinish}>{t('finalizeAlliance')}</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center min-h-[400px]">
              {!success ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
                    <Image src={imglogo} alt="Cargando" fill sizes="(max-width: 768px) 128px, 192px" className="object-contain" />
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>{t('validatingCompany')}</h3>
                  <p className="text-[#769C7B] italic mt-2">{t('reviewingProfile')}</p>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="mb-8">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="60" cy="60" r="56" stroke="#0D601E" strokeWidth="8" fill="#fff" />
                      <path d="M38 65L54 81L84 51" stroke="#0D601E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-black text-[#0D601E] uppercase mb-2" style={{ fontFamily: 'var(--font-jockey)' }}>¡Negocio enviado!</h3>
                  <p className="text-[#0D601E] text-lg font-bold mb-2">Tu negocio se ha guardado y está en revisión.</p>
                  <p className="text-[#769C7B] italic">Te avisaremos cuando haya sido aprobado.</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isScheduleModalOpen && (
          <motion.div
            className="absolute inset-0 z-[330] flex items-center justify-center p-3 sm:p-5 bg-black/45 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-[700px] rounded-[28px] bg-[#F8F4EC] border border-[#1A4D2E]/20 shadow-2xl p-4 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-[#8B0000] text-xl sm:text-2xl font-black uppercase leading-none" style={{ fontFamily: 'var(--font-jockey)' }}>
                    Horario del negocio
                  </h3>
                  <p className="text-[#1A4D2E] italic text-xs sm:text-sm mt-1">Configuralo rapido por bloques y ajusta solo lo necesario.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 transition-all"
                  aria-label="Cerrar modal de horario"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="rounded-2xl border border-[#1A4D2E]/15 bg-white/90 p-3 sm:p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetSchedule(WEEKDAY_KEYS, "09:00", "18:00")}
                    className="px-3 py-1.5 rounded-full border border-[#0D601E]/20 bg-[#0D601E]/10 text-[#0D601E] text-[11px] font-bold uppercase tracking-wide hover:bg-[#0D601E]/20 transition-all"
                  >
                    Lunes a Viernes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetSchedule(DAY_LABELS.map((day) => day.key), "10:00", "22:00")}
                    className="px-3 py-1.5 rounded-full border border-[#0D601E]/20 bg-[#0D601E]/10 text-[#0D601E] text-[11px] font-bold uppercase tracking-wide hover:bg-[#0D601E]/20 transition-all"
                  >
                    Todos los dias
                  </button>
                  <button
                    type="button"
                    onClick={clearAllSchedules}
                    className="px-3 py-1.5 rounded-full border border-[#8B0000]/20 bg-[#8B0000]/10 text-[#8B0000] text-[11px] font-bold uppercase tracking-wide hover:bg-[#8B0000]/20 transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B] mb-2">Selecciona dias</p>
                  <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map((day) => {
                      const isSelected = scheduleSelection.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleScheduleSelection(day.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border transition-all ${
                            isSelected
                              ? "bg-[#0D601E] text-white border-[#0D601E]"
                              : "bg-white text-[#1A4D2E] border-[#1A4D2E]/20 hover:bg-[#F3EEE4]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="time"
                    value={bulkOpenTime}
                    onChange={(e) => setBulkOpenTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1A4D2E]/20 text-sm font-semibold text-[#1A4D2E] bg-white"
                  />
                  <input
                    type="time"
                    value={bulkCloseTime}
                    onChange={(e) => setBulkCloseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1A4D2E]/20 text-sm font-semibold text-[#1A4D2E] bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyScheduleToSelection}
                    className="px-4 py-2.5 rounded-full bg-[#0D601E] text-white text-xs font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95"
                  >
                    Aplicar
                  </button>
                </div>
                {enabledScheduleCount > 0 && (
                  <div className="rounded-2xl border border-[#1A4D2E]/15 bg-[#FDFBF7] p-3 sm:p-4">
                    <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B] mb-2">Dias activos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DAY_LABELS.filter((day) => form.horario[day.key].enabled).map((day) => (
                        <div
                          key={day.key}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#1A4D2E]/15 bg-white px-3 py-2"
                        >
                          <div>
                            <p className="text-[11px] uppercase tracking-wide font-bold text-[#769C7B]">{day.label}</p>
                            <p className="text-sm font-bold text-[#1A4D2E]">{form.horario[day.key].open} - {form.horario[day.key].close}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => disableScheduleDay(day.key)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-[#8B0000]/25 text-[#8B0000] font-bold hover:bg-[#8B0000]/10 transition-all"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-[#0D601E] text-white text-xs font-black uppercase tracking-wide hover:bg-[#094d18] transition-all active:scale-95"
                  >
                    Listo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessModal;


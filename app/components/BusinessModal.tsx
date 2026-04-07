"use client";
import { useTranslations } from 'next-intl';
import { usePitzbolUser } from "@/lib/usePitzbolUser";
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
  galeria: (File | null)[];
  logo: File | null;
}
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { 
  FiX, FiBriefcase, FiMapPin, FiGlobe, FiImage, 
  FiChevronLeft, FiCheckCircle, FiInfo, FiTag, FiUser, FiChevronDown
} from "react-icons/fi";
import Image from "next/image";
import imglogo from "./logoPitzbol.png";
import MinimapaLocationPicker from "./MinimapaLocationPicker";
  type ImagePreviewState = {
    logoUrl: string | null;
    galeriaUrls: (string | null)[];
  };

const BusinessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const t = useTranslations('businessModal');
  const tCommon = useTranslations('common');
  const pitzbolUser = usePitzbolUser();
  
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);


  // Estado persistente para los datos del negocio, inicializando desde localStorage si existe
  const [form, setForm] = useState(() => {
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
      galeria: [null, null, null],
      logo: null
    } as FormState;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Los Files no se guardan, siempre empezar como null
        return {
          ...defaults,
          ...parsed,
          galeria: [null, null, null],
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
  const [saveError, setSaveError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    logoUrl: null,
    galeriaUrls: [null, null, null],
  });
  
  // Estado separado para los archivos File (no se puede serializar en localStorage)
  const [files, setFiles] = useState<{ logo: File | null; galeria: (File | null)[] }>({
    logo: null,
    galeria: [null, null, null]
  });
  
  const [galeriaErrors, setGaleriaErrors] = useState<string[]>(["", "", ""]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const lastGeocodeRef = useRef<string>("");
  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualMapChangeRef = useRef<boolean>(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
      setGeocodeError("");
    }
  }, [isOpen]);

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
      descripcion: form.descripcion
    };
    localStorage.setItem("pitzbol_business_draft", JSON.stringify(formToSave));
  }, [form]);

  // Las previsualizaciones pueden exceder fácilmente la cuota de localStorage.
  // No se persisten entre recargas para evitar QuotaExceededError.
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    localStorage.removeItem("pitzbol_business_images");
  }, [isOpen]);

  // Función para obtener coordenadas usando el endpoint del backend
  const buscarCoordenadas = async (direccion: string) => {
    if (!direccion.trim()) return;

    setBuscandoCoordenadas(true);
    setGeocodeError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/lugares/geocode`, {
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
      console.log('📍 Reverse Geocoding Response:', address);
      
      // Extraer información
      const calle = address.address?.road || '';
      const ciudad = address.address?.city || address.address?.town || address.address?.municipality || '';
      const estado = address.address?.state || '';
      const colonia = address.address?.neighbourhood || address.address?.suburb || address.address?.village || address.address?.hamlet || address.address?.county || '';
      const numero = address.address?.house_number || '';
      const codigoPostal = address.address?.postcode || '';
      
      // Solo actualizar calle si fue un cambio manual del marcador
      const isManualChange = isManualMapChangeRef.current;
      console.log('🔄 Cambio manual del mapa:', isManualChange);
      
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
    // Solo si tiene CALLE + (COLONIA O CÓDIGO POSTAL) y no tiene coordenadas
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
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
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

      const res = await fetch("http://localhost:3001/api/business/validate-uniqueness", {
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
      const res = await fetch("http://localhost:3001/api/business/validate-uniqueness", {
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

  // Función para validar el paso 2 antes de avanzar
  const validateStep2 = async () => {
    setLogoError("");
    setUbicacionError("");
    setCalleError("");
    setNumeroError("");
    setColoniaError("");
    setCodigoPostalError("");
    setCiudadError("");
    setEstadoError("");
    setSitioWebError("");

    let hasErrors = false;

    // Validar logo (usar files.logo en lugar de form.logo)
    if (!files.logo && !imagePreview.logoUrl) {
      setLogoError("El logo del negocio es obligatorio");
      hasErrors = true;
    }

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
        const res = await fetch("http://localhost:3001/api/business/validate-uniqueness", {
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

    // Validar sitio web
    if (!form.sitioWeb.trim()) {
      setSitioWebError("El sitio web o redes sociales son obligatorios");
      hasErrors = true;
    } else if (!validateURL(form.sitioWeb)) {
      setSitioWebError("URL no válida. Ejemplo: https://facebook.com/tunegocio");
      hasErrors = true;
    } else {
      // Validar unicidad de sitio web
      try {
        const res = await fetch("http://localhost:3001/api/business/validate-uniqueness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website: form.sitioWeb })
        });

        const data = await res.json();
        if (!data.valid && data.errors?.website) {
          setSitioWebError(data.errors.website);
          hasErrors = true;
        }
      } catch (error) {
        console.error("Error validando sitio web:", error);
      }
    }

    return !hasErrors;
  };

  // Función para validar el paso 3 antes de avanzar
  const validateStep3 = () => {
    setDescripcionError("");

    if (!form.descripcion.trim()) {
      setDescripcionError("La descripción del negocio es obligatoria");
      return false;
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
    if (!form.descripcion.trim()) {
      setDescripcionError("La descripción del negocio es obligatoria");
      if (firstErrorStep === null) firstErrorStep = 2;
    }
    if (!validateRFC(form.rfc)) {
      setRfcError("RFC inválido");
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (!validateCP(form.cp)) {
      setCpError("CP inválido");
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (firstErrorStep !== null) {
      setStep(firstErrorStep);
      return;
    }

    // Validar unicidad de RFC y CP
    try {
      const res = await fetch("http://localhost:3001/api/business/validate-uniqueness", {
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
          setStep(3);
          return;
        }
        if (data.errors.cp) {
          setCpError(data.errors.cp);
          setStep(3);
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
        console.log("[BusinessModal] ✅ ownerUid obtenido del hook usePitzbolUser:", ownerUid);
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
        console.warn("[BusinessModal] ⚠️ No se pudo obtener ownerUid, la notificación no llegará al usuario");
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
      if (ownerUid) {
        formData.append("ownerUid", ownerUid);
        console.log("[BusinessModal] ✅ ownerUid agregado al FormData:", ownerUid);
      } else {
        console.log("[BusinessModal] ⚠️ No se agregó ownerUid porque es undefined");
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
        rfc: form.rfc,
        cp: form.cp,
        description: form.descripcion || "NO PRESENTE",
        ownerUid: ownerUid || "NO PRESENTE",
        logo: files.logo || imagePreview.logoUrl ? "Presente" : "NO PRESENTE",
        galeria: (files.galeria.filter(f => f).length + imagePreview.galeriaUrls.filter(u => u).length) + " archivos"
      });
      
      const res = await fetch("http://localhost:3001/api/business/register-with-images", {
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
      localStorage.removeItem("pitzbol_business_images");
      setFiles({ logo: null, galeria: [null, null, null] });

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
  const labelClass = "text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-4 mb-2 block";
  const cardClass = "bg-[#F6F0E6]/20 p-6 rounded-[35px] border border-[#1A4D2E]/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,96,30,0.1)] hover:border-[#0D601E]/80";
  
  const btnPrimary = "w-full bg-[#0D601E] text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#094d18] transition-all active:scale-95";
  const btnFinish = "w-full bg-[#8B0000] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] transition-transform active:scale-95";
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white w-full rounded-[50px] shadow-2xl border border-white/20 ${
          step === 1
            ? "max-w-[900px] max-h-[92vh] overflow-hidden p-4 md:p-6"
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
              <div className={`text-center ${step === 1 ? "mb-5" : "mb-6"}`}>
                <h2 className={`${step === 1 ? "text-[22px] md:text-[28px]" : "text-[28px] md:text-[36px]"} text-[#8B0000] font-black uppercase leading-none`} style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0 ? t('step1Title') : step === 1 ? t('step2Title') : step === 2 ? t('step3Title') : t('step4Title')}
                </h2>
                <p className={`${step === 1 ? "text-xs" : "text-sm"} text-[#1A4D2E] italic mt-1`}>{t('stepProgress', { current: step + 1, total: 4 })}</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.25fr] gap-2">
                      <div className="flex flex-col gap-2 h-full">
                        <div className="p-2 rounded-[24px] border border-[#1A4D2E]/10 bg-[#F6F0E6]/30 min-h-[140px]">
                          <span className="block text-[10px] uppercase tracking-widest text-[#769C7B] font-bold ml-2 mb-1">
                            Ubicación en el mapa
                          </span>
                          <MinimapaLocationPicker
                            latitud={form.latitud}
                            longitud={form.longitud}
                            onLocationChange={(lat, lng) => {
                              console.log("📍 MinimapaLocationPicker - Coordenadas actualizadas:", { lat, lng });
                              // Marcar que este cambio SÍ es manual (usuario movió el marcador)
                              isManualMapChangeRef.current = true;
                              setForm((f: FormState) => ({
                                ...f,
                                latitud: lat,
                                longitud: lng
                              }));
                            }}
                            height="180px"
                          />
                        </div>
                        <label className="flex-1 flex flex-col items-center justify-center w-full border-2 border-dashed border-[#769C7B]/40 rounded-[24px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all relative min-h-[100px]">
                          {imagePreview.logoUrl ? (
                            <img src={imagePreview.logoUrl} alt="Logo preview" className="absolute inset-0 w-full h-full object-cover rounded-[24px] z-10" style={{background: '#fff', width: '100%', height: '100%'}} />
                          ) : (
                            <>
                              <FiImage size={32} className="text-[#769C7B] mb-2"/>
                              <p className="text-sm font-black text-[#1A4D2E] uppercase">{t('businessLogo')}</p>
                              <p className="text-[9px] text-red-500 mt-1 font-bold">* Obligatorio</p>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*" ref={el => { logoInput.current = el; }} onChange={handleLogoChange} />
                          {logoError && <span className="text-[10px] text-red-500 mt-2 font-bold absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/80 px-2 rounded">{logoError}</span>}
                        </label>
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
                              <span className="text-[11px] text-[#769C7B] italic">Buscando coordenadas…</span>
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
                              Latitud {form.latitud && <span className="text-green-600 text-[9px]">✓</span>}
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
                              Longitud {form.longitud && <span className="text-green-600 text-[9px]">✓</span>}
                            </label>
                            <input
                              placeholder="Ej: -103.3496"
                              className={inputClass + " text-[12px] py-2" + (form.longitud ? " bg-green-50" : "")}
                              value={form.longitud}
                              onChange={e => setForm((f: FormState) => ({ ...f, longitud: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="relative pb-2">
                          <input 
                            placeholder={t('websiteSocial')} 
                            className={inputClass + " pl-11 text-[12px] py-2.5" + (sitioWebError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.sitioWeb} 
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, sitioWeb: e.target.value }));
                              if (!e.target.value.trim()) setSitioWebError("El sitio web es obligatorio");
                              else if (!validateURL(e.target.value)) setSitioWebError("URL no válida");
                              else setSitioWebError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) {
                                setSitioWebError("El sitio web o redes sociales son obligatorios");
                              } else if (!validateURL(e.target.value)) {
                                setSitioWebError("URL no válida. Ej: https://facebook.com/tunegocio");
                              } else {
                                setSitioWebError("");
                              }
                            }}
                          />
                          <FiGlobe className="absolute left-[22px] top-[10px] text-[#769C7B] pointer-events-none" size={16} />
                          {sitioWebError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0 bottom-0">{sitioWebError}</p>}
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
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                    <div className="bg-[#F6F0E6]/20 p-4 rounded-[35px] border border-[#1A4D2E]/10">
                      <span className="text-[10px] uppercase tracking-widest text-[#769C7B] font-bold mb-2 block">Descripción del Negocio</span>
                      <textarea
                        placeholder="Describe tu negocio, servicios y especialidades"
                        className={`w-full px-4 py-2 bg-white/70 border rounded-2xl outline-none text-[#1A4D2E] transition-all focus:border-[#0D601E] focus:ring-2 focus:ring-[#0D601E]/10 placeholder:text-gray-500 text-xs resize-none h-[60px] ${
                          descripcionError ? "border-red-500 bg-red-50/50" : "border-[#1A4D2E]/20"
                        }`}
                        value={form.descripcion}
                        onChange={e => {
                          const nextValue = e.target.value;
                          setForm((f: FormState) => ({ ...f, descripcion: nextValue }));
                          if (nextValue.trim()) {
                            setDescripcionError("");
                          }
                        }}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[9px] text-red-500 italic min-h-[12px]">{descripcionError}</p>
                        <p className="text-[9px] text-[#769C7B]">{form.descripcion.length}/500</p>
                      </div>
                    </div>

                    <div className={cardClass.replace("p-6", "p-4")}>
                      <span className={labelClass}>Galería del Establecimiento</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[0, 1, 2].map((i) => (
                          <label key={i} className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-[#769C7B]/40 rounded-3xl cursor-pointer hover:bg-[#F6F0E6]/50 transition-all relative">
                            {imagePreview.galeriaUrls[i] ? (
                              <img src={imagePreview.galeriaUrls[i] as string} alt={`Galería preview ${i+1}`} className="absolute inset-0 w-full h-full object-cover rounded-3xl z-10" style={{background: '#fff', width: '100%', height: '100%'}} />
                            ) : (
                              <>
                                <FiImage className="text-[#769C7B] mb-1" size={20} />
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Foto {i + 1}</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/*" ref={el => { fileInputs.current[i] = el; }} onChange={e => handleGaleriaChange(i, e)} />
                            {galeriaErrors[i] && <span className="text-[9px] text-red-500 mt-1 font-bold absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/80 px-2 rounded">{galeriaErrors[i]}</span>}
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 bg-[#F6F0E6] rounded-2xl border border-[#1A4D2E]/10 p-2.5">
                        <p className="text-[9px] text-[#1A4D2E] leading-relaxed italic">
                          <FiInfo className="inline mb-0.5 mr-1 text-[#0D601E]"/>
                          <strong>Nota:</strong> Estas imágenes son clave para validar tu perfil. Podrás subir más fotos detalladas cuando sea aprobado.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const isValid = validateStep3();
                        if (isValid) setStep(3);
                      }} 
                      className={btnPrimary}
                    >
                      Siguiente: Datos Fiscales
                    </button>
                  </motion.div>
                )}

                {step === 3 && (
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
    </div>
  );
};

export default BusinessModal;
"use client";
import { useTranslations } from 'next-intl';
interface FormState {
  nombre: string;
  categoria: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  sitioWeb: string;
  rfc: string;
  cp: string;
  galeria: (string | null)[];
  logo: string | null;
}
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import { 
  FiX, FiBriefcase, FiMapPin, FiGlobe, FiImage, 
  FiChevronLeft, FiCheckCircle, FiInfo, FiTag, FiUser, FiChevronDown
} from "react-icons/fi";
import Image from "next/image";
import imglogo from "./logoPitzbol.png";
  type ImagePreviewState = {
    logoUrl: string | null;
    galeriaUrls: (string | null)[];
  };

const BusinessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const t = useTranslations('businessModal');
  const tCommon = useTranslations('common');
  
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);


  // Estado persistente para los datos del negocio, inicializando desde localStorage si existe
  const [form, setForm] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pitzbol_business_draft") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      nombre: "",
      categoria: "",
      correo: "",
      telefono: "",
      ubicacion: "",
      sitioWeb: "",
      rfc: "",
      cp: "",
      galeria: [null, null, null],
      logo: null
    } as FormState;
  });
  const [rfcError, setRfcError] = useState(false);
  const [cpError, setCpError] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [categoriaError, setCategoriaError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({ logoUrl: null, galeriaUrls: [null, null, null] });
    const [galeriaErrors, setGaleriaErrors] = useState<string[]>(["", "", ""]);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const logoInput = useRef<HTMLInputElement | null>(null);

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
        setForm((f: FormState) => ({ ...f, logo: null }));
        setImagePreview(prev => ({ ...prev, logoUrl: null }));
        console.error("[Logo]", error);
        return;
      }
      setLogoError("");
      const reader = new FileReader();
      reader.onload = ev => {
        setImagePreview(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
        setForm((f: FormState) => ({ ...f, logo: file.name }));
        console.log("[Logo] Imagen cargada correctamente:", file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoError("");
      setImagePreview(prev => ({ ...prev, logoUrl: null }));
      setForm((f: FormState) => ({ ...f, logo: null }));
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
        setForm((f: FormState) => {
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
        setForm((f: FormState) => {
          const gal = [...f.galeria];
          gal[i] = file.name;
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
      setForm((f: FormState) => {
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
      setRfcError(false);
      setCpError(false);
      setSaveError("");
    }
  }, [isOpen]);

  // Guardar automáticamente en localStorage cada vez que cambia form
  useEffect(() => {
    localStorage.setItem("pitzbol_business_draft", JSON.stringify(form));
  }, [form]);


  const validateEmail = (valor: string) => {
    if (!valor) return false;
    // Regex simple para email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  };
  const validateRFC = (valor: string) => {
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
    return valor !== "" && rfcRegex.test(valor);
  };
  const validateCP = (valor: string) => {
    return valor !== "" && /^\d{5}$/.test(valor);
  };


  // Guardar en Firestore
  const [success, setSuccess] = useState(false);
  const handleFinish = async () => {
    setSaveError("");
    setEmailError("");
    setNombreError("");
    setCategoriaError("");
    setRfcError(false);
    setCpError(false);
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
    if (!validateRFC(form.rfc)) {
      setRfcError(true);
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (!validateCP(form.cp)) {
      setCpError(true);
      if (firstErrorStep === null) firstErrorStep = 3;
    }
    if (firstErrorStep !== null) {
      setStep(firstErrorStep);
      return;
    }
    setIsFinishing(true);
    setSuccess(false);
    try {
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const res = await fetch("http://localhost:3001/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.correo,
          password: tempPassword,
          businessName: form.nombre,
          category: form.categoria,
          phone: form.telefono,
          location: form.ubicacion,
          website: form.sitioWeb,
          rfc: form.rfc,
          cp: form.cp
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.message || "Error al guardar el negocio. Intenta de nuevo.");
        setIsFinishing(false);
        return;
      }
      localStorage.removeItem("pitzbol_business_draft");
      setSuccess(true);
      setTimeout(() => {
        setIsFinishing(false);
        setSuccess(false);
        onClose();
      }, 3500);
    } catch (e) {
      setSaveError("Error de red al guardar el negocio. Intenta de nuevo.");
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
        className="relative bg-white w-full max-w-[850px] min-h-[500px] max-h-[90vh] overflow-y-auto rounded-[50px] shadow-2xl p-8 md:p-12 border border-white/20"
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
              <div className="text-center mb-10">
                <h2 className="text-[32px] md:text-[42px] text-[#8B0000] font-black uppercase leading-none" style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 0 ? t('step1Title') : step === 1 ? t('step2Title') : step === 2 ? t('step3Title') : t('step4Title')}
                </h2>
                <p className="text-[#1A4D2E] text-sm italic mt-1">{t('stepProgress', { current: step + 1, total: 4 })}</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className={cardClass}>
                      <span className={labelClass}>{t('brandIdentity')}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input 
                            placeholder={t('businessName')} 
                            className={inputClass + (nombreError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.nombre} 
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, nombre: e.target.value }));
                              if (!e.target.value.trim()) setNombreError(t('nameRequired'));
                              else setNombreError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) setNombreError(t('nameRequired'));
                              else setNombreError("");
                            }}
                          />
                          {nombreError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0">{nombreError}</p>}
                        </div>
                        <div className="relative">
                          <select 
                            className={inputClass + " appearance-none cursor-pointer pr-10" + (categoriaError ? " border-red-500 bg-red-50/50" : "")}
                            value={form.categoria}
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, categoria: e.target.value }));
                              if (!e.target.value.trim()) setCategoriaError(t('categoryRequired'));
                              else setCategoriaError("");
                            }}
                            onBlur={e => {
                              if (!e.target.value.trim()) setCategoriaError(t('categoryRequired'));
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
                          {categoriaError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0">{categoriaError}</p>}
                        </div>
                      </div>
                    </div>
                    <div className={cardClass}>
                      <span className={labelClass}>{t('officialContact')}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input 
                            placeholder={t('businessEmail')} 
                            className={inputClass + (emailError ? " border-red-500 bg-red-50/50" : "")} 
                            value={form.correo} 
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, correo: e.target.value }));
                              if (!validateEmail(e.target.value)) setEmailError(t('invalidEmail'));
                              else setEmailError("");
                            }}
                            onBlur={e => {
                              if (!validateEmail(e.target.value)) setEmailError(t('invalidEmail'));
                              else setEmailError("");
                            }}
                          />
                          {emailError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic absolute left-0">{emailError}</p>}
                        </div>
                        <input placeholder={t('whatsappPhone')} className={inputClass} value={form.telefono} onChange={e => setForm((f: FormState) => ({ ...f, telefono: e.target.value }))} />
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className={btnPrimary}>
                      {t('nextStep')}
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#769C7B]/40 rounded-[35px] cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 transition-all relative">
                        {imagePreview.logoUrl ? (
                          <img src={imagePreview.logoUrl} alt="Logo preview" className="absolute inset-0 w-full h-full object-cover rounded-[35px] z-10" style={{background: '#fff', width: '100%', height: '100%'}} />
                        ) : (
                          <>
                            <FiImage size={32} className="text-[#769C7B] mb-2"/>
                            <p className="text-sm font-black text-[#1A4D2E] uppercase">{t('businessLogo')}</p>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" ref={el => { logoInput.current = el; }} onChange={handleLogoChange} />
                        {logoError && <span className="text-[10px] text-red-500 mt-2 font-bold absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/80 px-2 rounded">{logoError}</span>}
                      </label>
                      <div className="space-y-4">
                        <div className="relative">
                          <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
                          <input placeholder={t('googleMapsLocation')} className={inputClass + " pl-14"} value={form.ubicacion} onChange={e => setForm((f: FormState) => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                        <div className="relative">
                          <FiGlobe className="absolute left-5 top-1/2 -translate-y-1/2 text-[#769C7B]" />
                          <input placeholder={t('websiteSocial')} className={inputClass + " pl-14"} value={form.sitioWeb} onChange={e => setForm((f: FormState) => ({ ...f, sitioWeb: e.target.value }))} />
                        </div>
                        <div className="p-4 bg-[#0D601E]/5 rounded-2xl border border-[#0D601E]/10 italic text-[10px] text-gray-500">
                           <FiInfo className="inline mr-1"/> {t('locationHelp')}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className={btnPrimary}>{t('nextPhotos')}</button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className={cardClass}>
                      <span className={labelClass}>Galería del Establecimiento</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[0, 1, 2].map((i) => (
                          <label key={i} className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#769C7B]/40 rounded-3xl cursor-pointer hover:bg-[#F6F0E6]/50 transition-all relative">
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
                      <div className="mt-6 p-4 bg-[#F6F0E6] rounded-2xl border border-[#1A4D2E]/10">
                        <p className="text-[11px] text-[#1A4D2E] leading-relaxed italic">
                          <FiInfo className="inline mb-1 mr-2 text-[#0D601E]"/> 
                          <strong>Nota:</strong> Estas imágenes son fundamentales para validar la autenticidad de tu perfil. 
                          Podrás subir más fotos detalladas una vez que tu cuenta sea aprobada.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setStep(3)} className={btnPrimary}>Siguiente: Datos Fiscales</button>
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
                        <div className="relative">
                          <input 
                            placeholder={t('companyRFC')} 
                            className={`${inputClass} uppercase ${rfcError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={form.rfc}
                            onChange={e => {
                              setForm((f: FormState) => ({ ...f, rfc: e.target.value.toUpperCase() }));
                              if (!validateRFC(e.target.value.toUpperCase())) setRfcError(true);
                              else setRfcError(false);
                            }}
                            onBlur={e => {
                              if (!validateRFC(e.target.value.toUpperCase())) setRfcError(true);
                              else setRfcError(false);
                            }}
                            maxLength={13}
                          />
                          {rfcError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic">{t('rfcInvalid')}</p>}
                        </div>
                        <div className="relative">
                          <input 
                            placeholder={t('fiscalPostalCode')} 
                            className={`${inputClass} ${cpError ? "border-red-500 bg-red-50/50" : ""}`}
                            value={form.cp}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setForm((f: FormState) => ({ ...f, cp: val }));
                              if (!validateCP(val)) setCpError(true);
                              else setCpError(false);
                            }}
                            onBlur={e => {
                              if (!validateCP(e.target.value)) setCpError(true);
                              else setCpError(false);
                            }}
                            maxLength={5}
                          />
                          {cpError && <p className="text-[9px] text-red-500 mt-1 ml-4 italic">{t('cpInvalid')}</p>}
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
                    <Image src={imglogo} alt="Cargando" fill className="object-contain" />
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
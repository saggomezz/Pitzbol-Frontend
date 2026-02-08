"use client";
import { ensureFaceApiReady } from "../initTF";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FiCheck, FiChevronLeft, FiFileText, FiShield, FiX,FiAward } from "react-icons/fi";
import Webcam from "react-webcam"; // Librería para la cámara
import imglogo from "./logoPitzbol.png";

// Intereses que coinciden exactamente con los del perfil
const CATEGORIES = [
  "Arte e Historia",
  "Cultura",
  "Gastronomía",
  "Vida Nocturna",
  "Deporte Fútbol",
  "Aventura",
  "Arquitectura",
  "Naturaleza"
];

const GuideModal = ({ isOpen, onClose, onOpenAuth }: { isOpen: boolean; onClose: () => void; onOpenAuth?: () => void; }) => {
  const t = useTranslations('guideModal');
  const tCommon = useTranslations('common');
  
  const [userLocal, setUserLocal] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rfc, setRfc] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ codigoPostal: "", clabe: "" });
  const [verifyingOCR, setVerifyingOCR] = useState(false);
  const [isUploading, setIsUploading] = useState({ frente: false, vuelta: false });
  const [docsUploaded, setDocsUploaded] = useState({ frente: false, vuelta: false });
  const [imgFrenteBase64, setImgFrenteBase64] = useState<string | null>(null);  //para guardar las imágenes y enviarlas al final
  const [imgVueltaBase64, setImgVueltaBase64] = useState<string | null>(null);
  const [faceCaptured, setFaceCaptured] = useState<string | null>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const [imgRostro, setImgRostro] = useState<string | null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false); 
  const [isScannerActive, setIsScannerActive] = useState(false);

  // Función para guardar automáticamente los intereses en la BD
  const guardarInteresesEnBD = async (nuevosIntereses: string[]) => {
    try {
      const token = localStorage.getItem("pitzbol_token");
      if (!token) {
        console.error("No hay token disponible");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/auth/update-profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ especialidades: nuevosIntereses })
      });

      if (response.ok) {
        // Actualizar localStorage con los nuevos intereses
        const stored = localStorage.getItem("pitzbol_user");
        const user = stored ? JSON.parse(stored) : {};
        const updated = { ...user, especialidades: nuevosIntereses };
        localStorage.setItem("pitzbol_user", JSON.stringify(updated));
        
        // Disparar evento personalizado para que el perfil se actualice
        window.dispatchEvent(new Event("especialidadesActualizadas"));
        
        console.log("✅ Intereses guardados automáticamente:", nuevosIntereses);
      } else {
        console.error("Error al guardar intereses:", response.statusText);
      }
    } catch (error) {
      console.error("Error al guardar intereses en BD:", error);
    }
  };
  const [statusMsg, setStatusMsg] = useState("Esperando inicio...");
  const [matchingScore, setMatchingScore] = useState(0);
  const [ineDescriptor, setIneDescriptor] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceapi, setFaceapi] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      if (stored.uid) {
        setUserLocal(stored);
        // Cargar los intereses existentes del perfil
        const especialidadesExistentes = stored.especialidades || [];
        setSelectedCats(especialidadesExistentes);
      }

      setStep(1); 

      setIsFinishing(false);
      setShowConfirmation(false);
      setErrorMsg("");
      setDocsUploaded({ frente: false, vuelta: false });
      setImgFrenteBase64(null);
      setImgVueltaBase64(null);
      setImgRostro(null);
      setIsScannerActive(false);
      setMatchingScore(0);
      setStatusMsg("Esperando inicio...");
    }
  }, [isOpen]);

  const verificarEnVivo = async () => {
    const video = webcamRef.current?.video;

    if (!video || video.readyState !== 4 || video.videoWidth === 0 || !isScannerActive || !modelsLoaded || imgRostro || !faceapi) return;

    try {
      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection) {
        let score = 0;
        if (ineDescriptor) {
          try {
            const distance = faceapi.euclideanDistance(ineDescriptor, detection.descriptor);
            // Mantenemos la fórmula original para el cálculo que verá el admin
            score = Math.round(Math.max(0, (1 - (distance / 0.8)) * 100));
          } catch (e) {
            score = 0;
          }
        }

        setMatchingScore(score);
        setStatusMsg("Analizando rostro...");

        // DAMOS 2 SEGUNDOS (2000ms) de escaneo para que el usuario se acomode bien
        // y luego tomamos la foto automáticamente para que el admin la revise
        const timeoutId = setTimeout(() => {
          if (isScannerActive && !imgRostro && webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot();
            if (screenshot) {
              setImgRostro(screenshot);
              setIsScannerActive(false);
              setStatusMsg(t('captureComplete'));
              // Aquí el matchingScore actual se queda guardado para enviarse al backend
            }
          }
        }, 2500); // 2.5 segundos es el tiempo ideal de espera

        return () => clearTimeout(timeoutId);
      } else {
        setMatchingScore(0);
        setStatusMsg(t('centerFace'));
      }
    } catch (err) {
      console.error("Error en detección:", err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (step === 4 && isScannerActive && !imgRostro && modelsLoaded && faceapi) {
      interval = setInterval(() => {
        verificarEnVivo();
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, isScannerActive, imgRostro, modelsLoaded, ineDescriptor, faceapi]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("🔄 Cargando modelos de reconocimiento facial...");
        
        // Inicializar face-api usando la función de inicialización
        const faceapiModule = await ensureFaceApiReady();
        
        if (!faceapiModule) {
          throw new Error("No se pudo inicializar face-api");
        }
        
        setFaceapi(faceapiModule);
        
        const MODEL_URL = "/models";
        
        // Esperar a que el backend de TensorFlow esté listo antes de cargar los modelos
        if (typeof window !== 'undefined' && (window as any).tf) {
          await (window as any).tf.ready();
          console.log("✅ Backend de TensorFlow listo:", (window as any).tf.getBackend());
        }
        
        await faceapiModule.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log("✅ Modelos cargados exitosamente");
        setModelsLoaded(true);
        setStatusMsg("Sistema listo");
      } catch (err) {
        console.error("❌ Error al inicializar:", err);
        setStatusMsg("Error al cargar modelos");
        // Permitir continuar sin reconocimiento facial
        setModelsLoaded(true);
      }
    };
    
    if (isOpen && !modelsLoaded && !faceapi) {
      loadModels();
    }
  }, [isOpen, modelsLoaded, faceapi]);

  useEffect(() => {
    if (imgFrenteBase64 && step === 4 && modelsLoaded && faceapi) {
      const extract = async () => {
        setVerifyingFace(true); 
        try {
          // Crear imagen del DOM
          const img = document.createElement('img');
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imgFrenteBase64;
          });
          
          const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          
          if (detection) {
            setIneDescriptor(detection.descriptor);
            console.log("✅ Descriptor de INE generado");
          } else {
            console.warn("⚠️ No se detectó rostro en INE, continuando sin validación facial");
          }
        } catch (e) { 
          console.error("Error procesando INE:", e); 
        } finally {
          setVerifyingFace(false);
        }
      };
      extract();
    }
  }, [imgFrenteBase64, step, modelsLoaded, faceapi]);

  const nextStep = () => {
    if (step === 1 && selectedCats.length === 0) {
        setErrorMsg(t('selectAtLeastOne'));
        return;
    }
    setErrorMsg("");
    setStep(step + 1);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'frente' | 'vuelta') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [tipo]: true }));
    setErrorMsg("");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      setVerifyingOCR(true);

      try {
        const response = await fetch('http://localhost:3001/api/ocr/verify-ine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Enviamos el tipo al backend para que sepa qué validar
          body: JSON.stringify({ imageBase64: base64, side: tipo }) 
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setDocsUploaded(prev => ({ ...prev, [tipo]: true }));
          if (tipo === 'frente') {
            setImgFrenteBase64(base64);
            if (data.extractedData?.rfc) setRfc(data.extractedData.rfc);
          } else {
            setImgVueltaBase64(base64);
          }
          console.log(`✅ ${tipo} cargado exitosamente`);
        } else {
          const msg = tipo === 'vuelta' 
            ? t('ocrError')
            : (data.message || "Documento no válido.");
          setErrorMsg(msg);
          setDocsUploaded(prev => ({ ...prev, [tipo]: false }));
        }
      } catch (error) {
        setErrorMsg("Error de conexión con el servidor de validación.");
      } finally {
        setIsUploading(prev => ({ ...prev, [tipo]: false }));
        setVerifyingOCR(false);
      }
    };
  };

  interface BioResponse {
    success: boolean;
    confidence: string;
    nivelPrioridad: string;
    isMatch: boolean;
    message: string;
  }
  const eliminarFoto = (tipo: 'frente' | 'vuelta') => {
    setDocsUploaded(prev => ({ ...prev, [tipo]: false }));
    if (tipo === 'frente') {
      setImgFrenteBase64(null);
      setRfc(""); // Opcional: limpiar RFC si quieres que se vuelva a extraer
    } else {
      setImgVueltaBase64(null);
    }
  };
  
  const handleFinish = async () => {
    const stored = localStorage.getItem("pitzbol_user");
    const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    setIsFinishing(true);
    setErrorMsg("");

    try {
      let bioData = { confidence: "0", nivelPrioridad: "BAJA", isMatch: false };

      try {
        const bioRes = await fetch('http://localhost:3001/api/ocr/compare-biometry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceBase64: imgRostro, ineBase64: imgFrenteBase64 })
        });
        
        if (!bioRes.ok) {
          console.warn("Biometría no disponible, usando validación manual");
        } else {
          const data = await bioRes.json();
          if (data.success) bioData = data;
        }
      } catch (e) { 
        console.error("Biometría omitida, se requiere revisión manual.", e); 
      }

      console.log("📤 Enviando datos de registro de guía...");
      
      const response = await fetch('http://localhost:3001/api/guides/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userLocal?.uid,
          nombre: userLocal?.nombre,
          apellido: userLocal?.apellido,
          email: userLocal?.email,
          telefono: userLocal?.telefono,
          nacionalidad: userLocal?.nacionalidad,
          rfc,
          codigoPostal: formData.codigoPostal,
          categorias: selectedCats,
          ineFrente: imgFrenteBase64,
          ineReverso: imgVueltaBase64,
          facePhoto: imgRostro,
          validacion_biometrica: {
            porcentaje: bioData.confidence || matchingScore.toString(),
            nivel: matchingScore > 60 ? "ALTA" : "BAJA", 
            mensaje: matchingScore > 60 
              ? "Coincidencia probable" 
              : "Revisión manual necesaria (Diferencias detectadas)"
          }
        }),
      });

      console.log("📥 Respuesta recibida:", response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Registro exitoso:", responseData);
        
        // Guardar timestamp de cuándo se envió la solicitud
        const timestamp = new Date().toISOString();
        const updatedUser = { 
          ...userLocal,
          role: "turista",  // Explícitamente mantener role como turista
          guide_status: "pendiente", 
          especialidades: selectedCats,
          solicitudEnviadaEn: timestamp
        };
        localStorage.setItem("pitzbol_user", JSON.stringify(updatedUser));
        if (userLocal?.uid) {
          localStorage.setItem(`pitzbol_guide_submitted_${userLocal.uid}`, "true");
        }
        localStorage.removeItem("pitzbol_guide_submitted");
        
        console.log("✅ Solicitud guardada en localStorage:", updatedUser);
        console.log("� localStorage values:", {
          user: localStorage.getItem("pitzbol_user"),
          submitted: localStorage.getItem("pitzbol_guide_submitted")
        });
        console.log("📢 Disparando evento 'guideSubmissionCompleted'");
        
        // Enviar notificación
        const { notificarSolicitudEnviada } = await import("@/lib/notificaciones");
        notificarSolicitudEnviada(userLocal?.uid);
        
        // Disparar evento personalizado para que el Navbar se actualice
        // Hacerlo múltiples veces para asegurar que se escuche
        window.dispatchEvent(new Event("guideSubmissionCompleted"));
        window.dispatchEvent(new Event("storage"));
        
        // Hacer otro dispatch después de un pequeño delay
        setTimeout(() => {
          window.dispatchEvent(new Event("guideSubmissionCompleted"));
        }, 50);
        
        setShowConfirmation(true);
      } else {
        const err = await response.json();
        console.error("❌ Error en registro:", err);
        setErrorMsg(err.message || err.msg || "Error al guardar perfil.");
      }
    } catch (e) { 
      console.error("❌ Error en handleFinish:", e);
      setErrorMsg("Error de conexión con el servidor.");
    } finally { 
      setIsFinishing(false); 
    }
  };

  if (!isOpen) return null;

  const btnPrimary = "w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium";
  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] focus:border-[#0D601E] text-sm md:text-base";

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-[500px] md:max-w-[950px] h-[90vh] md:h-[650px] rounded-t-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex flex-col border border-white/20"
      >
        {/* 1. HEADER FIJO (Títulos e Indicadores) */}
        <div className="w-full bg-white z-[320] pt-4 md:pt-8 px-8 border-b border-gray-50 md:border-none">
          {/* Barra de arrastre móvil */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto md:hidden mb-6" />

          {/* Botones de navegación superiores */}
          {!isFinishing && !showConfirmation && (
            <div className="absolute top-6 left-8 right-8 flex justify-between items-center">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-[#1A4D2E] hover:text-[#0D601E] flex items-center gap-1 transition-all">
                  <FiChevronLeft size={28} /> <span className="hidden md:block font-bold text-sm italic">Atrás</span>
                </button>
              ) : <div />}
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-all"><FiX size={28} /></button>
            </div>
          )}

          {/* Título Estático */}
          {!isFinishing && !showConfirmation && (
            <div className="text-center mt-6 md:mt-2">
              <h2 className="text-[28px] md:text-[42px] text-[#8B0000] font-black uppercase leading-tight" style={{ fontFamily: 'var(--font-jockey)' }}>
                {step === 1 && "Tu Especialidad"}
                {step === 2 && "Identificación"}
                {step === 3 && "Datos Fiscales"}
                {step === 4 && "Validación"}
              </h2>
              {/* Indicador de pasos fijo */}
              <div className="flex justify-center gap-2 md:gap-3 mt-4 mb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative h-1.5 w-10 md:w-12 bg-gray-100 rounded-full overflow-hidden">
                    {step >= i && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute inset-0 bg-[#0D601E]" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`flex-1 ${(!isFinishing && !verifyingOCR && !verifyingFace) ? 'overflow-y-auto' : 'overflow-hidden'} px-6 md:px-12 py-0 flex flex-col items-center justify-center relative`}>
          <AnimatePresence mode="wait">
            {(isFinishing || verifyingOCR || verifyingFace) ? (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }} 
                className="flex flex-col items-center justify-center text-center w-full h-full max-h-full"
              >
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                  className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mx-auto"
                >
                  <Image 
                    src={imglogo} 
                    alt="Pitzbol" 
                    fill 
                    sizes="(max-width: 768px) 256px, 320px" 
                    className="object-contain" 
                    priority 
                  />
                </motion.div>

                <div className="relative -mt-6 md:-mt-10 z-10">
                  <h3 className="text-xl md:text-3xl font-black text-[#1A4D2E] uppercase tracking-tighter leading-none">
                    {verifyingOCR ? "Validando INE" : verifyingFace ? "Verificando Biometría" : "Guardando Perfil"}
                  </h3>
                  <p className="text-[#769C7B] italic text-xs md:text-base animate-pulse font-medium mt-2">
                    {verifyingOCR ? "Analizando legibilidad del documento..." : 
                    verifyingFace ? "Comparando rostro con identificación..." : 
                    "Subiendo tus datos y documentos..."}
                  </p>
                </div>
              </motion.div>
            ) : showConfirmation ? (
              <motion.div key="confirm" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md text-center space-y-6 my-auto">
                <div className="w-20 h-20 bg-[#F6F0E6] rounded-full flex items-center justify-center mx-auto text-[#0D601E]">
                  <FiShield size={40} />
                </div>
                <h2 className="text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>Solicitud Recibida</h2>
                <div className="space-y-4 text-[#1A4D2E]">
                  <p className="font-medium text-lg">Tus datos e identificaciones se han guardado correctamente.</p>
                  <p className="bg-gray-50 p-4 rounded-2xl text-sm italic border border-gray-100">
                    En un plazo menor a <b>24 horas</b> confirmaremos tu identidad. Recibirás una notificación para comenzar a publicar tus tours.
                  </p>
                </div>                <button onClick={() => { 
                  onClose(); 
                  // Pequeño delay para permitir que el Navbar se actualice
                  setTimeout(() => {
                    window.location.href = "/perfil"; 
                  }, 100);
                }} className={btnPrimary}>Entendido</button>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center">
                
                {step === 1 && (
                  <div className="w-full pt-2">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mb-8 space-y-2"
                    >
                      <p className="text-[#1A4D2E]/100 text-[14px] md:text-base leading-relaxed">
                        Tus especialidades nos ayudan a conectarte con los turistas que buscan experiencias como las que tú ofreces. <br className="hidden md:block" />
                      </p>
                    </motion.div>
                    <p className="text-[#1A4D2E] text-sm md:text-base mb-9  text-center font-bold italic">¿En qué áreas te consideras experto?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => {
                          const nuevosIntereses = selectedCats.includes(cat) ? selectedCats.filter(c => c !== cat) : [...selectedCats, cat];
                          setSelectedCats(nuevosIntereses);
                          guardarInteresesEnBD(nuevosIntereses);
                        }} 
                          className={`py-3 px-1 rounded-full border-2 text-[12px] md:text-sm transition-all flex items-center justify-center gap-2 ${selectedCats.includes(cat) ? 'bg-[#0D601E] border-[#0D601E] text-white' : 'bg-white border-gray-100 text-[#1A4D2E] hover:border-[#0D601E]'}`}>
                          {cat} {selectedCats.includes(cat) && <FiCheck size={14}/>}
                        </button>
                      ))}
                    </div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mb-5 space-y-2 mt-9"
                    >
                        <p className="text-[#1A4D2E]/70 text-[11px] md:text-[13px] leading-relaxed">
                          Podrás editar o añadir más intereses en cualquier momento desde tu perfil. <br className="hidden md:block" />
                        </p>
                    </motion.div>
                  </div>
                )}

                {step === 2 && (
                  <div className="w-full pt-4">
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-8 space-y-2"
                    >
                      <p className="text-[#1A4D2E]/100 text-[14px] md:text-base leading-relaxed">
                        A continuación necesitarás tener tus datos oficiales, para poder verificar que eres tú.
                      </p>
                      <p className="text-[#1A4D2E]/95 text-[14px] md:text-base leading-relaxed font-bold italic">
                        Ten en mano tu INE
                      </p>
                    </motion.div>

                    <p className="text-[#1A4D2E]/100 mb-2 font-bold italic text-xs md:text-sm text-center">
                      Sube fotos legibles de tu identificación:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      {/* CUADRO FRENTE */}
                      <div className="relative">
                        {docsUploaded.frente && (
                          <button 
                            onClick={() => eliminarFoto('frente')}
                            className="absolute -top-2 -right-2 z-10 bg-[#909090]/400 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                        <label htmlFor="file-frente" className={`relative border-2 border-dashed rounded-[30px] h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all w-full ${docsUploaded.frente ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                          {docsUploaded.frente ? (
                            <><FiCheck size={32} className="text-[#0D601E] mb-2" /><span className="text-xs font-bold text-[#0D601E]">Frente OK</span></>
                          ) : (
                            <><FiFileText size={32} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-xs font-bold text-[#1A4D2E] italic uppercase">Frente</span></>
                          )}
                          <input id="file-frente" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'frente')} accept="image/*" />
                        </label>
                      </div>

                      {/* CUADRO REVERSO */}
                      <div className="relative">
                        {docsUploaded.vuelta && (
                          <button 
                            onClick={() => eliminarFoto('vuelta')}
                            className="absolute -top-2 -right-2 z-10 bg-[#909090]/400 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                        <label htmlFor="file-vuelta" className={`relative border-2 border-dashed rounded-[30px] h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all w-full ${docsUploaded.vuelta ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                          {docsUploaded.vuelta ? (
                            <><FiCheck size={32} className="text-[#0D601E] mb-2" /><span className="text-xs font-bold text-[#0D601E]">Reverso OK</span></>
                          ) : (
                            <><FiFileText size={32} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-xs font-bold text-[#1A4D2E] italic uppercase">Reverso</span></>
                          )}
                          <input id="file-vuelta" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'vuelta')} accept="image/*" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="w-full pt-1 flex flex-col items-center">
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-2"
                    >
                      <p className="text-[#1A4D2E] text-[14px] md:text-sm italic mt-1">Asegúrate que el RFC extraído sea correcto.</p>
                      <p className="text-[#1A4D2E] text-[14px] md:text-sm italic mt-1 font-bold ">
                        Si no es correcto, escribe tu RFC y Código Postal tal cual aparecen en tu constancia
                      </p>
                    </motion.div>

                    <div className="w-full max-w-sm space-y-10 mt-9">
                      <div className="space-y-5">
                        <div className="relative">
                          <label className="text-[#1A4D2E]/100 font-bold italic text-xs">
                            RFC Individual
                          </label>
                          <input 
                            placeholder="RFC" 
                            value={rfc} 
                            onChange={(e) => setRfc(e.target.value.toUpperCase())} 
                            className={`${inputClass} hover:border-[#0D601E]/40 transition-colors`}
                          />
                        </div>

                        <div className="relative">
                          <label className="text-[#1A4D2E]/100 mb-2 font-bold italic text-xs">
                            Código Postal
                          </label>
                          <input 
                            placeholder="C.P." 
                            value={formData.codigoPostal} 
                            onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})} 
                            className={`${inputClass} hover:border-[#0D601E]/40 transition-colors`}
                          />
                        </div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-[12px] md:text-[13px] text-[#1A4D2E] text-center font-medium">
                          Esto nos permite cumplir con las normativas fiscales vigentes y asegurar la <span className="text-[#0D601E] font-bold">transparencia y seguridad</span> en tus futuros cobros.
                        </p>
                      </motion.div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="w-full pt-2 flex flex-col items-center">
                    {!isScannerActive && !imgRostro && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mb-12 space-y-4 max-w-xs"
                      >
                        <div className="w-16 h-16 bg-[#F1F8F6] rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiShield className="text-[#0D601E]" size={30} />
                        </div>
                        <p className="text-[#1A4D2E] text-[15px] font-bold leading-relaxed">
                          Último paso: Verificación de Identidad
                        </p>
                        <p className="text-[#1A4D2E] text-[14px] leading-relaxed italic">
                          "Para tu seguridad, compararemos tu rostro con la fotografía de tu identificación oficial."
                        </p>
                        <div className="bg-[#FDFCF9] p-2 rounded-2xl border border-[#0D601E]/10">
                          <p className="text-[#0D601E] text-[15px] font-bold">
                            Instrucciones:
                          </p>
                          <p className="text-[#1A4D2E]/90 text-[14px]">
                            Ubícate en un lugar iluminado y mantén tu rostro centrado en el óvalo.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {(isScannerActive || imgRostro) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative w-44 h-60 md:w-52 md:h-72 rounded-[110px] md:rounded-[150px] overflow-hidden border-4 border-[#0D601E]/20 bg-black shadow-xl mb-6"
                        >
                          {!imgRostro ? (
                            <Webcam 
                              audio={false} 
                              ref={webcamRef} 
                              screenshotFormat="image/jpeg" 
                              className="w-full h-full object-cover scale-x-[-1]" 
                              videoConstraints={{ facingMode: "user" }} 
                            />
                          ) : (
                            <img src={imgRostro} alt="Rostro" className="w-full h-full object-cover" />
                          )}
                          {isScannerActive && !imgRostro && (
                            <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none rounded-[110px] md:rounded-[150px]" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(isScannerActive || imgRostro) && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="w-full max-w-[200px] space-y-2"
                      >
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-[#0D601E]" animate={{ width: `${matchingScore}%` }} />
                        </div>
                        <p className={`text-[12px] font-black text-center ${imgRostro ? 'text-[#0D601E]' : 'text-gray-500'}`}>
                          {imgRostro ? "✓ Captura realizada con éxito" : statusMsg}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isFinishing && !showConfirmation && (
          <div className="w-full bg-white p-6 md:p-10 border-t border-gray-50 flex flex-col items-center">
            {step < 4 ? (
              <button 
                onClick={nextStep} 
                disabled={step === 2 && (!docsUploaded.frente || !docsUploaded.vuelta)}
                className={`${btnPrimary} ${(step === 2 && (!docsUploaded.frente || !docsUploaded.vuelta)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Continuar
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-3">
                {!imgRostro ? (
                  <button 
                    onClick={() => setIsScannerActive(true)} 
                    disabled={!modelsLoaded || isScannerActive}
                    className={`${btnPrimary} ${(!modelsLoaded || isScannerActive) ? 'opacity-70' : ''}`}
                  >
                    {!modelsLoaded ? "Cargando..." : isScannerActive ? "Escaneando..." : "Empezar Validación"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setImgRostro(null); setIsScannerActive(false); setMatchingScore(0); }} className="text-[#8B0000] text-[12px] mb-4 font-bold underline">Repetir Escaneo</button>
                    <button onClick={handleFinish} className={btnPrimary}>Finalizar Registro</button>
                  </>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="mt-4 text-red-500 font-bold text-[10px] bg-red-50 py-1.5 px-6 rounded-full border border-red-100 italic">
                {errorMsg}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GuideModal;
"use client";
import * as faceapi from 'face-api.js';
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronLeft, FiFileText, FiShield, FiX } from "react-icons/fi";
import Webcam from "react-webcam"; // Librería para la cámara
import imglogo from "./logoPitzbol.png";

const CATEGORIES = ["Arte", "Cultural", "Gastronómico", "Vida Nocturna", "Deportiva", "Aventura", "Arquitectura", "Naturaleza"];

const GuideModal = ({ isOpen, onClose, onOpenAuth }: { isOpen: boolean; onClose: () => void; onOpenAuth?: () => void; }) => {
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
  const [statusMsg, setStatusMsg] = useState("Esperando inicio...");
  const [matchingScore, setMatchingScore] = useState(0);
  const [ineDescriptor, setIneDescriptor] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      if (stored.uid) {
        setUserLocal(stored);
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
    
    if (!video || video.readyState !== 4 || video.videoWidth === 0 || !isScannerActive || !modelsLoaded || imgRostro) return;

    try {
      const detection = await faceapi.detectSingleFace(
        video, 
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection && detection.detection && detection.detection.box && typeof detection.detection.box.width === 'number' && detection.detection.box.width > 0) {
        
        let score = 0;
        if (ineDescriptor) {
          try {
            const distance = faceapi.euclideanDistance(ineDescriptor, detection.descriptor);
            score = Math.round(Math.max(0, (1 - (distance / 0.8)) * 100));
          } catch (e) {
            score = 50; 
          }
        } else {
          score = 50; 
        }

        setMatchingScore(score);
        setStatusMsg("Analizando rostro...");

        const timeoutId = setTimeout(() => {
          if (isScannerActive && !imgRostro && webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot();
            if (screenshot) {
              setImgRostro(screenshot);
              setIsScannerActive(false);
              setStatusMsg("✓ Captura finalizada");
            }
          }
        }, 800);

        return () => clearTimeout(timeoutId);
      } else {
        setMatchingScore(0);
        setStatusMsg("Centra tu rostro en la guía");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('IBoundingBox')) {
        return; 
      }
      console.error("Error en detección facial:", err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (step === 4 && isScannerActive && !imgRostro && modelsLoaded) {
      interval = setInterval(() => {
        verificarEnVivo();
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, isScannerActive, imgRostro, modelsLoaded, ineDescriptor]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; 
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL);
        await faceapi.loadFaceRecognitionModel(MODEL_URL);

        console.log("✅ Modelos cargados");
        setModelsLoaded(true);
        setStatusMsg("Sistema listo");
      } catch (err) {
        console.error("❌ Error al cargar modelos:", err);
        setStatusMsg("Error al cargar modelos");
      }
    };
    
    if (isOpen && !modelsLoaded) {
      loadModels();
    }
  }, [isOpen, modelsLoaded]);

  useEffect(() => {
    if (imgFrenteBase64 && step === 4 && modelsLoaded) {
      const extract = async () => {
        setVerifyingFace(true); 
        try {
          const img = await faceapi.fetchImage(imgFrenteBase64);
          const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          
          if (detection) {
            setIneDescriptor(detection.descriptor);
            console.log("✅ Descriptor de INE generado correctamente");
          } else {
            setErrorMsg("No se detectó un rostro claro en la foto de tu INE.");
          }
        } catch (e) { 
          console.error("Error procesando imagen de INE:", e); 
        } finally {
          setVerifyingFace(false);
        }
      };
      extract();
    }
  }, [imgFrenteBase64, step, modelsLoaded]);

  const nextStep = () => {
    if (step === 1 && selectedCats.length === 0) {
        setErrorMsg("Selecciona al menos una categoría");
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
            ? "No pudimos validar el reverso. Asegúrate de que se vea el código de barras/QR claramente."
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

  const handleFinish = async () => {
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
        const data = await bioRes.json();
        if (data.success) bioData = data;
      } catch (e) { console.error("Biometría omitida, se requiere revisión manual."); }

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

      if (response.ok) {
        const updatedUser = { ...userLocal, guide_status: "pendiente", especialidades: selectedCats };
        localStorage.setItem("pitzbol_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
        setShowConfirmation(true);
      } else {
        const err = await response.json();
        setErrorMsg(err.msg || "Error al guardar perfil.");
      }
    } catch (e) { setErrorMsg("Error de conexión con el servidor.");
    } finally { setIsFinishing(false); }
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
        {/* 2. CUERPO CON SCROLL (Contenido dinámico) */}
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

                {/* Bloque de Texto: Pegado al logo con margen superior negativo */}
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
                </div>                <button onClick={() => { onClose(); window.location.href = "/perfil"; }} className={btnPrimary}>Entendido</button>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center">
                
                {step === 1 && (
                  <div className="w-full pt-4">
                    <p className="text-[#769C7B] text-sm md:text-base mb-6 font-medium italic text-center">¿En qué áreas te consideras experto?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} 
                          className={`py-3 px-1 rounded-full border-2 text-[12px] md:text-sm transition-all flex items-center justify-center gap-2 ${selectedCats.includes(cat) ? 'bg-[#0D601E] border-[#0D601E] text-white' : 'bg-white border-gray-100 text-[#1A4D2E] hover:border-[#0D601E]'}`}>
                          {cat} {selectedCats.includes(cat) && <FiCheck size={14}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="w-full pt-4">
                    <p className="text-[#769C7B] mb-8 font-medium italic text-base md:text-lg text-center">Sube fotos legibles de tu INE.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <label htmlFor="file-frente" className={`relative border-2 border-dashed rounded-[30px] h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all ${docsUploaded.frente ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {docsUploaded.frente ? <><FiCheck size={32} className="text-[#0D601E] mb-2" /><span className="text-xs font-bold text-[#0D601E]">Frente OK</span></> : 
                        <><FiFileText size={32} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-xs font-bold text-[#1A4D2E] italic uppercase">Frente</span></>}
                        <input id="file-frente" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'frente')} accept="image/*" />
                      </label>
                      <label htmlFor="file-vuelta" className={`relative border-2 border-dashed rounded-[30px] h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all ${docsUploaded.vuelta ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {docsUploaded.vuelta ? <><FiCheck size={32} className="text-[#0D601E] mb-2" /><span className="text-xs font-bold text-[#0D601E]">Reverso OK</span></> : 
                        <><FiFileText size={32} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-xs font-bold text-[#1A4D2E] italic uppercase">Reverso</span></>}
                        <input id="file-vuelta" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'vuelta')} accept="image/*" />
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="w-full pt-4 space-y-6 max-w-sm">
                    <p className="text-xs md:text-sm text-[#1A4D2E] font-medium leading-relaxed bg-[#F6F0E6] p-4 rounded-[20px] border-l-4 border-[#0D601E]">
                      Confirma tu RFC extraído automáticamente.
                    </p>
                    <div className="space-y-4">
                      <input placeholder="RFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} className={inputClass} />
                      <input placeholder="Código Postal" value={formData.codigoPostal} onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})} className={inputClass} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="w-full pt-4 flex flex-col items-center">
                    <div className="relative w-44 h-60 md:w-52 md:h-72 rounded-[110px] md:rounded-[150px] overflow-hidden border-4 border-[#0D601E]/20 bg-black shadow-xl mb-6">
                      {!imgRostro ? (
                        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover scale-x-[-1]" videoConstraints={{ facingMode: "user" }} />
                      ) : (
                        <img src={imgRostro} alt="Rostro" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="w-full max-w-[200px] space-y-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-[#0D601E]" animate={{ width: `${matchingScore}%` }} />
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-widest ${imgRostro ? 'text-[#0D601E]' : 'text-gray-500'}`}>
                        {imgRostro ? "✓ Identidad Lista" : statusMsg}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. FOOTER FIJO (Botones de acción) */}
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
                    {!modelsLoaded ? "Iniciando..." : "Empezar Validación"}
                  </button>
                ) : (
                  <>
                    <button onClick={handleFinish} className={btnPrimary}>Finalizar Registro</button>
                    <button onClick={() => { setImgRostro(null); setIsScannerActive(false); setMatchingScore(0); }} className="text-[#8B0000] text-[10px] font-bold uppercase underline">Repetir Escaneo</button>
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
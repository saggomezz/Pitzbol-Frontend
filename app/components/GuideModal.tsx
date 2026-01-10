"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam"; // Librería para la cámara
import { FiChevronLeft, FiFileText, FiX, FiCheck, FiShield, FiCamera } from "react-icons/fi";
import imglogo from "./logoPitzbol.png";

const CATEGORIES = ["Arte", "Cultural", "Gastronómico", "Vida Nocturna", "Deportiva", "Aventura", "Arquitectura", "Naturaleza"];

const GuideModal = ({ isOpen, onClose, onOpenAuth }: { isOpen: boolean; onClose: () => void; onOpenAuth?: () => void; }) => {
  const [userLocal, setUserLocal] = useState<any>(null);
  const [step, setStep] = useState(0);
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
  const webcamRef = useRef<Webcam>(null); 
  const [imgRostro, setImgRostro] = useState<string | null>(null);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);

  // BORRAR DESPUES - FUNCION PARA SALTAR SEGURIDAD EN PRUEBAS
  const [ineFrente, setIneFrente] = useState<string | null>(null);
  const [ineReverso, setIneReverso] = useState<string | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [extractedRFC, setExtractedRFC] = useState<string>("");
  const [isDebugMode, setIsDebugMode] = useState(false);

  const handleSkipSecurity = () => {
      // Pixel blanco para simular las imágenes
      const fakeImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
      
      setIsDebugMode(true);
      setIneFrente(fakeImage);
      setIneReverso(fakeImage);
      setDocsUploaded({ frente: true, vuelta: true });
      setImgRostro(fakeImage); 
      setFacePhoto(fakeImage); 
      setRfc("XAXX010101000");
      setFormData(prev => ({ ...prev, codigoPostal: "44100" }));
      setStep(4); 
      
      alert("⚡ Modo Debug: Cámara desactivada y datos cargados.");
  };
  // HASTA AQUI
  
  const capturarFoto = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImgRostro(screenshot);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const stored = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      if (stored.uid) {
        setUserLocal(stored);
        setStep(1); 
      } else {
        setUserLocal(null);
        setStep(0);
      }
      setIsFinishing(false);
      setShowConfirmation(false);
      setErrorMsg("");
      setDocsUploaded({ frente: false, vuelta: false });
      setImgFrenteBase64(null);
      setImgVueltaBase64(null);
    }
  }, [isOpen]);

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

  const handleFinish = async () => {
      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      setIsFinishing(true);
      setErrorMsg("");

      try {
          let bioData = { success: true, confidence: "100", message: "Saltado por Debug" };

          if (!isDebugMode) {
              const bioRes = await fetch('http://localhost:3001/api/ocr/compare-biometry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      faceBase64: imgRostro, 
                      ineBase64: imgFrenteBase64 
                  })
              });

              const contentType = bioRes.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                  throw new Error("El servidor no respondió con JSON.");
              }

              bioData = await bioRes.json();

              if (!bioData.success) {
                  setErrorMsg("La validación facial falló: " + bioData.message);
                  setIsFinishing(false);
                  return;
              }
          }

          const payload = {
              uid: userLocal?.uid,
              nombre: userLocal?.nombre,
              apellido: userLocal?.apellido,
              email: userLocal?.email, 
              telefono: userLocal?.telefono,
              nacionalidad: userLocal?.nacionalidad, 
              rfc: rfc,
              codigoPostal: formData.codigoPostal,
              categorias: selectedCats,
              ineFrente: imgFrenteBase64,
              ineReverso: imgVueltaBase64,
              facePhoto: imgRostro,
              validacion_biometrica: {
                  coincide: bioData.success,
                  porcentaje: bioData.confidence,
                  mensaje: bioData.message
              }
          };

          const response = await fetch('http://localhost:3001/api/guides/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          });

          if (response.ok) {
              const updatedUser = { ...userLocal, guide_status: "pendiente", "07_especialidades": selectedCats, especialidades: selectedCats };
              localStorage.setItem("pitzbol_user", JSON.stringify(updatedUser));
              localStorage.setItem("pitzbol_guide_submitted", "true");
              window.dispatchEvent(new Event("storage"));
              
              setShowConfirmation(true);
          } else {
              const errData = await response.json();
              setErrorMsg(errData.msg || "Error al guardar perfil.");
          }
      } catch (e: any) {
          console.error("Error detallado:", e);
          setErrorMsg("Error de conexión: Verifica el servidor.");
      } finally {
          setIsFinishing(false);
      }
  };

  if (!isOpen) return null;

  const btnPrimary = "w-full md:w-3/4 mx-auto bg-[#0D601E] text-white py-2.5 rounded-full hover:bg-[#094d18] transition-all shadow-md text-sm tracking-wide font-medium";
  const inputClass = "w-full px-6 py-2.5 bg-transparent border border-[#1A4D2E]/20 rounded-full outline-none text-[#1A4D2E] focus:border-[#0D601E] text-sm md:text-base";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-[500px] md:max-w-[950px] min-h-[550px] md:h-[600px] rounded-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex border border-white/20">
        
        {!isFinishing && !showConfirmation && (
          <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-[310]">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="text-[#1A4D2E] hover:text-[#0D601E] flex items-center gap-1 transition-all">
                <FiChevronLeft size={28} /> <span className="hidden md:block font-bold text-sm italic">Atrás</span>
              </button>
            ) : <div />}
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-all"><FiX size={28} /></button>
          </div>
        )}
        {/* BOTÓN TEMPORAL DE DEBUG */}
        {!isFinishing && !showConfirmation && (
          <button 
            type="button"
            onClick={(e) => {
                e.preventDefault();
                handleSkipSecurity();
            }}
            className="absolute bottom-4 right-6 z-[350]  hover:bg-yellow-400 text-[#1A4D2E] text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg transition-all tracking-tighter"
          >
            Skip
          </button>
        )}
        <div className="w-full h-full p-8 md:p-12 flex flex-col items-center justify-center bg-white relative">
          <AnimatePresence mode="wait">
            {(isFinishing || verifyingOCR) ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="relative w-48 h-48 md:w-64 md:h-64 mb-10">
                  <Image src={imglogo} alt="Pitzbol" fill className="object-contain" />
                </motion.div>
                <h3 className="text-3xl font-black text-[#1A4D2E] uppercase">
                  {verifyingOCR ? "Validando INE" : verifyingFace ? "Verificando Biometría" : "Guardando Perfil"}
                </h3>
                <p className="text-[#769C7B] italic text-lg animate-pulse mt-4">
                  {verifyingOCR ? "Analizando legibilidad del documento..." : 
                  verifyingFace ? "Comparando rostro con identificación..." : 
                  "Subiendo tus datos y documentos..."}
                </p>
              </motion.div>
            ) : showConfirmation ? (
              <motion.div key="confirm" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-[#F6F0E6] rounded-full flex items-center justify-center mx-auto text-[#0D601E]">
                   <FiShield size={40} />
                </div>
                <h2 className="text-3xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: 'var(--font-jockey)' }}>Solicitud Recibida</h2>
                <div className="space-y-4 text-[#1A4D2E]">
                  <p className="font-medium text-lg">Tus datos e identificaciones se han guardado correctamente.</p>
                  <p className="bg-gray-50 p-4 rounded-2xl text-sm italic border border-gray-100">
                    En un plazo menor a <b>24 horas</b> confirmaremos tu identidad. Recibirás una notificación para comenzar a publicar tus tours.
                  </p>
                </div>
                <button onClick={() => { onClose(); window.location.href = "/perfil"; }} className={btnPrimary}>Entendido</button>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full max-w-sm md:max-w-2xl text-center">
                <h2 className="text-[32px] md:text-[42px] text-[#8B0000] font-black uppercase leading-tight mb-2" style={{ fontFamily: 'var(--font-jockey)' }}>
                  {step === 1 && "Tu Especialidad"}
                  {step === 2 && "Identificación"}
                  {step === 3 && "Datos Fiscales"}
                  {step === 4 && "Validación"}
                </h2>

                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                      {step >= i && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute inset-0 bg-[#0D601E]" />}
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div className="space-y-6">
                    <p className="text-[#769C7B] text-base mb-4 font-medium italic">¿En qué áreas eres experto?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} 
                          className={`py-3 px-1 rounded-full border-2 text-[12px] md:text-sm transition-all flex items-center justify-center gap-2 ${selectedCats.includes(cat) ? 'bg-[#0D601E] border-[#0D601E] text-white' : 'bg-white border-gray-100 text-[#1A4D2E] hover:border-[#0D601E]'}`}>
                          {cat} {selectedCats.includes(cat) && <FiCheck size={14}/>}
                        </button>
                      ))}
                    </div>
                    <button onClick={nextStep} className={`${btnPrimary} mt-6`}>Continuar</button>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-6 text-center w-full max-w-xl mx-auto">
                    <p className="text-[#769C7B] mb-8 font-medium italic text-lg">Sube una foto clara de tu identificación oficial.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                      <label htmlFor="file-frente" className={`relative border-2 border-dashed rounded-[30px] h-44 flex flex-col items-center justify-center cursor-pointer transition-all ${docsUploaded.frente ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {docsUploaded.frente ? <><FiCheck size={40} className="text-[#0D601E] mb-2" /><span className="text-sm font-bold text-[#0D601E]">Frente cargado</span></> : 
                        <><FiFileText size={40} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-sm font-bold text-[#1A4D2E] italic uppercase">INE Frente</span></>}
                        <input id="file-frente" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'frente')} accept="image/*" />
                      </label>

                      <label htmlFor="file-vuelta" className={`relative border-2 border-dashed rounded-[30px] h-44 flex flex-col items-center justify-center cursor-pointer transition-all ${docsUploaded.vuelta ? 'border-[#0D601E] bg-[#0D601E]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {docsUploaded.vuelta ? <><FiCheck size={40} className="text-[#0D601E] mb-2" /><span className="text-sm font-bold text-[#0D601E]">Reverso cargado</span></> : 
                        <><FiFileText size={40} className="text-[#0D601E] mb-2 opacity-50" /><span className="text-sm font-bold text-[#1A4D2E] italic uppercase">INE Reverso</span></>}
                        <input id="file-vuelta" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'vuelta')} accept="image/*" />
                      </label>
                    </div>
                    <button onClick={nextStep} disabled={!docsUploaded.frente || !docsUploaded.vuelta} className={`${btnPrimary} ${(!docsUploaded.frente || !docsUploaded.vuelta) ? 'opacity-50 cursor-not-allowed' : ''}`}>Siguiente</button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 max-w-sm mx-auto">
                    <p className="text-sm text-[#1A4D2E] font-medium leading-relaxed bg-[#F6F0E6] p-4 rounded-[25px] border-l-4 border-[#0D601E]">
                      Revisa tu RFC (extraído de tu INE). Puedes editarlo si es necesario.
                    </p>
                    <div className="space-y-4">
                      <input placeholder="RFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} className={inputClass} />
                      <input placeholder="Código Postal" value={formData.codigoPostal} onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})} className={inputClass} />
                    </div>
                    <button onClick={nextStep} className={btnPrimary}>Continuar</button>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-[#0D601E] shadow-2xl bg-black">
                      {!imgRostro ? (
                        <>
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                            videoConstraints={{ facingMode: "user" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[80%] h-[85%] border-2 border-dashed border-white/50 rounded-[100px] shadow-[0_0_0_999px_rgba(0,0,0,0.5)]"></div>
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">
                                Posiciona tus ojos dentro de la guía
                            </span>
                          </div>
                        </>
                      ) : (
                        <img src={imgRostro} alt="Rostro" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 border-[20px] border-white/10 rounded-full pointer-events-none shadow-inner" />
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-[#1A4D2E] font-bold">
                        {(!imgRostro && !isDebugMode) ? "Centra tu rostro en el círculo" : "Validación lista"}
                      </p>
                      <p className="text-xs text-gray-500 italic px-4">
                        {isDebugMode ? "MODO DEBUG: Validaciones omitidas" : "Esta foto se comparará con tu INE para validar tu identidad."}
                      </p>
                    </div>

                    {(!imgRostro && !isDebugMode) ? (
                      <button onClick={capturarFoto} className={btnPrimary}>
                        Capturar Rostro
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3 w-full items-center">
                        <button onClick={handleFinish} className={btnPrimary}>
                          Finalizar y Enviar Revisión
                        </button>
                        {/* Solo mostrar repetir foto si NO estamos en debug, para no romper el flujo de prueba */}
                        {!isDebugMode && (
                          <button onClick={() => setImgRostro(null)} className="text-[#8B0000] text-sm font-bold uppercase italic hover:underline">
                            Repetir foto
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {errorMsg && !isFinishing && !verifyingOCR && (
          <div className="absolute bottom-6 left-0 right-0 text-center z-[320]">
            <p className="text-red-500 font-bold text-xs bg-red-50 py-2 inline-block px-8 rounded-full shadow-sm">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideModal;
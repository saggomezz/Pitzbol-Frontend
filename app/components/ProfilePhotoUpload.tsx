"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiUpload, FiX, FiAlertCircle, FiCheck } from "react-icons/fi";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfilePhotoUploadProps {
  userId: string;
  onUploadSuccess?: (url: string) => void;
  currentPhoto?: string;
}

export default function ProfilePhotoUpload({ userId, onUploadSuccess, currentPhoto }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setProgress(0);

    // 1️⃣ VALIDAR TAMAÑO (lado cliente)
    if (file.size > MAX_SIZE) {
      setError(`Archivo muy grande. Máximo: 5MB (tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    // 2️⃣ VALIDAR FORMATO
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setError('Formato no permitido. Solo: JPEG, PNG, WebP');
      return;
    }

    // 3️⃣ VALIDAR DIMENSIONES (lado cliente - previo)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      if (img.width > 4000 || img.height > 4000) {
        setError('Imagen muy grande. Máximo: 4000x4000px');
        URL.revokeObjectURL(objectUrl);
        return;
      }

      if (img.width < 200 || img.height < 200) {
        setError('Imagen muy pequeña. Mínimo: 200x200px');
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Mostrar preview
      setPreview(objectUrl);
      await uploadFile(file);
    };

    img.onerror = () => {
      setError('Imagen inválida o corrupta');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('foto', file);

    try {
      // Obtener token de localStorage
      const token = localStorage.getItem('pitzbol_token');

      const xhr = new XMLHttpRequest();

      // Rastrear progreso
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.fotoPerfil) {
            setError(null);
            setSuccess(true);
            
            // Actualizar localStorage
            const stored = localStorage.getItem('pitzbol_user');
            const user = stored ? JSON.parse(stored) : {};
            const updated = { ...user, fotoPerfil: response.fotoPerfil };
            localStorage.setItem('pitzbol_user', JSON.stringify(updated));
            
            // Callback
            onUploadSuccess?.(response.fotoPerfil);
            
            // Limpiar después de 2 segundos
            setTimeout(() => {
              setSuccess(false);
              setProgress(0);
              if (inputRef.current) inputRef.current.value = '';
            }, 2000);
          } else {
            setError(response.error || 'Error desconocido');
          }
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.error || 'Error al subir foto');
        }
        setLoading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Error de conexión. Intenta de nuevo.');
        setLoading(false);
      });

      xhr.addEventListener('abort', () => {
        setError('Carga cancelada');
        setLoading(false);
      });

      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      xhr.open('POST', `${API_BASE}/api/perfil/foto-perfil`);
      xhr.withCredentials = true;
      const bearer = localStorage.getItem('pitzbol_token');
      if (bearer) {
        xhr.setRequestHeader('Authorization', `Bearer ${bearer}`);
      }
      xhr.send(formData);

    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar archivo');
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Input hidden */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={loading}
      />

      {/* Previsualización */}
      {preview && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 relative"
        >
          <div className="w-32 h-32 rounded-full mx-auto overflow-hidden border-4 border-[#0D601E]/20 shadow-lg">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          {success && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-12 p-2 bg-green-500 text-white rounded-full"
            >
              <FiCheck size={20} />
            </motion.div>
          )}
          {!success && (
            <button
              onClick={handleRemovePhoto}
              disabled={loading}
              className="absolute top-0 right-12 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <FiX size={16} />
            </button>
          )}
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700"
        >
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={16} />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Barra de progreso */}
      {loading && progress > 0 && (
        <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0D601E] to-[#1A4D2E]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Botón de carga */}
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            Cargando... {progress.toFixed(0)}%
          </>
        ) : success ? (
          <>
            <FiCheck size={18} />
            ¡Foto actualizada!
          </>
        ) : (
          <>
            <FiUpload size={18} />
            Cambiar foto de perfil
          </>
        )}
      </motion.button>

      {/* Requisitos */}
      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold">Requisitos:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Máximo 5 MB</li>
          <li>Formatos: JPEG, PNG, WebP</li>
          <li>Mínimo 200x200 píxeles</li>
          <li>Se optimizará automáticamente a 800x800</li>
        </ul>
      </div>
    </div>
  );
}

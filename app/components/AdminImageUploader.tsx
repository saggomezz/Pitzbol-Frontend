"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiImage, FiLoader } from "react-icons/fi";

interface AdminImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  maxImages?: number;
  currentImageCount?: number;
}

export default function AdminImageUploader({
  onUpload,
  isLoading = false,
  maxImages = 10,
  currentImageCount = 0,
}: AdminImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = currentImageCount < maxImages;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño
    const allowedExts = ["image/jpeg", "image/png", "image/webp"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedExts.includes(file.type)) {
      setError("Solo se permiten JPG, PNG y WebP");
      return;
    }

    if (file.size > maxFileSize) {
      setError("El archivo no debe superar 5MB");
      return;
    }

    if (!canAddMore) {
      setError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await onUpload(file);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  if (!canAddMore) {
    return null;
  }

  return (
    <motion.label
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center border-2 border-dashed border-[#769C7B]/40 rounded-2xl cursor-pointer bg-[#F6F0E6]/30 hover:bg-[#F6F0E6]/50 hover:border-[#0D601E] transition-all group relative aspect-square"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <FiLoader className="animate-spin text-[#0D601E] mb-2" size={32} />
          <p className="text-xs font-bold text-[#769C7B] text-center">
            Cargando...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <FiImage className="text-[#769C7B] mb-2 group-hover:text-[#0D601E] transition-colors" size={32} />
          <p className="text-sm font-bold text-[#769C7B] text-center group-hover:text-[#0D601E] transition-colors">
            Agregar
          </p>
          <p className="text-xs text-[#769C7B]">
            ({currentImageCount}/{maxImages})
          </p>
        </div>
      )}

      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-600 text-white text-xs px-3 py-2 rounded whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </motion.label>
  );
}

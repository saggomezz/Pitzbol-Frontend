"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiX, FiCheck, FiLoader, FiImage } from "react-icons/fi";

interface EditableImageProps {
  imageUrl: string;
  index: number;
  onSave: (file: File) => Promise<void>;
  isLoading?: boolean;
  onView?: (url: string) => void;
}

export default function AdminEditableImage({
  imageUrl,
  index,
  onSave,
  isLoading = false,
  onView,
}: EditableImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateImageFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(-4);
    if (!allowedExts.includes(ext)) {
      return "Extensión de archivo no permitida. Solo: JPG, PNG, WebP";
    }
    if (file.size > maxFileSize) {
      return "El archivo excede el tamaño máximo de 5MB.";
    }
    return null;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewUrl(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(fileInputRef.current.files[0]);
      setIsEditing(false);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl overflow-hidden group aspect-square cursor-zoom-in"
      onClick={() => {
        if (!isEditing && onView) onView(imageUrl);
      }}
    >
      {!isEditing ? (
        <>
          <img
            src={imageUrl}
            alt={`Galería ${index + 1}`}
            className="w-full h-full object-cover group-hover:brightness-75 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            disabled={isLoading}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white disabled:bg-gray-200 p-2 rounded-full transition-colors shadow-lg"
          >
            <FiEdit2 className="text-[#0D601E] disabled:text-gray-400" size={18} />
          </motion.button>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 pointer-events-none">
            <div className="bg-white/90 rounded-full p-3">
              <FiImage className="text-[#0D601E]" size={22} />
            </div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] flex flex-col items-center justify-center p-4 z-10"
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg mb-3"
              />
              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mb-2 w-full text-center">
                  {error}
                </p>
              )}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1 bg-[#0D601E] hover:bg-[#094d18] disabled:bg-gray-300 text-white font-semibold py-1.5 px-2 rounded-lg transition-colors text-sm"
                >
                  {isSaving ? (
                    <>
                      <FiLoader className="animate-spin" size={14} />
                      Guardando
                    </>
                  ) : (
                    <>
                      <FiCheck size={14} />
                      Guardar
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-1.5 px-2 rounded-lg transition-colors text-sm"
                >
                  <FiX size={14} />
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[#769C7B]/40 rounded-lg hover:border-[#0D601E] transition-colors">
                <FiImage size={32} className="text-[#769C7B] mb-1" />
                <p className="text-xs font-bold text-[#1A4D2E] text-center">
                  Click para seleccionar imagen
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full transition-colors"
              >
                <FiX className="text-gray-600" size={16} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

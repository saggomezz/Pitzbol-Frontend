"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiX, FiCheck, FiLoader, FiImage } from "react-icons/fi";

interface EditableLogoProps {
  logoUrl: string;
  businessName: string;
  onSave: (file: File) => Promise<void>;
  isLoading?: boolean;
  onView?: (url: string) => void;
}

export default function AdminEditableLogo({
  logoUrl,
  businessName,
  onSave,
  isLoading = false,
  onView,
}: EditableLogoProps) {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {!isEditing ? (
        <div
          className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl p-8 flex items-center justify-center min-h-[260px] relative group cursor-zoom-in"
          onClick={() => {
            if (!isEditing && onView && logoUrl) onView(logoUrl);
          }}
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt={businessName}
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                disabled={isLoading}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white disabled:bg-gray-200 p-3 rounded-full transition-colors shadow-lg opacity-0 group-hover:opacity-100"
              >
                <FiEdit2 className="text-[#0D601E] disabled:text-gray-400" size={20} />
              </motion.button>
            </>
          ) : (
            <>
              <div className="text-center text-[#769C7B]">
                <FiImage size={60} className="mx-auto mb-2 opacity-30" />
                <p>Sin logo disponible</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                disabled={isLoading}
                className="absolute top-4 right-4 bg-[#0D601E] hover:bg-[#094d18] disabled:bg-gray-300 p-3 rounded-full transition-colors shadow-lg"
              >
                <FiEdit2 className="text-white disabled:text-gray-400" size={20} />
              </motion.button>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl p-8 border-2 border-[#0D601E]/20"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-h-[200px] max-w-[200px] object-contain rounded-2xl"
                />
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 w-full text-center">
                    {error}
                  </p>
                )}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0D601E] hover:bg-[#094d18] disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <FiLoader className="animate-spin" size={18} />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiCheck size={18} />
                        Guardar logo
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors"
                  >
                    <FiX size={18} />
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#769C7B]/40 rounded-2xl cursor-pointer hover:border-[#0D601E] transition-colors">
                  <FiImage size={48} className="text-[#769C7B] mb-3" />
                  <p className="text-sm font-bold text-[#1A4D2E] text-center mb-1">
                    Click para seleccionar nuevo logo
                  </p>
                  <p className="text-xs text-[#769C7B]">JPG, PNG o WebP (máx. 5MB)</p>
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
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiX size={18} />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

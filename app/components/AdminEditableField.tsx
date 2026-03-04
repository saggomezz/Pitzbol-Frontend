"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiX, FiCheck, FiLoader } from "react-icons/fi";

interface SelectOption {
  value: string;
  label: string;
}

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  icon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
  inputType?: "text" | "email" | "tel" | "url";
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  normalizeValue?: (value: string) => string;
  validate?: (value: string) => string | null;
}

export default function AdminEditableField({
  label,
  value,
  onSave,
  icon,
  multiline = false,
  rows = 3,
  className = "",
  disabled = false,
  inputType = "text",
  options,
  placeholder,
  required = false,
  maxLength,
  normalizeValue,
  validate,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    const normalizedValue = normalizeValue ? normalizeValue(editValue) : editValue;

    if (validate) {
      const validationError = validate(normalizedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (required && !normalizedValue.trim()) {
      setError("Este campo es obligatorio");
      return;
    }

    if (normalizedValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(normalizedValue);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {!isEditing ? (
        <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow group">
          <div className="flex items-start gap-4 justify-between">
            <div className="flex items-start gap-4 flex-1">
              {icon && (
                <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">
                  {label}
                </p>
                <p className="text-lg font-bold text-[#1A4D2E] whitespace-pre-wrap break-all">
                  {value || "No disponible"}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              disabled={disabled}
              className="flex-shrink-0 bg-[#0D601E]/10 hover:bg-[#0D601E]/20 disabled:bg-gray-100 p-2.5 rounded-full transition-colors"
            >
              <FiEdit2 className="text-[#0D601E] disabled:text-gray-400" size={18} />
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-br from-[#F6F0E6]/50 to-[#E8F5E9]/50 border-2 border-[#0D601E] rounded-2xl p-5"
        >
          <p className="text-xs text-[#769C7B] font-semibold uppercase mb-3">
            {label}
          </p>
          {multiline ? (
            <textarea
              ref={inputRef as React.Ref<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                if (error) setError(null);
              }}
              rows={rows}
              maxLength={maxLength}
              placeholder={placeholder}
              className="w-full border-2 border-[#1A4D2E]/20 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] resize-none"
              disabled={isSaving}
            />
          ) : options && options.length > 0 ? (
            <select
              ref={inputRef as React.Ref<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                if (error) setError(null);
              }}
              className="w-full border-2 border-[#1A4D2E]/20 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] bg-white"
              disabled={isSaving}
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type={inputType}
              value={editValue}
              onChange={(e) => {
                const nextValue = normalizeValue ? normalizeValue(e.target.value) : e.target.value;
                setEditValue(nextValue);
                if (error) setError(null);
              }}
              maxLength={maxLength}
              placeholder={placeholder}
              className="w-full border-2 border-[#1A4D2E]/20 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E]"
              disabled={isSaving}
            />
          )}

          {error && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0D601E] hover:bg-[#094d18] disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <FiLoader className="animate-spin" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <FiCheck size={16} />
                  Guardar
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <FiX size={16} />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

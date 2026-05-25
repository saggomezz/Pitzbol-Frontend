"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiMapPin, FiClock, FiArrowUp, FiHeart } from "react-icons/fi";

export type FilterOptions = {
  zone?: "centro" | "estadio" | "periferico" | null;
  horario?: "ahora" | "24h" | "manana" | "tarde" | "noche" | null;
  ordenar?: "cercano" | "favoritos" | "populares" | null;
  soloFavoritos?: boolean;
};

type AdvancedFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
};

export default function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: AdvancedFiltersModalProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 28, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="w-full xl:w-[380px] shrink-0 overflow-hidden origin-right"
        >
          <div className="bg-white border border-[#E5DACA] rounded-3xl shadow-[0_10px_32px_rgba(26,77,46,0.12)] p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-black text-[#1A4D2E] uppercase tracking-widest" style={{ fontFamily: "var(--font-jockey)" }}>
                Filtros
              </h2>
              <button onClick={onClose} className="p-1.5 hover:bg-[#F6F0E6] rounded-full transition-colors" aria-label="Cerrar filtros">
                <FiX size={18} className="text-[#1A4D2E]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
              <div>
                <h3 className="text-[11px] font-bold text-[#1A4D2E] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                  <FiMapPin size={13} /> Zona
                </h3>
                <div className="space-y-1.5">
                  {[
                    { value: "centro", label: "Centro" },
                    { value: "estadio", label: "Estadio" },
                    { value: "periferico", label: "Cualquiera" },
                  ].map((zone) => (
                    <button
                      key={zone.value}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          zone: filters.zone === zone.value ? null : (zone.value as FilterOptions["zone"]),
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        filters.zone === zone.value
                          ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                          : "bg-white border-[#D4C8B8] text-[#1A4D2E] hover:border-[#1A4D2E]"
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-[#1A4D2E] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                  <FiClock size={13} /> Horarios
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: "ahora", label: "Ahora" },
                    { value: "24h", label: "24h" },
                    { value: "manana", label: "Manana" },
                    { value: "tarde", label: "Tarde" },
                    { value: "noche", label: "Noche" },
                  ].map((horario) => (
                    <button
                      key={horario.value}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          horario: filters.horario === horario.value ? null : (horario.value as FilterOptions["horario"]),
                        })
                      }
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                        filters.horario === horario.value
                          ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                          : "bg-white border-[#D4C8B8] text-[#1A4D2E] hover:border-[#1A4D2E]"
                      }`}
                    >
                      {horario.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-[#1A4D2E] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                  <FiArrowUp size={13} /> Ordenar
                </h3>
                <div className="space-y-1.5">
                  {[
                    { value: "cercano", label: "Mas cercano" },
                    { value: "favoritos", label: "Favoritos primero" },
                    { value: "populares", label: "Populares" },
                  ].map((orden) => (
                    <button
                      key={orden.value}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          ordenar: filters.ordenar === orden.value ? null : (orden.value as FilterOptions["ordenar"]),
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        filters.ordenar === orden.value
                          ? "bg-[#1A4D2E] text-white border-[#1A4D2E]"
                          : "bg-white border-[#D4C8B8] text-[#1A4D2E] hover:border-[#1A4D2E]"
                      }`}
                    >
                      {orden.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DACA] flex flex-col sm:flex-row xl:flex-col gap-2">
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    soloFavoritos: !filters.soloFavoritos,
                  })
                }
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  filters.soloFavoritos
                    ? "bg-[#F00808] text-white border-[#F00808]"
                    : "bg-white border-[#D4C8B8] text-[#1A4D2E] hover:border-[#F00808]"
                }`}
              >
                <FiHeart size={14} className={filters.soloFavoritos ? "fill-current" : ""} />
                Solo favoritos
              </button>

              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => onFiltersChange({ soloFavoritos: false })}
                  className="px-3 py-2 rounded-lg border border-[#1A4D2E] text-[#1A4D2E] font-bold text-xs hover:bg-[#F6F0E6] transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg bg-[#1A4D2E] text-white font-bold text-xs hover:bg-[#0D601E] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

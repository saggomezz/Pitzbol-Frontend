"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiFileText, FiX } from "react-icons/fi";

interface AdminHistorialSolicitudesModalProps {
  open: boolean;
  onClose: () => void;
  token?: string;
  targetHref?: string;
  description?: string;
}

export default function AdminHistorialSolicitudesModal({
  open,
  onClose,
  targetHref = "/admin/historial-solicitudes",
  description = "Este modal es legacy. El historial completo ahora vive en una pagina dedicada.",
}: AdminHistorialSolicitudesModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black bg-opacity-40 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-gradient-to-br from-[#F6F0E6] to-[#E8F5E9] rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto border-4 border-[#0D601E]/10 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[#0D601E] hover:text-[#F00808] text-2xl"><FiX /></button>
            <div className="mb-6 mt-2 flex items-center gap-3">
              <div className="rounded-2xl bg-white/70 p-3 text-[#0D601E]">
                <FiFileText size={26} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#1A4D2E]">Historial de Solicitudes</h2>
                <p className="text-[#769C7B]">{description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0D601E]/15 bg-white/80 p-5">
              <p className="text-sm text-[#1A4D2E]">
                Para una vista trackeable con filtros, detalle por movimiento e IDs copiables, abre la nueva seccion de historial.
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push(targetHref);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0D601E] px-4 py-3 font-bold text-white transition hover:bg-[#1A4D2E]"
              >
                <FiExternalLink />
                Abrir historial completo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

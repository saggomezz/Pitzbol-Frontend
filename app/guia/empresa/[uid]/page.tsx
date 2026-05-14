"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import PersonaTourFormModal from "@/app/components/PersonaTourFormModal";
import EditTourModal from "@/app/components/EditTourModal";
import {
  FiArrowLeft, FiPlus, FiEdit2, FiGlobe, FiCheckCircle,
  FiClock, FiDollarSign, FiMapPin, FiTrash2,
} from "react-icons/fi";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";

interface GuideProfile {
  uid: string;
  nombre: string;
  fotoPerfil: string;
  tipo: string;
  empresaNombre: string;
  empresaLogo: string;
  empresaPagina: string;
  idiomas: string[];
  especialidades: string[];
}

interface Tour {
  id: string;
  titulo: string;
  destino: string;
  fotoPrincipal: string;
  duracion: string;
  precio: string;
  queIncluye: string[];
  status: string;
  createdAt: string;
  descripcion: string;
  idiomas: string[];
  puntoRecogida: string;
  capacidad: string;
  incluyeTransporte: boolean;
  tipoVehiculo: string[];
  disponibilidad: string;
}

export default function EmpresaGuiaPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();

  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showNewTourModal, setShowNewTourModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    try {
      const [guideRes, toursRes] = await Promise.all([
        fetch(`/api/guides/profile/${uid}`),
        fetch(`/api/tours/guia/${uid}`),
      ]);
      const guideData = await guideRes.json();
      const toursData = await toursRes.json();
      if (guideData.success) setGuide(guideData.guide);
      if (toursData.success) setTours(toursData.tours || []);

      const userLocal = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
      setIsOwner(userLocal.uid === uid);
    } catch {}
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm("¿Eliminar este tour?")) return;
    setDeletingId(tourId);
    try {
      const res = await fetchWithAuth(`/api/tours/${tourId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setTours(prev => prev.filter(t => t.id !== tourId));
    } catch {}
    setDeletingId(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
      <div className="w-10 h-10 border-4 border-[#0D601E]/20 border-t-[#0D601E] rounded-full animate-spin" />
    </div>
  );

  if (!guide) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Perfil no encontrado.</p>
      <button onClick={() => router.back()} className="text-sm text-[#0D601E] underline">Volver</button>
    </div>
  );

  const displayName = guide.empresaNombre || guide.nombre;
  const displayLogo = guide.empresaLogo || guide.fotoPerfil;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] pb-16">

      {/* Header */}
      <div className="relative bg-linear-to-r from-[#0D601E] to-[#1A4D2E] text-white">
        {displayLogo && (
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <Image src={displayLogo} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <button
            onClick={() => router.push("/perfil")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors sm:mb-6"
          >
            <FiArrowLeft /> Mi perfil
          </button>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            {displayLogo ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 shadow-xl sm:h-20 sm:w-20">
                <Image src={displayLogo} alt={displayName} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:h-20 sm:w-20">
                <FaBus className="text-white text-3xl" />
              </div>
            )}
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Guía Empresarial</span>
                <span className="flex items-center gap-1 text-xs text-emerald-300">
                  <FiCheckCircle size={12} /> Verificado
                </span>
              </div>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">{displayName}</h1>
              {guide.empresaPagina && (
                <a
                  href={guide.empresaPagina}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 break-all text-sm text-white/70 transition-colors hover:text-white sm:break-normal"
                >
                  <FiGlobe size={12} /> {guide.empresaPagina}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Tours */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#0D601E]/10 p-4 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-[#1A4D2E]">
              Tours publicados <span className="text-gray-400 font-normal">({tours.length})</span>
            </h2>
            {isOwner && (
              <button
                onClick={() => setShowNewTourModal(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1A4D2E] px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-[#0D601E] sm:w-auto"
              >
                <FiPlus size={13} /> Agregar Tour
              </button>
            )}
          </div>

          {tours.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C9D4CB] bg-[#F6F9F6] px-4 py-8 text-center sm:py-10">
              <FaBus className="text-[#C9D4CB] text-4xl mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">Aún no hay tours publicados</p>
              {isOwner && (
                <button
                  onClick={() => setShowNewTourModal(true)}
                  className="mt-4 px-5 py-2 bg-[#1A4D2E] text-white text-xs font-bold rounded-full hover:bg-[#0D601E] transition-all"
                >
                  <FiPlus className="inline mr-1" size={11} /> Publicar primer tour
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tours.map(tour => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden border border-[#E0EAE1] bg-[#FAFAF7] group"
                >
                  <Link href={`/tours/${tour.id}`}>
                    {tour.fotoPrincipal ? (
                      <div className="relative h-36 overflow-hidden">
                        <Image
                          src={tour.fotoPrincipal}
                          alt={tour.titulo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-2 left-3 text-white text-xs font-bold flex items-center gap-1 drop-shadow">
                          <FiMapPin size={10} /> {tour.destino}
                        </span>
                      </div>
                    ) : (
                      <div className="h-36 bg-[#E8F5E9] flex items-center justify-center">
                        <FaMapMarkedAlt className="text-[#C9D4CB] text-3xl" />
                      </div>
                    )}
                  </Link>

                  <div className="p-3">
                    <p className="font-bold text-[#1A4D2E] text-sm line-clamp-1">{tour.titulo}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-gray-500">
                      {tour.duracion && (
                        <span className="text-[11px] flex items-center gap-1">
                          <FiClock size={10} /> {tour.duracion}
                        </span>
                      )}
                      {tour.precio && (
                        <span className="text-[11px] flex items-center gap-1 text-[#0D601E] font-semibold">
                          <FiDollarSign size={10} /> {tour.precio}
                        </span>
                      )}
                    </div>

                    {isOwner && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-2 sm:flex-row">
                        <button
                          onClick={() => setEditingTour(tour)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#1A4D2E] bg-[#E8F5E9] rounded-lg hover:bg-[#C8E6C9] transition-all"
                        >
                          <FiEdit2 size={11} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          disabled={deletingId === tour.id}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 sm:px-3"
                        >
                          <FiTrash2 size={11} /> {deletingId === tour.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal: nuevo tour */}
      <AnimatePresence>
        {showNewTourModal && (
          <PersonaTourFormModal
            guiaId={uid}
            guiaNombre={displayName}
            onClose={() => setShowNewTourModal(false)}
            onSuccess={(tour) => {
              setTours(prev => [tour, ...prev]);
              setShowNewTourModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: editar tour */}
      <AnimatePresence>
        {editingTour && (
          <EditTourModal
            tour={editingTour}
            guiaId={uid}
            onClose={() => setEditingTour(null)}
            onSuccess={(updated) => {
              setTours(prev => prev.map(t => t.id === updated.id ? updated : t));
              setEditingTour(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

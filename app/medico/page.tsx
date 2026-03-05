"use client";

import { FiActivity } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";
import PlaceRating from "@/app/components/PlaceRating";

export default function MedicoPage() {
  return (
    <CategoryPlacesPage
      categoryName="Médico"
      categoryFallbackLabel="Medico"
      categoriesToMatch={["Médico", "Medico", "Servicios Médicos", "Clinica", "Clínica"]}
      heroImage="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría de servicios"
      heroTitle="Servicios Médicos"
      heroDescription="Encuentra clínicas, consultorios y servicios médicos de apoyo para resolver cualquier imprevisto."
      statusIcon={FiActivity}
      statusText="Apoyo médico • Respuesta rápida"
      sectionTitle="Atención Médica"
      sectionSubtitle="Localiza servicios de salud disponibles según tu ubicación."
      searchPlaceholder="Buscar médico, clínica, consultorio, zona..."
      quickFilters={["Consulta", "Clínicas", "Especialidad", "Cercano", "Disponible"]}
      quickFilterKeywords={{
        "Consulta": ["consulta", "consultorio", "atencion", "medico"],
        "Clínicas": ["clinica", "clinicas", "hospital", "salud"],
        "Especialidad": ["especialidad", "especialista", "cardio", "trauma", "pediatria"],
        "Cercano": ["cercano", "centro", "zona", "guadalajara"],
        "Disponible": ["disponible", "abierto", "24", "atencion"]
      }}
      loadingText="Cargando servicios médicos..."
      emptyText="No se encontraron servicios médicos con ese criterio."
      defaultDescription="Explora este servicio médico recomendado para atención y seguimiento durante tu visita."
    />
  );
}

"use client";

import { FiShield } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function HospitalesPage() {
  return (
    <CategoryPlacesPage
      categoryName="Hospitales"
      categoriesToMatch={["Hospitales", "Hospital"]}
      heroImage="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría de servicios"
      heroTitle="Hospitales y Atención 24/7"
      heroDescription="Accede rápidamente a hospitales cercanos para atención de emergencias o consultas durante tu viaje."
      statusIcon={FiShield}
      statusText="Atención prioritaria • Cobertura local"
      sectionTitle="Hospitales Cercanos"
      sectionSubtitle="Tu seguridad también es parte de la experiencia."
      searchPlaceholder="Buscar hospital, urgencias, clínica, zona..."
      quickFilters={["Urgencias", "24 horas", "Privado", "General", "Cercano"]}
      loadingText="Cargando hospitales..."
      emptyText="No se encontraron hospitales con ese criterio."
      defaultDescription="Revisa este centro hospitalario recomendado para atención médica en Guadalajara."
    />
  );
}

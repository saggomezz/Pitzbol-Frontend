"use client";

import { FiCompass } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";
import PlaceRating from "@/app/components/PlaceRating";
import { getQuickFilters } from "@/lib/categories";

const _subs = getQuickFilters('cultura');

export default function CulturaPage() {
  return (
    <CategoryPlacesPage
      categoryName="Cultura"
      heroImage="https://www.entornoturistico.com/wp-content/uploads/2023/06/Bailes-y-danzas-tradicionales-de-Jalisco.jpg"
      heroLabel="Categoría destacada"
      heroTitle="Cultura Viva en Guadalajara"
      heroDescription="Explora recintos históricos, tradiciones, centros culturales y espacios que cuentan la historia tapatía."
      statusIcon={FiCompass}
      statusText="Ruta cultural • Activa hoy"
      sectionTitle="Lugares de Cultura"
      sectionSubtitle="Encuentra experiencias auténticas para vivir la ciudad más allá del estadio."
      searchPlaceholder="Buscar museo, plaza, tradición, zona..."
      quickFilters={_subs.map(s => s.label)}
      quickFilterKeywords={Object.fromEntries(_subs.map(s => [s.label, s.keywords]))}
      loadingText="Cargando lugares de cultura..."
      emptyText="No se encontraron lugares de cultura con ese criterio."
      defaultDescription="Conoce este lugar cultural recomendado para conectar con la esencia de Guadalajara."
    />
  );
}

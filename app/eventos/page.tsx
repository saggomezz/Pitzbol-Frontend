"use client";

import { FiCalendar } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";
import PlaceRating from "@/app/components/PlaceRating";
import { getQuickFilters } from "@/lib/categories";

const _subs = getQuickFilters('eventos');

export default function EventosPage() {
  return (
    <CategoryPlacesPage
      categoryName="Eventos"
      heroImage="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría destacada"
      heroTitle="Eventos para Junio-Julio en Guadalajara"
      heroDescription="Conciertos, ferias, arte y experiencias culturales únicas durante el Mundial 2026. Vive Guadalajara como nunca antes."
      statusIcon={FiCalendar}
      statusText="Agenda en movimiento • Recomendaciones"
      sectionTitle="Eventos Cercanos"
      sectionSubtitle="Planea tu día con actividades destacadas en Guadalajara."
      searchPlaceholder="Buscar concierto, feria, arte, evento, zona..."
      quickFilters={_subs.map(s => s.label)}
      quickFilterKeywords={Object.fromEntries(_subs.map(s => [s.label, s.keywords]))}
      loadingText="Cargando eventos..."
      emptyText="No se encontraron eventos con ese criterio."
      defaultDescription="Explora este evento recomendado para complementar tu experiencia en la ciudad."
    />
  );
}

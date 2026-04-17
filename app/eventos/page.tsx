"use client";

import { FiCalendar } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";
import PlaceRating from "@/app/components/PlaceRating";

export default function EventosPage() {
  return (
    <CategoryPlacesPage
      categoryName="Eventos"
      heroImage="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría destacada"
      heroTitle="Eventos para Cada Día"
      heroDescription="Descubre conciertos, actividades, experiencias temáticas y eventos especiales durante tu visita."
      statusIcon={FiCalendar}
      statusText="Agenda en movimiento • Recomendaciones"
      sectionTitle="Eventos Cercanos"
      sectionSubtitle="Planea tu día con actividades destacadas en Guadalajara."
      searchPlaceholder="Buscar concierto, actividad, evento, zona..."
      quickFilters={["Vida Nocturna", "Casas de Cambio", "Hospital"]}
      quickFilterKeywords={{
        "Vida Nocturna": ["nocturna", "nocturno", "bar", "club", "cantina", "noche"],
        "Casas de Cambio": ["cambio", "divisas", "moneda", "exchange"],
        "Hospital": ["hospital", "clinica", "medico", "salud", "urgencias"]
      }}
      loadingText="Cargando eventos..."
      emptyText="No se encontraron eventos con ese criterio."
      defaultDescription="Explora este evento recomendado para complementar tu experiencia en la ciudad."
    />
  );
}

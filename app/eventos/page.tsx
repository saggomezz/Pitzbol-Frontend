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
      heroTitle="Eventos para Junio-Julio en Guadalajara"
      heroDescription="Conciertos, ferias, arte y experiencias culturales únicas durante el Mundial 2026. Vive Guadalajara como nunca antes."
      statusIcon={FiCalendar}
      statusText="Agenda en movimiento • Recomendaciones"
      sectionTitle="Eventos Cercanos"
      sectionSubtitle="Planea tu día con actividades destacadas en Guadalajara."
      searchPlaceholder="Buscar concierto, feria, arte, evento, zona..."
      quickFilters={["Arte", "Ferias", "Conciertos"]}
      quickFilterKeywords={{
        "Arte": ["arte", "galeria", "galería", "exposicion", "exposición", "pintura", "escultura", "museo", "historia"],
        "Ferias": ["feria", "mercado", "artesanal", "artesania", "artesanía", "tianguis"],
        "Conciertos": ["concierto", "musica", "música", "banda", "orquesta", "show", "teatro", "degollado", "festival"]
      }}
      loadingText="Cargando eventos..."
      emptyText="No se encontraron eventos con ese criterio."
      defaultDescription="Explora este evento recomendado para complementar tu experiencia en la ciudad."
    />
  );
}

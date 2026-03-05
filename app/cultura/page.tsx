"use client";

import { FiCompass } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function CulturaPage() {
  return (
    <CategoryPlacesPage
      categoryName="Cultura"
      heroImage="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría destacada"
      heroTitle="Cultura Viva en Guadalajara"
      heroDescription="Explora recintos históricos, tradiciones, centros culturales y espacios que cuentan la historia tapatía."
      statusIcon={FiCompass}
      statusText="Ruta cultural • Activa hoy"
      sectionTitle="Lugares de Cultura"
      sectionSubtitle="Encuentra experiencias auténticas para vivir la ciudad más allá del estadio."
      searchPlaceholder="Buscar museo, plaza, tradición, zona..."
      quickFilters={["Tradición", "Historia", "Centro", "Patrimonio", "Familiar"]}
      quickFilterKeywords={{
        "Tradición": ["tradicion", "tradicional", "cultural", "folklor", "artesania"],
        "Historia": ["historia", "historico", "museo", "patrimonio", "centro"],
        "Centro": ["centro", "centro historico", "guadalajara centro"],
        "Patrimonio": ["patrimonio", "arquitectura", "monumento", "catedral"],
        "Familiar": ["familiar", "familia", "plaza", "parque", "museo"]
      }}
      loadingText="Cargando lugares de cultura..."
      emptyText="No se encontraron lugares de cultura con ese criterio."
      defaultDescription="Conoce este lugar cultural recomendado para conectar con la esencia de Guadalajara."
    />
  );
}

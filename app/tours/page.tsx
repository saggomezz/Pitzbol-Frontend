"use client";

import { FiCompass } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function ToursPage() {
  return (
    <CategoryPlacesPage
      categoryName="Tours"
      categoriesToMatch={["Tours", "Transporte / Traslados / Tours", "Tour", "Traslados"]}
      heroImage="https://res.cloudinary.com/ddgkagn4y/image/upload/v1776484529/a2_go8rka.jpg"
      heroLabel="Experiencias guiadas"
      heroTitle="Tours dentro y alrededor de Guadalajara"
      heroDescription="Explora Guadalajara y sus alrededores con tours guiados, recorridos culturales, rutas en bici y experiencias únicas."
      statusIcon={FiCompass}
      statusText="Turismo • Recomendaciones"
      sectionTitle="Tours Disponibles"
      sectionSubtitle="Recorridos dentro y alrededor de Guadalajara para todos los gustos."
      searchPlaceholder="Buscar tour, recorrido, ruta, zona..."
      quickFilters={["Tours en GDL", "Tours alrededor de GDL"]}
      quickFilterKeywords={{
        "Tours en GDL": ["tour", "recorrido", "city tour", "a pie", "bici", "guiado", "guadalajara"],
        "Tours alrededor de GDL": ["tequila", "tlaquepaque", "tonala", "chapala", "tapalpa", "alrededores", "excursion"],
      }}
      loadingText="Cargando tours..."
      emptyText="No se encontraron tours con ese criterio."
      defaultDescription="Descubre este tour recomendado para vivir una experiencia única en Guadalajara y sus alrededores."
    />
  );
}

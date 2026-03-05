"use client";

import { FiDollarSign } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function CasasCambioPage() {
  return (
    <CategoryPlacesPage
      categoryName="Casas de Cambio"
      categoriesToMatch={["Casas de Cambio", "Casa de Cambio", "Cambio de Divisas"]}
      heroImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1700"
      heroLabel="Categoría de servicios"
      heroTitle="Casas de Cambio Seguras"
      heroDescription="Ubica puntos confiables para cambiar divisas y resolver pagos rápidos durante tu estancia."
      statusIcon={FiDollarSign}
      statusText="Servicios financieros • Recomendados"
      sectionTitle="Casas de Cambio"
      sectionSubtitle="Encuentra opciones cercanas para operar con tranquilidad."
      searchPlaceholder="Buscar casa de cambio, divisas, zona..."
      quickFilters={["USD", "EUR", "Centro", "Cerca del estadio", "24 horas"]}
      loadingText="Cargando casas de cambio..."
      emptyText="No se encontraron casas de cambio con ese criterio."
      defaultDescription="Consulta este punto financiero recomendado para gestionar tu cambio de moneda."
    />
  );
}

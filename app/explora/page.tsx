"use client";

import { FiCompass } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function ExploraPage() {
  return (
    <CategoryPlacesPage
      categoryName="Explora más lugares"
      categoriesToMatch={[
        "Explora más lugares",
        "Otros",
      ]}
      heroImage="https://res.cloudinary.com/dckbtxa4a/image/upload/v1776398876/Guadalajara-Jalisco_wbm1m1.webp"
      heroLabel="Más de Guadalajara"
      heroTitle="Explora Otros Lugares"
      heroDescription="Artesanías, mercados locales, centros comerciales, aventura, fotografía y mucho más que descubrir en Guadalajara."
      statusIcon={FiCompass}
      statusText="Experiencias únicas • Recomendaciones"
      sectionTitle="Lugares para Explorar"
      sectionSubtitle="Tiendas, mercados, aventura y experiencias auténticas de la ciudad."
      searchPlaceholder="Buscar tienda, mercado, artesanía, zona..."
      quickFilters={["Artesanías", "Mercados", "Centros comerciales", "Aventura"]}
      quickFilterKeywords={{
        "Artesanías": ["artesanias", "artesania", "souvenirs", "souvenir", "talavera", "arte popular", "joyeria", "textiles"],
        "Mercados": ["mercado", "mercados locales", "tianguis", "bazar"],
        "Centros comerciales": ["centro comercial", "centros comerciales", "plaza", "mall", "compras"],
        "Aventura": ["aventura", "outdoor", "aire libre", "naturaleza", "parque"],
      }}
      loadingText="Cargando lugares..."
      emptyText="No se encontraron lugares con ese criterio."
      defaultDescription="Descubre este lugar único para complementar tu experiencia en Guadalajara."
    />
  );
}

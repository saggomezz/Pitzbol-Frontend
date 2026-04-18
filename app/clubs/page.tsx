"use client";

import { FiMusic } from "react-icons/fi";
import CategoryPlacesPage from "@/app/components/CategoryPlacesPage";

export default function ClubsPage() {
  return (
    <CategoryPlacesPage
      categoryName="Clubs"
      categoriesToMatch={["Clubs", "Clubs / Bar", "Vida Nocturna", "Bar"]}
      heroImage="https://res.cloudinary.com/ddgkagn4y/image/upload/v1776484397/ideas-tema-fiesta_rq0r9b.jpg"
      heroLabel="Vida nocturna"
      heroTitle="Clubs y Bares en GDL"
      heroDescription="Descubre los mejores clubs, bares y cantinas para vivir la noche de Guadalajara al máximo."
      statusIcon={FiMusic}
      statusText="Vida nocturna • Recomendaciones"
      sectionTitle="Clubs y Bares"
      sectionSubtitle="Los mejores espacios para salir de noche en Guadalajara."
      searchPlaceholder="Buscar club, bar, cantina, zona..."
      quickFilters={["Club", "Bar"]}
      quickFilterKeywords={{
        "Club": ["club", "antro", "discoteca", "nocturno", "nightclub"],
        "Bar": ["bar", "cantina", "pub", "taberna"],
      }}
      loadingText="Cargando clubs y bares..."
      emptyText="No se encontraron lugares con ese criterio."
      defaultDescription="Explora este espacio nocturno recomendado para vivir la mejor noche en Guadalajara."
    />
  );
}

"use client";
import { useState } from "react";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import GuideModal from "./components/GuideModal";

// Configuración de fuentes
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jockey = Jockey_One({ variable: "--font-jockey", subsets: ["latin"], weight: "400" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["300"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ESTADOS GLOBALES: Controlan la visibilidad de los modales desde cualquier página
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} ${roboto.variable} antialiased bg-[#FDFCF9]`}
      >
        {/* 1. NAVBAR GLOBAL
            Este componente se queda estático mientras se navega
            Recibe las funciones para abrir los modales */}
        <Navbar 
          onOpenAuth={() => setIsAuthOpen(true)} 
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenBusiness={() => console.log("Lógica de Negocios")} 
        />

        {/* 2. CONTENIDO DE LA PÁGINA
            Aquí es Home (/), Perfil (/perfil), etc. */}
        <main className="relative z-10">
          {children}
        </main>

        {/* 3. MODALES GLOBALES
            Se renderizan fuera del flujo del 'main' para evitar conflictos de z-index. */}
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        
        <GuideModal 
          isOpen={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />

        {/* Agrega aquí un modal de Negocios si lo tienes listo */}
      </body>
    </html>
  );
}
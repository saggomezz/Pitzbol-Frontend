"use client";
import { useState } from "react";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import GuideModal from "./components/GuideModal";
import BusinessModal from "./components/BusinessModal";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jockey = Jockey_One({
  variable: "--font-jockey",
  subsets: ["latin"],
  weight: "400",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const DynamicGuideModal = GuideModal as any;
  const DynamicAuthModal = AuthModal as any;
  const DynamicBusinessModal = BusinessModal as any;

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} ${roboto.variable} antialiased bg-[#FDFCF9]`}>
        
        <Navbar 
          onOpenAuth={() => setIsAuthOpen(true)} 
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenBusiness={() => setIsBusinessOpen(true)} 
        />

        <main className="relative z-10">
          {children}
        </main>

        {/* 3. FOOTER GLOBAL */}
        <Footer />

        {/* 4. MODALES GLOBALES
            Se renderizan fuera del flujo del 'main' para evitar conflictos de z-index. */}
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        
        <DynamicGuideModal 
          isOpen={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />

        <DynamicBusinessModal 
          isOpen={isBusinessOpen} 
          onClose={() => setIsBusinessOpen(false)} 
        />

      </body>
    </html>
  );
}
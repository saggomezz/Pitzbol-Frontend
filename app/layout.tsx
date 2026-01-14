"use client";
import { useState, useEffect } from "react";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono, Roboto } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import GuideModal from "./components/GuideModal";
import BusinessModal from "./components/BusinessModal";

declare global {
  interface Window {
    onAuthSuccessShowGuide?: () => void;
    onAuthSuccessShowBusiness?: () => void;
    onAuthSuccessByRole?: (role: string) => void;
  }
}

const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jockey = Jockey_One({ variable: "--font-jockey", subsets: ["latin"], weight: "400" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["300"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"turista" | "guia" | "negocio">("turista");

  useEffect(() => {
    window.onAuthSuccessShowGuide = () => {
      setIsAuthOpen(false); 
      setPendingRole("guia");
      setTimeout(() => {
        setIsGuideOpen(true);
      }, 500);
    };

    window.onAuthSuccessShowBusiness = () => {
      setIsAuthOpen(false);
      setPendingRole("negocio");
      setTimeout(() => {
        setIsBusinessOpen(true);
      }, 500);
    };
    window.onAuthSuccessByRole = (role: string) => {
      setIsAuthOpen(false);
      
      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "/admin"; 
        } else if (role === "guia") {
          setIsGuideOpen(true);
        } else if (role === "negocio") {
          setIsBusinessOpen(true);
        } else {
          window.location.href = "/perfil";
        }
      }, 500);
    };
  }, []);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} ${roboto.variable} antialiased bg-[#FDFCF9]`}>
        
        <Navbar 
          onOpenAuth={() => { setPendingRole("turista"); setIsAuthOpen(true); }} 
          onOpenAuthAsGuide={() => { setPendingRole("guia"); setIsAuthOpen(true); }}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenAuthAsBusiness={() => { setPendingRole("negocio"); setIsAuthOpen(true); }}
          onOpenBusiness={() => setIsBusinessOpen(true)} 
        />

        <main className="relative z-10 min-h-screen">
          {children}
        </main>

        <Footer />

        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal 
              isOpen={isAuthOpen} 
              onClose={() => setIsAuthOpen(false)}
              intendedRole={pendingRole}
            />
          )}

          {isGuideOpen && (
            <GuideModal 
              isOpen={isGuideOpen} 
              onClose={() => setIsGuideOpen(false)} 
              onOpenAuth={() => { setPendingRole("guia"); setIsAuthOpen(true); }}
            />
          )}

          {isBusinessOpen && (
            <BusinessModal 
              isOpen={isBusinessOpen} 
              onClose={() => setIsBusinessOpen(false)} 
            />
          )}
        </AnimatePresence>
      </body>
    </html>
  );
}
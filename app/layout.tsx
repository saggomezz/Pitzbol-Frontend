"use client";
import { ensureFaceApiReady } from "./initTF";
import { useState, useEffect } from "react";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono, Roboto } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from 'next-intl';
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import BecomeGuideFlow from "./components/BecomeGuideFlow";
const PublishBusinessFlow = dynamic(() => import("./components/PublishBusinessFlow"), { ssr: false });

declare global {
  interface Window {
    onAuthSuccessShowGuide?: () => void;
    onAuthSuccessShowBusiness?: () => void;
    onAuthSuccessByRole?: (role: string) => void;
    openBusinessFlowLikeNavbar?: () => void;
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
  const [locale, setLocale] = useState('es');
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    // Cargar mensajes de traducción
    const loadMessages = async () => {
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] || 'es';
      
      setLocale(cookieLocale);
      
      try {
        const msgs = await import(`../messages/${cookieLocale}.json`);
        setMessages(msgs.default);
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback a español
        const fallback = await import(`../messages/es.json`);
        setMessages(fallback.default);
      }
    };

    loadMessages();

    // Pre-cargar TensorFlow.js y face-api.js globalmente al cargar la página
    ensureFaceApiReady().catch(err => {
      console.error("Error pre-cargando librerías de reconocimiento facial:", err);
    });

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

    // Reuse this from pages that need the exact same behavior as the navbar business action.
    window.openBusinessFlowLikeNavbar = () => {
      const hasUser = !!localStorage.getItem("pitzbol_user");
      if (hasUser) {
        setPendingRole("negocio");
        setIsBusinessOpen(true);
        return;
      }
      setPendingRole("negocio");
      setIsAuthOpen(true);
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

    return () => {
      delete window.openBusinessFlowLikeNavbar;
    };
  }, []);

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#FDFCF9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pitzbol" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} ${roboto.variable} antialiased bg-[#FDFCF9]`}>
        {messages ? (
          <NextIntlClientProvider locale={locale} messages={messages}>
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
                <BecomeGuideFlow 
                  isOpen={isGuideOpen} 
                  onClose={() => setIsGuideOpen(false)}
                />
              )}

              {isBusinessOpen && (
                <PublishBusinessFlow 
                  isOpen={isBusinessOpen} 
                  onClose={() => setIsBusinessOpen(false)} 
                />
              )}
            </AnimatePresence>
          </NextIntlClientProvider>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">Cargando...</div>
          </div>
        )}
      </body>
    </html>
  );
}
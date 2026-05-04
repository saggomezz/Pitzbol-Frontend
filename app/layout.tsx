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
import InstallPWAPrompt from "./components/InstallPWAPrompt";
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

function getRoleFromStorage(): string {
  try {
    const u = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    return u.role || u.rol || u["03_rol"] || "";
  } catch { return ""; }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"turista" | "guia" | "negocio">("turista");
  const [roleConflict, setRoleConflict] = useState<"guia" | "negocio" | null>(null);
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
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
              onOpenGuide={() => {
                const role = getRoleFromStorage();
                if (role === "negocio" || role === "negociante") { setRoleConflict("guia"); return; }
                setIsGuideOpen(true);
              }}
              onOpenAuthAsBusiness={() => { setPendingRole("negocio"); setIsAuthOpen(true); }}
              onOpenBusiness={() => {
                const role = getRoleFromStorage();
                if (role === "guia") { setRoleConflict("negocio"); return; }
                setIsBusinessOpen(true);
              }}
            />

            <main className="relative z-10 min-h-screen">
              {children}
            </main>

            <Footer />

            <InstallPWAPrompt />

            {/* Modal de conflicto de roles */}
            {roleConflict && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A4D2E] mb-3">Cuenta con rol existente</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {roleConflict === "guia"
                      ? "Tu cuenta actual es de negocio. Si deseas ser guía, se recomienda crear una cuenta nueva con un correo diferente."
                      : "Tu cuenta actual es de guía. Si deseas publicar un negocio, se recomienda crear una cuenta nueva con un correo diferente."}
                  </p>
                  <button
                    onClick={() => setRoleConflict(null)}
                    className="w-full bg-[#0D601E] hover:bg-[#094d18] text-white py-3 rounded-full font-bold text-sm transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            )}

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
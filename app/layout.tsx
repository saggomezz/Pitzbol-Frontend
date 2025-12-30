"use client";
import { useState } from "react";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import GuideModal from "./components/GuideModal";

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
  const DynamicGuideModal = GuideModal as any;
  const DynamicAuthModal = AuthModal as any;

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} ${roboto.variable} antialiased bg-[#FDFCF9]`}>
        
        <Navbar 
          onOpenAuth={() => setIsAuthOpen(true)} 
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenBusiness={() => console.log("Negocios")} 
        />

        <main className="relative z-10">
          {children}
        </main>

        <DynamicAuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        
        <DynamicGuideModal 
          isOpen={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />

      </body>
    </html>
  );
}
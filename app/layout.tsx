import type { Metadata } from "next";
import { Geist, Geist_Mono, Jockey_One } from "next/font/google"; // <--- Cambiado
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de Jockey One
const jockey = Jockey_One({
  variable: "--font-jockey",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pitzbol",
  description: "Pasión por el mundial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono, Jockey_One, JetBrains_Mono } from "next/font/google"; // 1. Agregamos JetBrains_Mono
import "./globals.css";
import Script from "next/script";
import { Roboto } from "next/font/google";

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
  weight: ["300"], // Usamos 700 para que el número se vea grueso y legible
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
        // 3. Agregamos jetbrains.variable a la lista de clases
        className={`${geistSans.variable} ${geistMono.variable} ${jockey.variable} ${jetbrains.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
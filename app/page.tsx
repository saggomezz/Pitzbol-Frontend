"use client";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-rose-100 dark:from-zinc-900 dark:to-black font-sans">
      <main className="flex flex-col items-center justify-center text-center px-6 py-10 max-w-2xl">
        {/* Logo */}
        <Image
          src="/next.svg"
          alt="Next.js Logo"
          width={80}
          height={80}
          className="mb-6 dark:invert"
        />

        {/* Título */}
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          Bienvenido a <span className="text-pink-600">Pitzbol</span>🔒
        </h1>

        {/* Subtítulo */}
        <p className="text-lg text-zinc-700 dark:text-zinc-400 mb-8">
          Tu aplicación PWA creativa, hecha con Next.js + Tailwind CSS.  
          Este es el punto de partida para crear algo increíble.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#"
            className="px-6 py-3 rounded-full bg-pink-600 text-white font-medium hover:bg-pink-700 transition"
          >
            Empezar
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-pink-600 text-pink-600 font-medium hover:bg-pink-50 dark:hover:bg-zinc-800 transition"
          >
            Documentación
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-sm text-zinc-500 dark:text-zinc-600">
          Desarrollado con ❤️ por el equipo Pitzbool
        </footer>
      </main>
    </div>
  );
}

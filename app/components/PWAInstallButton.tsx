"use client";
import { usePWAInstall } from "@/app/context/PWAInstallContext";

/**
 * Botón de instalación manual de la PWA.
 * Solo se muestra cuando la app no está instalada y hay una forma de instalarla.
 * Útil para mostrar en la página de perfil o ajustes.
 */
export default function PWAInstallButton() {
  const { canInstall, isIOS, install, setShowBanner } = usePWAInstall();

  if (!canInstall) return null;

  if (isIOS) {
    return (
      <button
        onClick={() => setShowBanner(true)}
        className="flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold group w-full text-left border border-[#C8E6C9] bg-white transition-colors hover:bg-[#F1F8F6] hover:border-[#7CBF8A] hover:text-[#0D601E]"
      >
        <svg className="w-4 h-4 shrink-0 text-[#0D601E] group-hover:text-[#0D601E] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="text-[#1A4D2E] group-hover:text-[#0D601E] transition-colors">Descargar Pitzbol</span>
      </button>
    );
  }

  return (
    <button
      onClick={install}
      className="flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold group w-full text-left border border-[#D9E7D0] bg-white transition-colors hover:bg-[#F1F8F6] hover:border-[#7CBF8A] hover:text-[#0D601E]"
    >
      <svg className="w-4 h-4 shrink-0 text-[#0D601E] group-hover:text-[#0D601E] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <span className="text-[#1A4D2E] group-hover:text-[#0D601E] transition-colors">Descargar Pitzbol</span>
    </button>
  );
}

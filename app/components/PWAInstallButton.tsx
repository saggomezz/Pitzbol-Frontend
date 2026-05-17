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
        className="flex items-center gap-2 px-4 py-2.5 bg-[#F1F8F6] text-[#1A4D2E] border border-[#C8E6C9] rounded-xl text-sm font-semibold hover:bg-[#E0F2F1] active:scale-[0.98] transition-all"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Instalar Pitzbol
      </button>
    );
  }

  return (
    <button
      onClick={install}
      className="flex items-center gap-2 px-4 py-2.5 bg-[#1A4D2E] text-white rounded-xl text-sm font-semibold hover:bg-[#0D601E] active:scale-[0.98] transition-all"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      Instalar Pitzbol
    </button>
  );
}

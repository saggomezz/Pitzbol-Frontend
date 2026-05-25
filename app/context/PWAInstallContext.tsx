"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;
  isDismissedForever: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: (forever: boolean) => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissedForever, setIsDismissedForever] = useState(false);

  useEffect(() => {
    // Comprobar si ya está instalada como PWA
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const installedNow =
      standaloneQuery.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsInstalled(installedNow);

    // Escuchar si la instalan mientras la página está abierta
    const onAppInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", onAppInstalled);

    if (installedNow) return () => window.removeEventListener("appinstalled", onAppInstalled);

    // Comprobar si el usuario decidió no volver a ver el banner
    const never = localStorage.getItem("pwa_install_never");
    if (never === "true") {
      setIsDismissedForever(true);
      // Aun así capturamos el deferredPrompt para el botón manual
    }

    // Comprobar si está en período de espera (7 días)
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    const recentlyDismissed =
      dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000;

    // Detectar iOS (Safari no soporta beforeinstallprompt)
    const ua = navigator.userAgent;
    const isiOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isiOS) {
      setIsIOS(true);
      if (!never && !recentlyDismissed) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("appinstalled", onAppInstalled);
        };
      }
      return () => window.removeEventListener("appinstalled", onAppInstalled);
    }

    // Android / Chrome: capturar beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!never && !recentlyDismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback((forever: boolean) => {
    setShowBanner(false);
    if (forever) {
      localStorage.setItem("pwa_install_never", "true");
      localStorage.removeItem("pwa_install_dismissed");
      setIsDismissedForever(true);
    } else {
      localStorage.setItem("pwa_install_dismissed", String(Date.now()));
    }
  }, []);

  // canInstall: la app no está instalada y hay una forma de instalarla
  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  return (
    <PWAInstallContext.Provider
      value={{
        deferredPrompt,
        isInstalled,
        isIOS,
        showBanner,
        setShowBanner,
        isDismissedForever,
        canInstall,
        install,
        dismiss,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const ctx = useContext(PWAInstallContext);
  if (!ctx) throw new Error("usePWAInstall debe usarse dentro de PWAInstallProvider");
  return ctx;
}

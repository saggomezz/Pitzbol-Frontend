"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "../components/AuthModal";

export default function LoginPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Si ya hay sesión activa, redirigir al inicio
    const user = localStorage.getItem("pitzbol_user");
    if (user) {
      router.replace("/");
      return;
    }

    // Si viene con returnTo, interceptar el evento de auth exitoso
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    const pendingSave = params.get("pendingSave");
    
    // Validate returnTo is a safe relative path (prevent open redirect)
    const isSafeRedirect = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//");
    if (!isSafeRedirect) return;

    // AuthModal dispara window.dispatchEvent(new Event("storage")) tras login/registro exitoso
    const handleAuth = () => {
      const raw = localStorage.getItem("pitzbol_user");
      if (!raw) return;
      try {
        const { uid } = JSON.parse(raw);
        if (uid) {
          const dest = `${returnTo}?uid=${uid}${pendingSave === "1" ? "&pendingSave=1" : ""}`;
          setTimeout(() => window.location.replace(dest), 2100);
        }
      } catch {}
    };

    window.addEventListener("storage", handleAuth);
    return () => window.removeEventListener("storage", handleAuth);
  }, [router]);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={handleClose}
      intendedRole="turista"
    />
  );
}

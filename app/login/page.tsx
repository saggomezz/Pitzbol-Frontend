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
    }
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

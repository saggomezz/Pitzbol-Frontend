"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPerfil() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pitzbol_user") || "{}");
    if (!user.uid || user.role !== "admin") {
      router.replace("/");
      return;
    }
    router.replace("/admin/guias");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#FDFCF9]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0D601E]/20 border-t-[#0D601E]" />
    </div>
  );
}
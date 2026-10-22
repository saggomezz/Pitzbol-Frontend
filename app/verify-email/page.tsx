"use client";

import { applyActionCode } from "firebase/auth";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { auth } from "@/lib/firebase";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Confirmando tu correo...");

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setState("error");
      setMessage("El enlace de verificación es inválido o está incompleto.");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        setState("success");
        setMessage("Tu correo fue verificado correctamente. Ya puedes continuar con tu registro.");
      })
      .catch((error: { code?: string }) => {
        setState("error");
        setMessage(
          error.code === "auth/expired-action-code"
            ? "El enlace de verificación expiró. Solicita que te enviemos uno nuevo."
            : error.code === "auth/invalid-action-code"
              ? "El enlace ya fue utilizado o no es válido."
              : "No pudimos verificar el correo. Solicita un enlace nuevo."
        );
      });
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-6">
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[32px] bg-white p-10 text-center shadow-2xl border border-[#F6F0E6]"
      >
        {state === "loading" ? (
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#E0EDE0] border-t-[#0D601E]" />
        ) : state === "success" ? (
          <FiCheckCircle className="mx-auto mb-5 text-[#0D601E]" size={56} />
        ) : (
          <FiAlertCircle className="mx-auto mb-5 text-[#F00808]" size={56} />
        )}

        <h1 className="mb-4 text-3xl font-black text-[#1A4D2E]">
          {state === "success" ? "Correo confirmado" : state === "error" ? "No se pudo confirmar" : "Verificando correo"}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-600">{message}</p>

        {state !== "loading" && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-full bg-[#0D601E] py-3 font-bold text-white transition-colors hover:bg-[#094d18]"
          >
            {state === "success" ? "Volver a Pitzbol" : "Volver al inicio"}
          </button>
        )}
      </motion.section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

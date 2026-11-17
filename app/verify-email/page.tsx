"use client";

import { applyActionCode } from "firebase/auth";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";
import { getFirebaseAuth } from "@/lib/firebase";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Confirmando tu correo...");
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    const registrationToken = searchParams.get("registrationToken");
    if (registrationToken) {
      fetch(`${getBackendOrigin()}/api/auth/complete-pending-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationToken }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data?.msg || "No se pudo completar el registro.");
          }

          localStorage.setItem("pitzbol_token", data.token);
          localStorage.setItem("pitzbol_user", JSON.stringify(data.user));
          sessionStorage.removeItem("pendingRegistrationToken");
          window.dispatchEvent(new Event("storage"));
          setRedirectTo(data.redirectTo || "/");
          setState("success");
          setMessage("Tu correo fue confirmado. Tu sesión ya está iniciada.");
          window.setTimeout(() => router.replace(data.redirectTo || "/"), 1400);
        })
        .catch((error: { message?: string }) => {
          setState("error");
          setMessage(error.message || "No se pudo completar el registro.");
        });
      return;
    }

    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setState("error");
      setMessage("El enlace de verificación es inválido o está incompleto.");
      return;
    }

    const auth = getFirebaseAuth();
    applyActionCode(auth, oobCode)
      .then(async () => {
        const pendingRaw = sessionStorage.getItem("pendingRegistration");
        const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
        const currentUser = auth.currentUser;

        if (!pending || !currentUser) {
          setState("success");
          setMessage("Tu correo fue verificado correctamente. Ya puedes iniciar sesión en Pitzbol.");
          return;
        }

        await currentUser.reload();
        const firebaseToken = await currentUser.getIdToken(true);
        const registerResponse = await fetch(`${getBackendOrigin()}/api/auth/complete-registration`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify({
            email: pending.email,
            nombre: pending.nombre,
            apellido: pending.apellido,
            nacionalidad: pending.nacionalidad,
            role: pending.role,
          }),
        });

        const registerData = await registerResponse.json().catch(() => ({}));
        if (!registerResponse.ok && registerResponse.status !== 400) {
          throw new Error(registerData?.msg || "No se pudo completar tu registro.");
        }

        const sessionResponse = await fetch(`${getBackendOrigin()}/api/auth/firebase-session`, {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${firebaseToken}` },
        });
        const sessionData = await sessionResponse.json().catch(() => ({}));
        if (!sessionResponse.ok) {
          throw new Error(sessionData?.msg || "No se pudo iniciar tu sesión.");
        }

        localStorage.setItem("pitzbol_token", sessionData.token);
        localStorage.setItem("pitzbol_user", JSON.stringify(sessionData.user));
        sessionStorage.removeItem("pendingRegistration");
        window.dispatchEvent(new Event("storage"));
        setRedirectTo(pending.redirectTo || "/");
        setState("success");
        setMessage("Tu correo fue confirmado. Tu sesión ya está iniciada.");
        window.setTimeout(() => router.replace(pending.redirectTo || "/"), 1400);
      })
      .catch((error: { code?: string; message?: string }) => {
        setState("error");
        setMessage(
          error.code === "auth/expired-action-code"
            ? "El enlace de verificación expiró. Solicita que te enviemos uno nuevo."
            : error.code === "auth/invalid-action-code"
              ? "El enlace ya fue utilizado o no es válido."
              : error.message || "No pudimos verificar el correo. Solicita un enlace nuevo."
        );
      });
  }, [router, searchParams]);

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
            onClick={() => router.push(redirectTo)}
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

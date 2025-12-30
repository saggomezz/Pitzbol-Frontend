"use client";

import { useState } from "react";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!email) {
      setMessage("Ingresa un correo válido");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
      });

      setMessage("📧 Revisa tu correo para continuar");
    } catch (error: any) {
      setMessage("Correo no registrado o inválido");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 shadow-lg rounded-xl">
        <h1 className="text-xl mb-4 text-center font-semibold">
          Recuperar contraseña
        </h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full border p-2 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleSend}
          className="w-full bg-[#0D601E] text-white py-2 rounded"
        >
          Enviar correo
        </button>

        {message && (
          <p className="text-sm mt-3 text-center text-gray-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

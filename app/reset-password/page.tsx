"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPasswordReset, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const oobCode = params.get("oobCode");

  const [password, setPassword] = useState("");

  const handleReset = async () => {
    if (!oobCode || !password) {
      alert("Datos inválidos");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      alert("Contraseña actualizada correctamente");
      router.push("/");
    } catch {
      alert("El enlace es inválido o expiró");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 shadow-lg rounded-xl">
        <h1 className="text-2xl mb-4 text-center">Nueva contraseña</h1>

        <input
          type="password"
          placeholder="Nueva contraseña"
          className="w-full border p-2 rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-green-700 text-white py-2 rounded mt-4"
        >
          Actualizar contraseña
        </button>
      </div>
    </div>
  );
}

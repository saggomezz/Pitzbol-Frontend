"use client";

import React, { useState } from "react";
import Link from "next/link";

const Login: React.FC = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando sesión con:", correo, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-6 w-80">
        <h2 className="text-2xl font-bold text-center mb-4 text-[#0B2C3D]">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Correo Electrónico
          </label>
          <input
            type="email"
            className="w-full p-2 border rounded-md mb-4"
            placeholder="ejemplo@gmail.com"
            required
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            type="password"
            className="w-full p-2 border rounded-md mb-4"
            placeholder="********"
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* BOTÓN PRINCIPAL AZUL */}
          <button
            type="submit"
            className="w-full bg-[#0B2C3D] hover:bg-[#0a2330] text-white p-2 rounded-md"
          >
            Ingresar
          </button>
        </form>

        {/* Enlace a registro */}
        <p className="text-center text-sm mt-4">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-[#008000] font-semibold">
            Regístrate
          </Link>
        </p>

        {/* NUEVO BOTÓN HOME — COLOR VERDE */}
        <div className="mt-3 text-center">
          <Link
            href="/"
            className="inline-block w-full bg-[#008000] hover:bg-green-700 text-white p-2 rounded-md"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

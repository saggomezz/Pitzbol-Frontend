"use client";

import React, { useState } from "react";

const Registro: React.FC = () => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    nacionalidad: "",
    telefono: "",
    correo: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registrando usuario:", form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 w-[380px]">
        
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Crear Cuenta
        </h2>

        <form onSubmit={handleSubmit} className="text-gray-700">

          {/* Nombre */}
          <div className="mb-4">
            <label className="mb-1 block text-sm">Nombre(s)</label>
            <input
              name="nombre"
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="Juan Carlos"
              onChange={handleChange}
              required
            />
          </div>

          {/* Apellidos */}
          <div className="mb-4">
            <label className="mb-1 block text-sm">Apellido(s)</label>
            <input
              name="apellido"
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="Pérez Gómez"
              onChange={handleChange}
              required
            />
          </div>

          {/* Nacionalidad */}
          <div className="mb-4">
            <label className="mb-1 block text-sm">Nacionalidad</label>
            <input
              name="nacionalidad"
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="Mexicana"
              onChange={handleChange}
              required
            />
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <label className="mb-1 block text-sm">Número Telefónico</label>
            <input
              name="telefono"
              type="tel"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="55 1234 5678"
              onChange={handleChange}
              required
            />
          </div>

          {/* Correo */}
          <div className="mb-4">
            <label className="mb-1 block text-sm">Correo Electrónico</label>
            <input
              name="correo"
              type="email"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="ejemplo@gmail.com"
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="mb-6">
            <label className="mb-1 block text-sm">Contraseña</label>
            <input
              name="password"
              type="password"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900 transition"
              placeholder="********"
              onChange={handleChange}
              required
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-black transition"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-gray-900 font-medium hover:underline">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default Registro;

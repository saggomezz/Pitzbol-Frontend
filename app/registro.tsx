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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-6 w-96">
        <h2 className="text-2xl font-bold text-center mb-4">Registro</h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Nombre(s)</label>
          <input
            name="nombre"
            type="text"
            className="w-full p-2 border rounded-md mb-3"
            placeholder="Juan Carlos"
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium">Apellido(s)</label>
          <input
            name="apellido"
            type="text"
            className="w-full p-2 border rounded-md mb-3"
            placeholder="Pérez Gómez"
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium">Nacionalidad</label>
          <input
            name="nacionalidad"
            type="text"
            className="w-full p-2 border rounded-md mb-3"
            placeholder="Mexicana"
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium">
            Número Telefónico
          </label>
          <input
            name="telefono"
            type="tel"
            className="w-full p-2 border rounded-md mb-3"
            placeholder="55 1234 5678"
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium">
            Correo Electrónico
          </label>
          <input
            name="correo"
            type="email"
            className="w-full p-2 border rounded-md mb-3"
            placeholder="ejemplo@gmail.com"
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium">Contraseña</label>
          <input
            name="password"
            type="password"
            className="w-full p-2 border rounded-md mb-4"
            placeholder="********"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-md"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 font-semibold">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default Registro;

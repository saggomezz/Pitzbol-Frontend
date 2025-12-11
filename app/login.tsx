import React, { useState } from "react";

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
        <h2 className="text-2xl font-bold text-center mb-4">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">
            Correo Electrónico
          </label>
          <input
            type="email"
            className="w-full p-2 border rounded-md mb-4"
            placeholder="ejemplo@gmail.com"
            required
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label className="block mb-2 text-sm font-medium">Contraseña</label>
          <input
            type="password"
            className="w-full p-2 border rounded-md mb-4"
            placeholder="********"
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="text-blue-600 font-semibold">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

"use client";

import React, { useState } from "react";
import { createBusiness } from "../../lib/business";
import styles from "../styles/Negocios.module.css";
import { enviarNotificacion } from "../../lib/notificaciones";
import { useRouter } from "next/navigation";
import { usePitzbolUser } from "../../lib/usePitzbolUser";

export default function PublicarNegocioPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rfc, setRfc] = useState("");
  const [cp, setCp] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const router = useRouter();
  const user = usePitzbolUser();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!user) {
      setError("Debes iniciar sesión para publicar un negocio.");
      setLoading(false);
      return;
    }
    try {
      const owner = user.uid;
      await createBusiness({
        name,
        description,
        owner,
        images,
        email,
        password,
        rfc,
        cp,
        category,
        phone,
        location,
        website
      });
      await enviarNotificacion(
        user.uid,
        'info',
        'Solicitud enviada',
        'Tu solicitud de negocio ha sido enviada y está en revisión.',
        '/negocio/estatus'
      );
      setSuccess(true);
      setTimeout(() => router.push("/perfil"), 2000);
    } catch (err: any) {
      setError("Error al enviar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F8F7] p-4">
      <form onSubmit={handleSubmit} className={styles.negocioCard + " w-full max-w-md"} style={{marginTop:32}}>
        <h2 className="text-2xl font-bold mb-4 text-[#3B5D50]">Publica tu Negocio</h2>
        {!user && (
          <div className="text-red-600 mb-4">Debes iniciar sesión para publicar un negocio.</div>
        )}
        <label className="block mb-2 text-[#3B5D50]">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">RFC</label>
        <input
          type="text"
          value={rfc}
          onChange={e => setRfc(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Código Postal</label>
        <input
          type="text"
          value={cp}
          onChange={e => setCp(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Categoría</label>
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Teléfono</label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Ubicación</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Sitio web</label>
        <input
          type="text"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Nombre del negocio</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Descripción</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2 text-[#3B5D50]">Imágenes (máx 3)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="mb-4"
          max={3}
        />
        <button
          type="submit"
          disabled={loading || !user}
          className="w-full bg-[#3B5D50] text-white py-2 rounded hover:bg-[#2d463d] transition"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">¡Solicitud enviada! Redirigiendo...</div>}
      </form>
    </div>
  );
}

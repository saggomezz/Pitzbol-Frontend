"use client";

import React, { useState } from "react";
import { createBusiness } from "../../lib/business";
import styles from "../styles/Negocios.module.css";
import { enviarNotificacion } from "../../lib/notificaciones";
import { useRouter } from "next/navigation";
import { usePitzbolUser } from "../../lib/usePitzbolUser";

type DaySchedule = { apertura: string; cierre: string } | "cerrado";
type WeekSchedule = Record<string, DaySchedule>;

const DIAS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  lunes:     { apertura: "09:00", cierre: "18:00" },
  martes:    { apertura: "09:00", cierre: "18:00" },
  miercoles: { apertura: "09:00", cierre: "18:00" },
  jueves:    { apertura: "09:00", cierre: "18:00" },
  viernes:   { apertura: "09:00", cierre: "18:00" },
  sabado:    { apertura: "10:00", cierre: "15:00" },
  domingo:   "cerrado",
};

export default function PublicarNegocioPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rfc, setRfc] = useState("");
  const [cp, setCp] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

  const setDayCerrado = (dia: string, cerrado: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [dia]: cerrado ? "cerrado" : { apertura: "09:00", cierre: "18:00" },
    }));
  };

  const setDayHour = (dia: string, field: "apertura" | "cierre", value: string) => {
    setSchedule(prev => {
      const current = prev[dia];
      if (current === "cerrado") return prev;
      return { ...prev, [dia]: { ...current, [field]: value } };
    });
  };
  const router = useRouter();
  const user = usePitzbolUser();

  const [imageError, setImageError] = useState("");
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        setImageError("Solo puedes subir hasta 3 imágenes.");
        setImages([]);
        return;
      }
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setImageError("Solo se permiten imágenes JPG, PNG o WebP.");
          setImages([]);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setImageError("Cada imagen debe pesar menos de 5MB.");
          setImages([]);
          return;
        }
      }
      setImages(files);
      console.log("Imágenes de galería seleccionadas:", files.map(f => f.name));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setLogoError("El logo debe ser JPG, PNG o WebP.");
        setLogo(null);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setLogoError("El logo debe pesar menos de 2MB.");
        setLogo(null);
        return;
      }
      setLogo(file);
      console.log("Logo seleccionado:", file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLogoError("");
    if (!user) {
      setError("Debes iniciar sesión para publicar un negocio.");
      setLoading(false);
      return;
    }
    if (!logo) {
      setLogoError("El logo del negocio es obligatorio.");
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
        logo,
        email,
        password,
        rfc,
        cp,
        category,
        phone,
        location,
        website,
        schedule,
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
        <label className="block mb-2 font-semibold text-[#3B5D50]">Horario de atención</label>
        <div className="mb-4 border rounded-lg overflow-hidden divide-y">
          {DIAS.map(({ id, label }) => {
            const day = schedule[id];
            const cerrado = day === "cerrado";
            return (
              <div key={id} className="flex items-center gap-3 px-3 py-2 bg-white">
                <span className="w-24 text-sm font-medium text-[#3B5D50] shrink-0">{label}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cerrado}
                    onChange={e => setDayCerrado(id, e.target.checked)}
                    className="accent-[#3B5D50]"
                  />
                  Cerrado
                </label>
                {!cerrado && typeof day === "object" && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={day.apertura}
                      onChange={e => setDayHour(id, "apertura", e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-24"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input
                      type="time"
                      value={day.cierre}
                      onChange={e => setDayHour(id, "cierre", e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-24"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <label className="block mb-2 text-[#3B5D50]">Logo del negocio <span className="text-red-600">*</span></label>
        <div style={{display:'flex',gap:16,marginBottom:8}}>
          <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:100,height:100,cursor:'pointer',background:'#FAFAFA'}}>
            {logo ? (
              <img src={URL.createObjectURL(logo)} alt="Preview logo" style={{maxWidth:80,maxHeight:80,borderRadius:8}} />
            ) : (
              <>
                <span style={{fontSize:32,opacity:0.3}}>🖼️</span>
                <span style={{fontSize:12,color:'#888'}}>Logo</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} style={{display:'none'}} />
          </label>
        </div>
        {logoError && <div className="text-red-600 mb-2">{logoError}</div>}
        <label className="block mb-2 text-[#3B5D50]">Galería del establecimiento</label>
        <div style={{display:'flex',gap:16,marginBottom:8}}>
          {[0,1,2].map(i => (
            <label key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:100,height:100,cursor:'pointer',background:'#FAFAFA',position:'relative'}}>
              {images[i] ? (
                <img src={URL.createObjectURL(images[i])} alt={`Preview galería ${i+1}`} style={{maxWidth:80,maxHeight:80,borderRadius:8}} />
              ) : (
                <>
                  <span style={{fontSize:32,opacity:0.3}}>🖼️</span>
                  <span style={{fontSize:12,color:'#888'}}>FOTO {i+1}</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  // Reemplazar la imagen en la posición i
                  const file = e.target.files[0];
                  let error = "";
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) error = "Solo se permiten imágenes JPG, PNG o WebP.";
                  if (file.size > 5 * 1024 * 1024) error = "Cada imagen debe pesar menos de 5MB.";
                  if (error) {
                    setImageError(error);
                    return;
                  }
                  setImageError("");
                  setImages(prev => {
                    const arr = [...prev];
                    arr[i] = file;
                    return arr;
                  });
                }
              }} />
            </label>
          ))}
        </div>
        <div style={{fontSize:13,color:'#888',marginBottom:8}}>
          <b>Nota:</b> Estas imágenes son fundamentales para validar la autenticidad de tu perfil. Podrás subir más fotos detalladas una vez que tu cuenta sea aprobada.
        </div>
        {imageError && <div className="text-red-600 mb-2">{imageError}</div>}
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

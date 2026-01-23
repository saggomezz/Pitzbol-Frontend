import { useEffect, useState } from "react";

export interface PitzbolUser {
  email: string;
  uid: string;
  nombre: string;
  apellido: string;
  fotoPerfil?: string | null;
  telefono?: string;
  nacionalidad?: string;
  especialidades?: string[];
  role: string;
  guide_status?: string;
}

export function usePitzbolUser(): PitzbolUser | null {
  const [user, setUser] = useState<PitzbolUser | null>(null);

  useEffect(() => {
    function syncUser() {
      const stored = localStorage.getItem("pitzbol_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    }
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("authStateChanged", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("authStateChanged", syncUser);
    };
  }, []);

  return user;
}

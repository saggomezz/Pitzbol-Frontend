import { useEffect, useRef, useState } from "react";

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
  const lastStoredUserRef = useRef<string | null>(null);

  useEffect(() => {
    function syncUser() {
      const stored = localStorage.getItem("pitzbol_user");
      if (stored === lastStoredUserRef.current) {
        return;
      }

      lastStoredUserRef.current = stored;

      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== "pitzbol_user") {
        return;
      }
      syncUser();
    }

    syncUser();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("authStateChanged", syncUser);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("authStateChanged", syncUser);
    };
  }, []);

  return user;
}

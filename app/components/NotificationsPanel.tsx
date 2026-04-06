"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import { FiBell, FiCheck, FiX, FiAlertCircle, FiChevronRight, FiLoader, FiBriefcase } from "react-icons/fi";
import { marcarNotificacionComoLeida } from "@/lib/notificaciones";
import DeletedBusinessModal from "./DeletedBusinessModal";

interface Notification {
  id: string;
  tipo: 'aprobado' | 'rechazado' | 'info' | 'solicitud_guia_pendiente' | 'contacto' | 'llamada' | 'nueva_solicitud_negocio' | 'solicitud_negocio_enviada' | 'negocio_aprobado' | 'negocio_rechazado' | 'negocio_archivado' | 'negocio_editado' | 'negocio_eliminado' | 'negocio_desarchivado' | 'negocio_pendiente';
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  enlace?: string;
  negocioId?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  solicitudId?: string;
  uidSolicitante?: string;
}

interface NotificationsPanelProps {
  userId?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const APPROVED_TOAST_PENDING_KEY = "pitzbol_approved_business_toast_pending_v2";
const DELETED_BUSINESS_NOTIFICATIONS_KEY_PREFIX = "pitzbol_deleted_business_notifications_";

type ApprovedToastPendingPayload = {
  businessId?: string;
  businessName?: string;
};

const BUSINESS_NOTIF_TYPES = new Set([
  'solicitud_negocio_enviada', 'negocio_aprobado', 'negocio_rechazado', 'negocio_archivado', 'negocio_editado', 'nueva_solicitud_negocio', 'negocio_eliminado', 'negocio_desarchivado', 'negocio_pendiente',
]);

type BusinessStatusApiResponse = {
  success?: boolean;
  exists?: boolean;
  deleted?: boolean;
  source?: "Pendientes" | "Activos" | "Archivados" | "Rechazados" | string;
  business?: {
    id?: string | null;
    name?: string | null;
  };
  deletion?: {
    businessId?: string | null;
    businessName?: string | null;
    reason?: string | null;
    message?: string | null;
    deletedAt?: string | null;
  } | null;
};

function extractBusinessIdFromNotification(notif: Notification): string | undefined {
  const fromFields = notif.solicitudId || notif.negocioId || notif.uidSolicitante;
  if (fromFields) return String(fromFields);

  const enlace = notif.enlace || "";
  if (!enlace) return undefined;

  const directAdmin = enlace.match(/\/admin\/negocios\/([^/?#]+)/);
  if (directAdmin?.[1]) return decodeURIComponent(directAdmin[1]);

  const userBusinessDetail = enlace.match(/\/negocio\/mis-solicitudes\/([^/?#]+)/);
  if (userBusinessDetail?.[1]) return decodeURIComponent(userBusinessDetail[1]);

  const previewQuery = enlace.match(/[?&]id=([^&#]+)/);
  if (previewQuery?.[1]) return decodeURIComponent(previewQuery[1]);

  const anyBusinessQuery = enlace.match(/[?&](negocioId|solicitudId)=([^&#]+)/);
  if (anyBusinessQuery?.[2]) return decodeURIComponent(anyBusinessQuery[2]);

  return undefined;
}

const buildPublicBusinessDetailLink = (businessName: string): string => {
  return `/informacion/${encodeURIComponent(businessName)}?origen=gestion-negocios-activo`;
};

const extractBusinessNameFromNotification = (notif: Notification): string | undefined => {
  const candidates = [notif.mensaje, notif.titulo];

  for (const text of candidates) {
    if (!text) continue;

    const quotedName = text.match(/"([^"]+)"/)?.[1]?.trim();
    if (quotedName) return quotedName;

    const singleQuotedName = text.match(/'([^']+)'/)?.[1]?.trim();
    if (singleQuotedName) return singleQuotedName;

    const directBusinessMatch = text.match(/(?:Tu negocio|Negocio|La solicitud de negocio|La notificación de negocio)\s+(.+?)\s+(?:ha sido|fue|se ha|está|esta|se encuentra|queda|queda\s+|ha quedado)/i)?.[1]?.trim();
    if (directBusinessMatch) {
      return directBusinessMatch.replace(/["'.,;:]+$/g, "").trim();
    }

    const trailingNameMatch = text.match(/:\s*(.+?)\s*(?:ha sido|fue|se ha|está|esta|se encuentra|queda|ha quedado)/i)?.[1]?.trim();
    if (trailingNameMatch) {
      return trailingNameMatch.replace(/["'.,;:]+$/g, "").trim();
    }
  }

  return undefined;
};

const getDeletedBusinessDisplayName = (notif: Notification | null): string | undefined => {
  if (!notif) return undefined;

  const fromMessage = extractBusinessNameFromNotification(notif);
  if (fromMessage) return fromMessage;

  const fromLink = extractBusinessIdFromNotification(notif);
  if (fromLink) return undefined;

  return undefined;
};

const normalizeBusinessName = (value?: string): string => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const getNotificationBusinessKey = (notif: Notification): string => {
  const businessId = extractBusinessIdFromNotification(notif);
  if (businessId) return `id:${businessId}`;

  const businessName = normalizeBusinessName(extractBusinessNameFromNotification(notif));
  if (businessName) return `name:${businessName}`;

  return "";
};

const getDeletedBusinessNotificationsStorageKey = (userId: string) => {
  return `${DELETED_BUSINESS_NOTIFICATIONS_KEY_PREFIX}${userId}`;
};

const persistDeletedBusinessNotifications = (userId: string, notifications: Notification[]) => {
  if (typeof window === "undefined" || !userId) return;

  const deletedMap: Record<string, Notification> = {};

  for (const notif of notifications) {
    if (notif.tipo !== "negocio_eliminado") continue;
    const businessKey = getNotificationBusinessKey(notif);
    if (!businessKey) continue;
    deletedMap[businessKey] = notif;
  }

  localStorage.setItem(getDeletedBusinessNotificationsStorageKey(userId), JSON.stringify(deletedMap));
};

const getPersistedDeletedBusinessNotification = (notif: Notification, userId?: string): Notification | null => {
  if (typeof window === "undefined" || !userId) return null;

  const businessKey = getNotificationBusinessKey(notif);
  if (!businessKey) return null;

  const raw = localStorage.getItem(getDeletedBusinessNotificationsStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, Notification>;
    const deletedNotif = parsed[businessKey];
    return deletedNotif || null;
  } catch {
    return null;
  }
};

const resolveDeletedBusinessFromBackend = async (notif: Notification): Promise<Notification | null> => {
  if (!BUSINESS_NOTIF_TYPES.has(notif.tipo)) return null;

  const token = localStorage.getItem("pitzbol_token");
  if (!token) return null;

  const businessId = extractBusinessIdFromNotification(notif) || "";
  const businessName = extractBusinessNameFromNotification(notif) || "";

  if (!businessId && !businessName) return null;

  const params = new URLSearchParams();
  if (businessId) params.set("businessId", businessId);
  if (businessName) params.set("businessName", businessName);

  try {
    const response = await fetch(`${BACKEND_URL}/api/business/status?${params.toString()}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.success || !data?.deleted || !data?.deletion) return null;

    const deletion = data.deletion;
    const resolvedName = deletion?.businessName || businessName || "Negocio";
    const resolvedReason = deletion?.reason ? ` Motivo: ${deletion.reason}` : "";

    return {
      id: `deleted-backend-${deletion?.businessId || businessId || resolvedName}`,
      tipo: "negocio_eliminado",
      titulo: "Negocio Eliminado",
      mensaje: deletion?.message || `Tu negocio "${resolvedName}" ha sido eliminado por el administrador.${resolvedReason}`,
      fecha: deletion?.deletedAt || new Date().toISOString(),
      leido: true,
      negocioId: deletion?.businessId || businessId || undefined,
    };
  } catch {
    return null;
  }
};

const resolveBusinessNavigationFromBackend = async (notif: Notification): Promise<{
  deletedNotification?: Notification;
  targetLink?: string;
}> => {
  if (!BUSINESS_NOTIF_TYPES.has(notif.tipo)) return {};

  const token = localStorage.getItem("pitzbol_token");
  if (!token) return {};

  const businessId = extractBusinessIdFromNotification(notif) || "";
  const businessName = extractBusinessNameFromNotification(notif) || "";
  if (!businessId && !businessName) return {};

  const params = new URLSearchParams();
  if (businessId) params.set("businessId", businessId);
  if (businessName) params.set("businessName", businessName);

  try {
    const response = await fetch(`${BACKEND_URL}/api/business/status?${params.toString()}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return {};
    const data = (await response.json()) as BusinessStatusApiResponse;
    if (!data?.success) return {};

    if (data.deleted && data.deletion) {
      const deletion = data.deletion;
      const resolvedName = deletion.businessName || businessName || "Negocio";
      const resolvedReason = deletion.reason ? ` Motivo: ${deletion.reason}` : "";

      return {
        deletedNotification: {
          id: `deleted-backend-${deletion.businessId || businessId || resolvedName}`,
          tipo: "negocio_eliminado",
          titulo: "Negocio Eliminado",
          mensaje: deletion.message || `Tu negocio "${resolvedName}" ha sido eliminado por el administrador.${resolvedReason}`,
          fecha: deletion.deletedAt || new Date().toISOString(),
          leido: true,
          negocioId: deletion.businessId || businessId || undefined,
        },
      };
    }

    if (data.exists) {
      const realBusinessId = data.business?.id || businessId;
      const realBusinessName = data.business?.name || businessName;
      const source = (data.source || "").toLowerCase();

      if (source === "activos" && realBusinessName) {
        return {
          targetLink: buildPublicBusinessDetailLink(realBusinessName),
        };
      }

      if (realBusinessId) {
        return {
          targetLink: `/negocio/mis-solicitudes/${realBusinessId}`,
        };
      }

      return {
        targetLink: "/negocio/mis-solicitudes",
      };
    }

    return {};
  } catch {
    return {};
  }
};

const findRelatedDeletedBusinessNotification = (
  notif: Notification,
  allNotifications: Notification[]
): Notification | null => {
  if (notif.tipo === "negocio_eliminado") return notif;

  const currentBusinessKey = getNotificationBusinessKey(notif);
  if (!currentBusinessKey) return null;

  for (const candidate of allNotifications) {
    if (candidate.tipo !== "negocio_eliminado") continue;

    const deletedBusinessKey = getNotificationBusinessKey(candidate);
    if (deletedBusinessKey && deletedBusinessKey === currentBusinessKey) {
      return candidate;
    }
  }

  return null;
};

/** Convierte enlaces viejos y normaliza navegación por ID de negocio según rol */
function resolveNotifLink(notif: Notification, userRole?: string): string | undefined {
  const enlace = notif.enlace;
  const businessId = extractBusinessIdFromNotification(notif);
  const isAdmin = (userRole || "").toLowerCase() === "admin";

  if (!isAdmin && notif.tipo === "negocio_aprobado") {
    const businessName = extractBusinessNameFromNotification(notif);
    if (businessName) {
      return buildPublicBusinessDetailLink(businessName);
    }
  }

  if (!enlace) {
    if (!businessId) return undefined;
    return isAdmin ? `/admin/negocios/${businessId}` : `/negocio/mis-solicitudes/${businessId}`;
  }

  // Para admins: siempre abrir detalle admin de solicitud por ID, independientemente del estatus
  if (isAdmin && BUSINESS_NOTIF_TYPES.has(notif.tipo) && businessId) {
    return `/admin/negocios/${businessId}`;
  }

  // Reescribir URLs antiguas de preview para notificaciones de negocio
  if (BUSINESS_NOTIF_TYPES.has(notif.tipo)) {
    const previewMatch = enlace.match(/\/negocio\/preview\?id=([^&]+)/);
    if (previewMatch) {
      const id = notif.solicitudId || notif.negocioId || previewMatch[1];
      return `/negocio/mis-solicitudes/${id}`;
    }
  }

  return enlace;
}

export default function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [isDeletedBusinessModalOpen, setIsDeletedBusinessModalOpen] = useState(false);
  const [selectedDeletedNotification, setSelectedDeletedNotification] = useState<Notification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const notificationsRef = useRef<Notification[]>([]);

  // Heurística para detectar notificaciones de negocio equivalentes aunque falte `negocioId`
  const areBusinessMessagesSimilar = (localNotif: Notification, backendNotif: Notification) => {
    if (!localNotif?.mensaje || !backendNotif?.mensaje) return false;
    if (localNotif.tipo !== backendNotif.tipo) return false;
    const tipo = localNotif.tipo;
    const msgA = (localNotif.mensaje || '').toLowerCase();
    const msgB = (backendNotif.mensaje || '').toLowerCase();

    // Caso: 'Se ha recibido una nueva solicitud de negocio: <nombre>' -> comparar prefijo antes de ':'
    if (tipo === 'nueva_solicitud_negocio') {
      const pa = msgA.split(':')[0].trim();
      const pb = msgB.split(':')[0].trim();
      return pa === pb;
    }

    // Para mensajes que contienen el nombre entre comillas, normalizar reemplazando el nombre por un placeholder
    const normalize = (m: string) => m.replace(/".*?"/g, '""').replace(/\s+/g, ' ').trim();
    return normalize(msgA) === normalize(msgB);
  };

  const mergeIncomingNotification = (prev: Notification[], notif: Notification): Notification[] => {
    // Try to match incoming notif by id first
    let idx = prev.findIndex((item) => item.id === notif.id);
    let updated = [...prev];

    if (idx >= 0) {
      const leido = prev[idx].leido ?? notif.leido ?? false;
      updated[idx] = { ...updated[idx], ...notif, leido };
    } else {
      // If not found by id, try to match by negocioId to replace stale local entries
      if (notif.negocioId) {
        idx = prev.findIndex((item) => item.negocioId && item.negocioId === notif.negocioId && item.tipo === notif.tipo);
      }

      if (idx >= 0) {
        const leido = prev[idx].leido ?? notif.leido ?? false;
        updated[idx] = { ...notif, leido };
      } else {
        updated = [{ ...notif, leido: notif.leido ?? false }, ...prev];
      }
    }

    // Remove duplicates by id (keep first occurrence)
    const seen = new Set<string>();
    updated = updated.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });

    updated = updated.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return updated;
  };

  useEffect(() => {
    notificationsRef.current = notificaciones;
  }, [notificaciones]);

  useEffect(() => {
    if (userId) {
      persistDeletedBusinessNotifications(userId, notificaciones);
    }
  }, [userId, notificaciones]);

  // Cargar notificaciones del backend (Firestore)
  const cargarNotificacionesDelBackend = async () => {
    if (!userId) return;
    setCargando(true);
    const key = `pitzbol_notifications_${userId}`;
    const notificacionesLocal: Notification[] = JSON.parse(localStorage.getItem(key) || '[]');

    try {
      setCargando(true);
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('pitzbol_token');
      const user = localStorage.getItem('pitzbol_user') ? JSON.parse(localStorage.getItem('pitzbol_user') || '{}') : null;
      
      // Obtener notificaciones del usuario (siempre)
      const response = await fetch(`${API_BASE}/api/admin/notificaciones/${userId}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      
      let notificacionesDelBackend: Notification[] = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notificaciones) {
          notificacionesDelBackend = data.notificaciones.map((notif: any) => {
            const mapped = {
              id: notif.id,
              tipo: notif.tipo,
              titulo: notif.titulo,
              mensaje: notif.mensaje,
              fecha: notif.fecha,
              leido: notif.leido || false,
              enlace: notif.enlace,
              negocioId: notif.negocioId,
              rejectionReason: notif.rejectionReason,
              rejectedAt: notif.rejectedAt,
              solicitudId: notif.solicitudId,
              uidSolicitante: notif.uidSolicitante
            };
            return mapped;
          });
        }
      }

      // Si es admin, también cargar notificaciones de soporte
      if (user?.role === 'admin') {
        try {
          const supportResponse = await fetch(`${API_BASE}/api/support/notifications`, {
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          });

          if (supportResponse.ok) {
            const supportData = await supportResponse.json();
            if (supportData.success && supportData.notificaciones) {
              const notificacionesSoporte = supportData.notificaciones.map((notif: any) => ({
                id: notif.id,
                tipo: notif.tipo,
                titulo: notif.titulo,
                mensaje: notif.mensaje,
                fecha: notif.fecha,
                leido: notif.leido || false,
                enlace: notif.enlace,
              }));
              notificacionesDelBackend = [...notificacionesDelBackend, ...notificacionesSoporte];
            }
          }
        } catch (error) {
          console.error("Error al cargar notificaciones de soporte:", error);
        }
      }

      // Combinar con localStorage y eliminar duplicados
      const key = `pitzbol_notifications_${userId}`;
      const notificacionesLocal = JSON.parse(localStorage.getItem(key) || '[]');

      // Mapas auxiliares
      const localMap = new Map((notificacionesLocal as Notification[]).map((n: Notification) => [n.id, n]));
      // Mapear backend por negocioId para poder deduplicar locales que tengan distinto id
      const backendByBusiness = new Map<string, Notification>();
      for (const b of notificacionesDelBackend) {
        if (b.negocioId) {
          const prev = backendByBusiness.get(b.negocioId);
          if (!prev || new Date(b.fecha).getTime() > new Date(prev.fecha).getTime()) {
            backendByBusiness.set(b.negocioId, b);
          }
        }
      }

      // Construir lista base usando back-end como fuente de verdad, preservando `leido` local si existe
      const notificacionesCombinadas: Notification[] = notificacionesDelBackend.map((notif: Notification) => {
        const local = localMap.get(notif.id);
        const leido = local ? (local.leido ?? notif.leido) : (notif.leido ?? false);
        return { ...notif, leido };
      });

      // Añadir locales que no están en backend y no corresponden a un negocio ya representado por backend
      const idsBackend = new Set(notificacionesDelBackend.map((n: Notification) => n.id));
      for (const localNotif of notificacionesLocal as Notification[]) {
        if (idsBackend.has(localNotif.id)) continue;
        // Si localNotif tiene negocioId y backend ya contiene una notificación para ese negocio,
        // solo preservamos `leido` cuando es la misma clase de notificación.
        if (localNotif.negocioId && backendByBusiness.has(localNotif.negocioId)) {
          const backendNotif = backendByBusiness.get(localNotif.negocioId)!;
          if (localNotif.tipo === backendNotif.tipo) {
            const idx = notificacionesCombinadas.findIndex(n => n.id === backendNotif.id);
            if (idx >= 0) {
              notificacionesCombinadas[idx] = { ...notificacionesCombinadas[idx], leido: localNotif.leido ?? notificacionesCombinadas[idx].leido };
            } else {
              notificacionesCombinadas.push({ ...backendNotif, leido: localNotif.leido ?? backendNotif.leido });
            }
            continue;
          }
        }

        // Si la notificación local no tiene negocioId, intentar emparejarla heurísticamente
        let matchedByHeuristic = false;
        if (!localNotif.negocioId && BUSINESS_NOTIF_TYPES.has(localNotif.tipo)) {
          for (const [bizId, backendNotif] of backendByBusiness.entries()) {
            if (areBusinessMessagesSimilar(localNotif, backendNotif)) {
              // remplazar/actualizar la notificación backend con el estado `leido` local
              const idx = notificacionesCombinadas.findIndex(n => n.id === backendNotif.id);
              if (idx >= 0) {
                notificacionesCombinadas[idx] = { ...notificacionesCombinadas[idx], leido: localNotif.leido ?? notificacionesCombinadas[idx].leido };
              } else {
                notificacionesCombinadas.push({ ...backendNotif, leido: localNotif.leido ?? backendNotif.leido });
              }
              matchedByHeuristic = true;
              break;
            }
          }
        }

        if (matchedByHeuristic) continue;

        // Local-only notification (no backend match): include it
        notificacionesCombinadas.push(localNotif);
      }

      // Ordenar por fecha (más recientes primero)
      notificacionesCombinadas.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setNotificaciones(notificacionesCombinadas);
      setNoLeidas(notificacionesCombinadas.filter((n) => !n.leido).length);

      // Actualizar localStorage
      localStorage.setItem(key, JSON.stringify(notificacionesCombinadas));
    } catch (error) {
      console.error("Error al cargar notificaciones del backend:", error);
      // Cargar solo del localStorage si el backend falla
      cargarNotificacionesLocal();
    } finally {
      setCargando(false);
    }
  };

  // Cargar notificaciones del localStorage
  const cargarNotificacionesLocal = () => {
    if (!userId) return;

    const key = `pitzbol_notifications_${userId}`;
    const stored = localStorage.getItem(key);
    const notifs: Notification[] = stored ? JSON.parse(stored) : [];
    setNotificaciones(notifs);
    setNoLeidas(notifs.filter((n) => !n.leido).length);
  };

  // Efecto inicial para cargar notificaciones
  useEffect(() => {
    if (userId) {
      cargarNotificacionesLocal();
      // Cargar del backend inmediatamente al montar (para admins y badge)
      cargarNotificacionesDelBackend();
    }
  }, [userId]);

  // El efecto de Firestore se elimina. Solo se usa la API REST y localStorage.
  // Recargar notificaciones cuando se abre el panel
  useEffect(() => {
    if (isOpen && userId) {
      cargarNotificacionesDelBackend();
    }
  }, [isOpen, userId]);

  // Polling ligero para admins: refresca cada 30s aunque el panel esté cerrado
  useEffect(() => {
    if (!userId) return;

    const user = localStorage.getItem('pitzbol_user') ? JSON.parse(localStorage.getItem('pitzbol_user') || '{}') : null;
    if (user?.role !== 'admin') return;

    const interval = setInterval(() => {
      cargarNotificacionesDelBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Cerrar modal/panel con Escape
  useEffect(() => {
    if (!isOpen && !isDeletedBusinessModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();

      // Prioridad: si la modal de eliminado está abierta, cerrar esa primero
      if (isDeletedBusinessModalOpen) {
        setIsDeletedBusinessModalOpen(false);
        setSelectedDeletedNotification(null);
        return;
      }

      setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isDeletedBusinessModalOpen]);

  // Escuchar cambios en storage
  useEffect(() => {
    const handleStorageChange = () => {
      cargarNotificacionesLocal();
    };
    const handleNotificationsUpdated = (event: Event) => {
      cargarNotificacionesLocal();
    };
    const handleRefreshFromBackend = () => {
      if (userId) {
        cargarNotificacionesDelBackend();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pitzbolNotificationsUpdated", handleNotificationsUpdated);
    window.addEventListener("refreshNotificationsFromBackend", handleRefreshFromBackend);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pitzbolNotificationsUpdated", handleNotificationsUpdated);
      window.removeEventListener("refreshNotificationsFromBackend", handleRefreshFromBackend);
    };
  }, [userId]);

  // Notificaciones en tiempo real por Socket.IO
  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("pitzbol_token") || "";
    socketRef.current = io(BACKEND_URL, {
      auth: {
        token,
        userId,
        userType: "tourist",
      },
    });

    socketRef.current.on("new-notification", (notif: Notification) => {
      const updated = mergeIncomingNotification(notificationsRef.current, notif);
      notificationsRef.current = updated;
      setNotificaciones(updated);
      setNoLeidas(updated.filter((n) => !n.leido).length);

      if (userId) {
        const key = `pitzbol_notifications_${userId}`;
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('pitzbolNotificationsUpdated', {
          detail: { key, source: 'socket' },
        }));
      }
    });

    // Listen for explicit business status changes from admin
    socketRef.current.on("business-status-changed", (data: any) => {
      const { businessId, status, timestamp } = data;
      console.log(`[NotificationsPanel] Received business-status-changed: ${businessId} -> ${status}`);
      
      // Dispatch a custom window event that pages can listen to
      window.dispatchEvent(new CustomEvent('businessStatusChanged', {
        detail: {
          businessId,
          status,
          timestamp,
        },
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const marcarComoLeida = async (id: string) => {
    if (!userId) return;
    // Usar la función centralizada de notificaciones
    marcarNotificacionComoLeida(userId, id);

    // Actualizar estado local
    const actualizadas = notificaciones.map(n => 
      n.id === id ? { ...n, leido: true } : n
    );
    
    setNotificaciones(actualizadas);
    setNoLeidas(actualizadas.filter(n => !n.leido).length);
    

    // Actualizar en el backend
    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/notifications/${id}/marcar-leida/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // response handled silently; UI already updated locally
    } catch (error) {
      console.error("❌ Error al marcar como leída en backend:", error);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    if (!userId) return;

    // Eliminar en el backend
    try {
      const token = localStorage.getItem('pitzbol_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/notifications/${id}/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Error al eliminar notificación: ${response.status}`);
      }

      const key = `pitzbol_notifications_${userId}`;
      const filtradas = notificaciones.filter(n => n.id !== id);
      localStorage.setItem(key, JSON.stringify(filtradas));
      setNotificaciones(filtradas);
      setNoLeidas(filtradas.filter(n => !n.leido).length);

      window.dispatchEvent(new CustomEvent('pitzbolNotificationsUpdated', {
        detail: { key, source: 'delete-notification' },
      }));

      // Sincronizar con backend para evitar estados locales obsoletos
      await cargarNotificacionesDelBackend();
    } catch (error) {
      console.error("Error al eliminar notificación en backend:", error);
    }
  };



  const getIconoNotificacion = (tipo: string) => {
    switch(tipo) {
      case 'aprobado':
        return <FiCheck className="text-green-600" size={20} />;
      case 'rechazado':
        return <FiAlertCircle className="text-red-600" size={20} />;
      case 'contacto':
        return <FiBell className="text-blue-600" size={20} />;
      case 'llamada':
        return <FiBell className="text-purple-600" size={20} />;
      case 'nueva_solicitud_negocio':
        return <FiBriefcase className="text-orange-500" size={20} />;
      case 'solicitud_negocio_enviada':
        return <FiBriefcase className="text-[#0D601E]" size={20} />;
      case 'negocio_aprobado':
        return <FiCheck className="text-emerald-600" size={20} />;
      case 'negocio_rechazado':
        return <FiAlertCircle className="text-red-600" size={20} />;
      case 'negocio_archivado':
        return <FiX className="text-red-600" size={20} />;
      case 'negocio_editado':
        return <FiBriefcase className="text-blue-600" size={20} />;
      case 'negocio_eliminado':
        return <FiAlertCircle className="text-red-600" size={20} />;
      default:
        return <FiBell className="text-blue-600" size={20} />;
    }
  };

  const getColorNotificacion = (tipo: string) => {
    switch(tipo) {
      case 'aprobado':
        return 'bg-green-50 border-green-100';
      case 'rechazado':
        return 'bg-red-50 border-red-100';
      case 'contacto':
        return 'bg-blue-50 border-blue-100';
      case 'llamada':
        return 'bg-purple-50 border-purple-100';
      case 'nueva_solicitud_negocio':
        return 'bg-orange-50 border-orange-100';
      case 'solicitud_negocio_enviada':
        return 'bg-emerald-50 border-emerald-100';
      case 'negocio_aprobado':
        return 'bg-emerald-50 border-emerald-100';
      case 'negocio_rechazado':
        return 'bg-red-50 border-red-100';
      case 'negocio_archivado':
        return 'bg-red-50 border-red-100';
      case 'negocio_editado':
        return 'bg-blue-50 border-blue-100';
      case 'negocio_eliminado':
        return 'bg-red-50 border-red-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const formatearFecha = (fecha: string) => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diff = ahora.getTime() - notifFecha.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return notifFecha.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const resolvePublicBusinessLinkById = async (notif: Notification): Promise<string | undefined> => {
    if (notif.tipo !== "negocio_aprobado") return undefined;

    const businessId = extractBusinessIdFromNotification(notif);
    if (!businessId) return undefined;

    const token = localStorage.getItem("pitzbol_token");
    if (!token) return undefined;

    try {
      const response = await fetch(`${BACKEND_URL}/api/business/by-id/${businessId}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return undefined;
      const data = await response.json();
      const businessName = data?.business?.business?.name;
      if (!businessName || typeof businessName !== "string") return undefined;

      return buildPublicBusinessDetailLink(businessName);
    } catch {
      return undefined;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    marcarComoLeida(notif.id);

    const backendNavigation = await resolveBusinessNavigationFromBackend(notif);
    if (backendNavigation.deletedNotification) {
      const deletedNotif = backendNavigation.deletedNotification;
      setSelectedDeletedNotification(deletedNotif);
      setIsDeletedBusinessModalOpen(true);

      if (userId) {
        const existing = notificationsRef.current;
        const merged = mergeIncomingNotification(existing, deletedNotif);
        notificationsRef.current = merged;
        setNotificaciones(merged);
        persistDeletedBusinessNotifications(userId, merged);
      }
      return;
    }

    if (backendNavigation.targetLink) {
      setIsOpen(false);

      const targetLink = backendNavigation.targetLink;
      if (targetLink.startsWith("/informacion/")) {
        const payload: ApprovedToastPendingPayload = {
          businessId: extractBusinessIdFromNotification(notif),
          businessName: extractBusinessNameFromNotification(notif),
        };

        const businessPathMatch = targetLink.match(/^\/informacion\/([^?/#]+)/);
        if (!payload.businessName && businessPathMatch?.[1]) {
          payload.businessName = decodeURIComponent(businessPathMatch[1]);
        }
        localStorage.setItem(APPROVED_TOAST_PENDING_KEY, JSON.stringify(payload));
      }

      router.push(targetLink);
      return;
    }

    // Si el negocio ya fue eliminado, abrir siempre el modal de detalle de eliminación
    const deletedBusinessNotification = findRelatedDeletedBusinessNotification(notif, notificationsRef.current);
    if (deletedBusinessNotification) {
      setSelectedDeletedNotification(deletedBusinessNotification);
      setIsDeletedBusinessModalOpen(true);
      return;
    }

    const persistedDeletedNotification = getPersistedDeletedBusinessNotification(notif, userId);
    if (persistedDeletedNotification) {
      setSelectedDeletedNotification(persistedDeletedNotification);
      setIsDeletedBusinessModalOpen(true);
      return;
    }

    // Si es una notificación de negocio y viene como eliminado, cualquier notificación relacionada debe quedar capturada arriba.
    const notificationBusinessKey = getNotificationBusinessKey(notif);
    const hasDeletedSibling = notificationBusinessKey
      ? notificationsRef.current.some((candidate) => candidate.tipo === "negocio_eliminado" && getNotificationBusinessKey(candidate) === notificationBusinessKey)
      : false;

    if (hasDeletedSibling) {
      const sibling = notificationsRef.current.find((candidate) => candidate.tipo === "negocio_eliminado" && getNotificationBusinessKey(candidate) === notificationBusinessKey) || null;
      if (sibling) {
        setSelectedDeletedNotification(sibling);
        setIsDeletedBusinessModalOpen(true);
        return;
      }
    }

    // Cerrar panel para el resto de notificaciones (incluye negocio_archivado)
    setIsOpen(false);

    const user = localStorage.getItem('pitzbol_user') ? JSON.parse(localStorage.getItem('pitzbol_user') || '{}') : null;
    let targetLink = resolveNotifLink(notif, user?.role);

    if (notif.tipo === "negocio_aprobado") {
      const shouldResolveById = !targetLink || targetLink.startsWith("/negocio/mis-solicitudes/");
      if (shouldResolveById) {
        const publicLink = await resolvePublicBusinessLinkById(notif);
        if (publicLink) {
          targetLink = publicLink;
        }
      }
    }

    if (targetLink) {
      if (notif.tipo === "negocio_aprobado") {
        const payload: ApprovedToastPendingPayload = {
          businessId: extractBusinessIdFromNotification(notif),
          businessName: extractBusinessNameFromNotification(notif),
        };

        const businessPathMatch = targetLink.match(/^\/informacion\/([^?/#]+)/);
        if (!payload.businessName && businessPathMatch?.[1]) {
          payload.businessName = decodeURIComponent(businessPathMatch[1]);
        }

        localStorage.setItem(APPROVED_TOAST_PENDING_KEY, JSON.stringify(payload));
      }
      router.push(targetLink);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Botón de Notificaciones */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 relative hover:bg-white/50 rounded-full transition-all"
        title="Notificaciones"
      >
        <FiBell size={22} />
        
        {/* Badge de notificaciones sin leer */}
        <AnimatePresence>
          {noLeidas > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-[#F00808] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel de Notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-[120%] right-0 w-96 max-h-[600px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col z-[120] overflow-hidden"
          >
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-[#0D601E] to-[#1A4D2E] text-white px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Notificaciones</h3>
                <p className="text-white/70 text-xs font-light mt-0.5">
                  {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {cargando && notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-[#0D601E]/20 border-t-[#0D601E] rounded-full mb-4"
                  />
                  <p className="text-gray-500 font-medium text-sm">Cargando notificaciones...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiBell size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Sin notificaciones</p>
                  <p className="text-gray-400 text-xs mt-1">Te notificaremos cuando haya actualizaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificaciones.map((notif, index) => (
                    <motion.div
                      key={`${notif.id || 'notif'}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ y: -2, scale: 1.01, boxShadow: "0 12px 28px rgba(13, 96, 30, 0.12)" }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative p-4 border-l-4 ${getColorNotificacion(notif.tipo)} cursor-pointer transition-all duration-300 ${
                        !notif.leido ? 'border-l-[#F00808] bg-opacity-60' : 'border-l-gray-200'
                      }`}
                      onClick={() => {
                        void handleNotificationClick(notif);
                      }}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0D601E]/0 via-[#0D601E]/[0.06] to-[#0D601E]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 transition-transform duration-300 group-hover:-translate-y-0.5">
                          {getIconoNotificacion(notif.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-800">
                              {notif.titulo}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatearFecha(notif.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notif.mensaje}
                          </p>
                          {/* Botón para revisar solicitud de guía pendiente */}
                          {notif.tipo === 'solicitud_guia_pendiente' && notif.enlace && (
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarComoLeida(notif.id);
                                  if (typeof notif.enlace === 'string') {
                                    router.push(notif.enlace);
                                  }
                                }}
                                className="text-xs px-3 py-1 bg-[#0D601E] hover:bg-[#1A4D2E] rounded text-white font-bold transition-colors"
                              >
                                Revisar solicitud
                              </button>
                            </div>
                          )}
                          {!notif.leido && notif.tipo !== 'solicitud_guia_pendiente' && (
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarComoLeida(notif.id);
                                }}
                                className="text-xs px-2 py-1 bg-white/50 hover:bg-white rounded text-gray-600 font-medium transition-colors"
                              >
                                Marcar leída
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notif.id);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>


          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de negocio eliminado */}
      <DeletedBusinessModal
        isOpen={isDeletedBusinessModalOpen}
        onClose={() => {
          setIsDeletedBusinessModalOpen(false);
          setIsOpen(false);
        }}
        notification={selectedDeletedNotification}
        businessName={getDeletedBusinessDisplayName(selectedDeletedNotification)}
      />
    </div>
  );
}

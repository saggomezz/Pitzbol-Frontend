"use client";

import { useEffect, useMemo, useRef, useState, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaFilter,
  FaHistory,
  FaSearch,
  FaTimesCircle,
  FaTrashAlt,
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { MdArchive, MdOutlineTrackChanges } from "react-icons/md";

type SourceBucket = "pendientes" | "activos" | "archivados" | "rechazados";

interface BusinessRecord {
  id: string;
  status?: string;
  history?: Array<Record<string, unknown>>;
  archivedReason?: string;
  rejectionReason?: string;
  rejectedAt?: unknown;
  approvedAt?: unknown;
  archivedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  owner?: string;
  ownerName?: string;
  email?: string;
  business?: {
    name?: string;
    description?: string;
    category?: string;
    createdAt?: unknown;
  };
  name?: string;
  description?: string;
  category?: string;
}

interface AdminMovementLog {
  id: string;
  negocioId?: string;
  accion?: string;
  adminUid?: string;
  nombreNegocio?: string;
  ownerUid?: string | null;
  ownerEmail?: string | null;
  source?: string | null;
  reason?: string | null;
  mensaje?: string | null;
  fecha?: unknown;
}

type MovementKind = "creado" | "aprobado" | "rechazado" | "archivado" | "eliminado" | "desarchivado" | "regresado" | "editado" | "otro";

interface TimelineEvent {
  id: string;
  movementLogId?: string;
  canDelete?: boolean;
  businessId: string;
  businessName: string;
  businessDescription: string;
  category: string;
  action: MovementKind;
  actionLabel: string;
  actionDetail: string;
  rawAction?: string;
  dateISO: string;
  actor: string;
  reason?: string;
  source: SourceBucket;
  statusSnapshot: string;
  ownerName: string;
  ownerContact: string;
}

const buildEventFingerprint = (event: TimelineEvent): string => {
  // Normalize to second precision to collapse equivalent events coming from different buckets.
  const dateBucket = event.dateISO.slice(0, 19);
  const reason = (event.reason || "").trim().toLowerCase();
  const rawAction = (event.rawAction || "").trim().toLowerCase();
  return [event.businessId, event.action, dateBucket, rawAction, reason].join("|");
};

const normalizeComparableText = (value?: string): string => (value || "").trim().toLowerCase();

const getEventDisplayScore = (event: TimelineEvent): number => {
  let score = 0;
  if (normalizeComparableText(event.category) !== "sin categoria") score += 2;
  if (normalizeComparableText(event.statusSnapshot) !== "sin_estado") score += 2;
  if (normalizeComparableText(event.ownerContact) !== "sin correo") score += 1;
  if (normalizeComparableText(event.ownerName) !== "sin propietario") score += 1;
  if (!normalizeComparableText(event.businessDescription).includes("bitacora")) score += 1;
  if (event.source !== "archivados") score += 1;
  return score;
};

const shouldMergeNearDuplicate = (a: TimelineEvent, b: TimelineEvent): boolean => {
  if (a.businessId !== b.businessId) return false;
  if (a.action !== b.action) return false;

  const timeDiffMs = Math.abs(new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  if (Number.isNaN(timeDiffMs) || timeDiffMs > 5000) return false;

  const aReason = normalizeComparableText(a.reason);
  const bReason = normalizeComparableText(b.reason);
  if (aReason && bReason && aReason !== bReason) return false;

  const aRaw = normalizeComparableText(a.rawAction);
  const bRaw = normalizeComparableText(b.rawAction);
  if (aRaw && bRaw && aRaw !== bRaw) return false;

  return true;
};

const mergeTimelineEventData = (primary: TimelineEvent, secondary: TimelineEvent): TimelineEvent => {
  const mergedCanDelete = Boolean(primary.canDelete || secondary.canDelete);
  const mergedMovementLogId = primary.movementLogId || secondary.movementLogId;
  return {
    ...primary,
    canDelete: mergedCanDelete,
    movementLogId: mergedMovementLogId,
  };
};

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");

const actionLabelMap: Record<MovementKind, string> = {
  creado: "Solicitud creada",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  archivado: "Archivado",
  eliminado: "Eliminado",
  desarchivado: "Desarchivado",
  regresado: "Regresado a pendientes",
  editado: "Editado por admin",
  otro: "Movimiento",
};

const normalizeActionValue = (rawAction: unknown): string => {
  if (typeof rawAction !== "string") return "";
  return rawAction.toLowerCase().trim().replace(/\s+/g, "_");
};

const parseDate = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "object") {
    const dateObj = value as { seconds?: number; _seconds?: number; toDate?: () => Date };
    if (typeof dateObj.toDate === "function") {
      const parsed = dateObj.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    if (typeof dateObj.seconds === "number") return new Date(dateObj.seconds * 1000).toISOString();
    if (typeof dateObj._seconds === "number") return new Date(dateObj._seconds * 1000).toISOString();
  }
  return null;
};

const normalizeMovementKind = (rawAction: unknown): MovementKind => {
  const value = normalizeActionValue(rawAction);
  if (!value) return "otro";

  if (value.includes("desarchiv")) return "desarchivado";
  if (value.includes("regres") && value.includes("pendient")) return "regresado";
  if (value.includes("elimin") && (value.includes("permanent") || value.includes("definit"))) return "eliminado";
  if (value === "eliminado") return "eliminado";
  if (value.includes("aproba")) return "aprobado";
  if (value.includes("rechaz")) return "rechazado";
  if (value.includes("archiv")) return "archivado";
  if (value.includes("elimin")) return "eliminado";
  if (value.includes("edit")) return "editado";
  if (value.includes("cread") || value.includes("solicitud")) return "creado";
  return "otro";
};

const getActionLabel = (rawAction: unknown, action: MovementKind): string => {
  const normalized = normalizeActionValue(rawAction);
  if (normalized.includes("desarchiv")) return "Desarchivado";
  if (normalized.includes("regres") && normalized.includes("pendient")) return "Regresado a pendientes";
  if (normalized.includes("elimin") && (normalized.includes("permanent") || normalized.includes("definit"))) return "Eliminado permanentemente";
  if (normalized === "editado_admin") return "Editado por admin";
  return actionLabelMap[action] || "Movimiento";
};

const getActionDetail = (rawAction: unknown, action: MovementKind, reason?: string): string => {
  const normalized = normalizeActionValue(rawAction);
  const reasonText = reason && reason.trim() ? ` Motivo: ${reason.trim()}.` : "";

  if (normalized.includes("desarchiv") || action === "desarchivado") {
    return "El admin desarchivo la solicitud y la envio nuevamente a revision.";
  }
  if ((normalized.includes("regres") && normalized.includes("pendient")) || action === "regresado") {
    return "El admin regreso el negocio a pendientes para una nueva revision.";
  }
  if (normalized.includes("aproba") || action === "aprobado") {
    return "El admin aprobo la solicitud y el negocio paso a activos.";
  }
  if (normalized.includes("rechaz") || action === "rechazado") {
    return `El admin rechazo la solicitud.${reasonText}`.trim();
  }
  if (normalized.includes("archiv") || action === "archivado") {
    return `El admin archivo la solicitud.${reasonText}`.trim();
  }
  if (normalized.includes("elimin") || action === "eliminado") {
    return "El admin elimino permanentemente el negocio de la base de datos.";
  }
  if (normalized.includes("edit") || action === "editado") {
    return "El admin modifico manualmente la informacion del negocio.";
  }
  if (normalized.includes("cread") || action === "creado") {
    return "Se registro la solicitud inicial del negocio.";
  }
  return "Movimiento administrativo registrado en el historial.";
};

const getActionVisual = (action: MovementKind) => {
  if (action === "aprobado") return { icon: <FaCheckCircle />, style: { backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" } };
  if (action === "rechazado") return { icon: <FaTimesCircle />, style: { backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" } };
  if (action === "archivado") return { icon: <MdArchive />, style: { backgroundColor: "#0F172A", color: "#FFFFFF", border: "1px solid #0F172A" } };
  if (action === "eliminado") return { icon: <FaTrashAlt />, style: { backgroundColor: "#18181B", color: "#FFFFFF", border: "1px solid #18181B" } };
  if (action === "desarchivado") return { icon: <FaHistory />, style: { backgroundColor: "#E0F2FE", color: "#0C4A6E", border: "1px solid #7DD3FC" } };
  if (action === "regresado") return { icon: <FaHistory />, style: { backgroundColor: "#EDE9FE", color: "#5B21B6", border: "1px solid #C4B5FD" } };
  if (action === "editado") return { icon: <MdOutlineTrackChanges />, style: { backgroundColor: "#FEF3C7", color: "#78350F", border: "1px solid #FCD34D" } };
  if (action === "creado") return { icon: <FaClock />, style: { backgroundColor: "#FEF9C3", color: "#713F12", border: "1px solid #FDE047" } };
  return { icon: <FaCalendarAlt />, style: { backgroundColor: "#F5F5F4", color: "#292524", border: "1px solid #D6D3D1" } };
};

const getBusinessSummary = (record: BusinessRecord) => {
  const businessName = record.business?.name || record.name || "Negocio sin nombre";
  const businessDescription = record.business?.description || record.description || "Sin descripcion";
  const category = record.business?.category || record.category || "Sin categoria";
  const ownerName = record.ownerName || record.owner || "Sin propietario";
  const ownerContact = record.email || "Sin correo";
  const statusSnapshot = record.status || "sin_estado";

  return { businessName, businessDescription, category, ownerName, ownerContact, statusSnapshot };
};

const mapSourceBucket = (rawSource: unknown): SourceBucket => {
  const value = typeof rawSource === "string" ? rawSource.toLowerCase() : "";
  if (value.includes("pendient")) return "pendientes";
  if (value.includes("activ")) return "activos";
  if (value.includes("rechaz")) return "rechazados";
  return "archivados";
};

const buildTimelineFromAdminLog = (log: AdminMovementLog): TimelineEvent | null => {
  const businessId = typeof log.negocioId === "string" && log.negocioId.trim() ? log.negocioId : "desconocido";
  const rawAction = log.accion || "otro";
  const action = normalizeMovementKind(rawAction);
  const dateISO = parseDate(log.fecha) || new Date().toISOString();
  const reason = typeof log.reason === "string" ? log.reason : undefined;

  return {
    id: `movlog-${log.id || `${businessId}-${dateISO}`}`,
    movementLogId: typeof log.id === "string" ? log.id : undefined,
    canDelete: true,
    businessId,
    businessName: log.nombreNegocio || "Negocio eliminado",
    businessDescription: log.mensaje || "Movimiento administrativo persistido en bitacora.",
    category: "Sin categoria",
    action,
    actionLabel: getActionLabel(rawAction, action),
    actionDetail: getActionDetail(rawAction, action, reason),
    rawAction: typeof rawAction === "string" ? rawAction : undefined,
    dateISO,
    actor: log.adminUid || "admin",
    reason,
    source: mapSourceBucket(log.source),
    statusSnapshot: action === "eliminado" ? "eliminado_permanente" : "sin_estado",
    ownerName: typeof log.ownerUid === "string" ? log.ownerUid : "Sin propietario",
    ownerContact: typeof log.ownerEmail === "string" ? log.ownerEmail : "Sin correo",
  };
};

const buildTimelineFromRecord = (record: BusinessRecord, source: SourceBucket): TimelineEvent[] => {
  const base = getBusinessSummary(record);
  const events: TimelineEvent[] = [];
  const historyItems = Array.isArray(record.history) ? record.history : [];
  const localHistorySeen = new Set<string>();

  historyItems.forEach((raw, index) => {
    const rawAction = raw.action;
    const action = normalizeMovementKind(rawAction);
    const dateISO =
      parseDate(raw.date) ||
      parseDate(raw.approvedAt) ||
      parseDate(raw.rejectedAt) ||
      parseDate(raw.archivedAt) ||
      parseDate(record.updatedAt) ||
      parseDate(record.createdAt) ||
      parseDate(record.business?.createdAt) ||
      new Date().toISOString();

    const actor = typeof raw.by === "string" && raw.by.trim() ? raw.by : "Sistema";
    const reason = typeof raw.reason === "string" ? raw.reason : undefined;
    const actionLabel = getActionLabel(rawAction, action);
    const actionDetail = getActionDetail(rawAction, action, reason);

    const localFingerprint = [record.id, action, dateISO.slice(0, 19), actionLabel, (reason || "").trim().toLowerCase()].join("|");
    if (localHistorySeen.has(localFingerprint)) {
      return;
    }
    localHistorySeen.add(localFingerprint);

    events.push({
      id: `${record.id}-${action}-${dateISO}-${index}`,
      canDelete: false,
      businessId: record.id,
      businessName: base.businessName,
      businessDescription: base.businessDescription,
      category: base.category,
      action,
      actionLabel,
      actionDetail,
      rawAction: typeof rawAction === "string" ? rawAction : undefined,
      dateISO,
      actor,
      reason,
      source,
      statusSnapshot: base.statusSnapshot,
      ownerName: base.ownerName,
      ownerContact: base.ownerContact,
    });
  });

  const existingActions = new Set(events.map((event) => event.action));

  const created = parseDate(record.createdAt) || parseDate(record.business?.createdAt);
  if (created && !existingActions.has("creado")) {
    events.push({
      id: `${record.id}-creado-${created}`,
      canDelete: false,
      businessId: record.id,
      businessName: base.businessName,
      businessDescription: base.businessDescription,
      category: base.category,
      action: "creado",
      actionLabel: actionLabelMap.creado,
      actionDetail: getActionDetail("creado", "creado"),
      dateISO: created,
      actor: "Sistema",
      source,
      statusSnapshot: base.statusSnapshot,
      ownerName: base.ownerName,
      ownerContact: base.ownerContact,
    });
  }

  const approved = parseDate(record.approvedAt);
  if (approved && !existingActions.has("aprobado")) {
    events.push({
      id: `${record.id}-aprobado-${approved}`,
      canDelete: false,
      businessId: record.id,
      businessName: base.businessName,
      businessDescription: base.businessDescription,
      category: base.category,
      action: "aprobado",
      actionLabel: actionLabelMap.aprobado,
      actionDetail: getActionDetail("aprobado", "aprobado"),
      dateISO: approved,
      actor: "Sistema",
      source,
      statusSnapshot: base.statusSnapshot,
      ownerName: base.ownerName,
      ownerContact: base.ownerContact,
    });
  }

  const rejected = parseDate(record.rejectedAt);
  if (rejected && !existingActions.has("rechazado")) {
    events.push({
      id: `${record.id}-rechazado-${rejected}`,
      canDelete: false,
      businessId: record.id,
      businessName: base.businessName,
      businessDescription: base.businessDescription,
      category: base.category,
      action: "rechazado",
      actionLabel: actionLabelMap.rechazado,
      actionDetail: getActionDetail("rechazado", "rechazado", record.rejectionReason),
      dateISO: rejected,
      actor: "Sistema",
      reason: record.rejectionReason,
      source,
      statusSnapshot: base.statusSnapshot,
      ownerName: base.ownerName,
      ownerContact: base.ownerContact,
    });
  }

  const archived = parseDate(record.archivedAt);
  if (archived && !existingActions.has("archivado")) {
    events.push({
      id: `${record.id}-archivado-${archived}`,
      canDelete: false,
      businessId: record.id,
      businessName: base.businessName,
      businessDescription: base.businessDescription,
      category: base.category,
      action: "archivado",
      actionLabel: actionLabelMap.archivado,
      actionDetail: getActionDetail("archivado", "archivado", record.archivedReason),
      dateISO: archived,
      actor: "Sistema",
      reason: record.archivedReason,
      source,
      statusSnapshot: base.statusSnapshot,
      ownerName: base.ownerName,
      ownerContact: base.ownerContact,
    });
  }

  return events;
};

export default function AdminBusinessHistoryPage() {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"todos" | MovementKind>("todos");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchAllMovements = async () => {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("pitzbol_token") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const requestJson = async (path: string): Promise<any | null> => {
        const candidates = [`${API_BASE}${path}`, path].filter((value, index, arr) => arr.indexOf(value) === index);

        for (const url of candidates) {
          try {
            const res = await fetch(url, {
              credentials: "include",
              headers,
            });
            if (!res.ok) continue;
            return await res.json();
          } catch {
            // Try next candidate URL.
          }
        }

        return null;
      };

      const loadBucket = async (endpoint: string): Promise<BusinessRecord[]> => {
        const data = await requestJson(endpoint);
        return Array.isArray(data.negocios) ? data.negocios : [];
      };

      const loadMovementLogs = async (): Promise<AdminMovementLog[]> => {
        const data = await requestJson("/api/admin/negocios/movimientos");
        return Array.isArray(data.movimientos) ? data.movimientos : [];
      };

      try {
        const [pendientes, activos, archivados, rechazados, movementLogs] = await Promise.all([
          loadBucket("/api/admin/negocios/pendientes"),
          loadBucket("/api/admin/negocios"),
          loadBucket("/api/admin/negocios/archivados"),
          loadBucket("/api/admin/negocios/rechazados"),
          loadMovementLogs(),
        ]);

        const adminLogEvents = movementLogs
          .map((log) => buildTimelineFromAdminLog(log))
          .filter((event): event is TimelineEvent => Boolean(event));

        const timelineRaw = [
          ...pendientes.flatMap((record) => buildTimelineFromRecord(record, "pendientes")),
          ...activos.flatMap((record) => buildTimelineFromRecord(record, "activos")),
          ...archivados.flatMap((record) => buildTimelineFromRecord(record, "archivados")),
          ...rechazados.flatMap((record) => buildTimelineFromRecord(record, "rechazados")),
          ...adminLogEvents,
        ];

        // 1) Merge near-duplicates (same business/action within a few seconds) and
        // keep the richer card data while preserving the movementLogId for deletion.
        const sortedRaw = [...timelineRaw].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
        const mergedEvents: TimelineEvent[] = [];

        sortedRaw.forEach((event) => {
          const existingIndex = mergedEvents.findIndex((existing) => shouldMergeNearDuplicate(existing, event));
          if (existingIndex === -1) {
            mergedEvents.push(event);
            return;
          }

          const existing = mergedEvents[existingIndex];
          const existingScore = getEventDisplayScore(existing);
          const incomingScore = getEventDisplayScore(event);

          if (incomingScore > existingScore) {
            mergedEvents[existingIndex] = mergeTimelineEventData(event, existing);
            return;
          }

          mergedEvents[existingIndex] = mergeTimelineEventData(existing, event);
        });

        // 2) Exact dedup pass for any remaining identical fingerprints.
        const seen = new Set<string>();
        const deduped = mergedEvents.filter((event) => {
          const key = buildEventFingerprint(event);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        deduped.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

        // Final safety pass: guarantee unique IDs for React keys.
        const idSeen = new Map<string, number>();
        const timeline = deduped.map((event) => {
          const count = idSeen.get(event.id) || 0;
          idSeen.set(event.id, count + 1);
          if (count === 0) return event;
          return { ...event, id: `${event.id}__dup${count}` };
        });

        setEvents(timeline);
      } catch {
        setEvents([]);
        setError("No se pudo cargar el historial de movimientos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovements();
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedEvent) {
        setSelectedEvent(null);
        return;
      }
      if (isFilterOpen) {
        setIsFilterOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedEvent, isFilterOpen]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const searchTerm = query.trim().toLowerCase();
      const matchesQuery =
        !searchTerm ||
        event.businessName.toLowerCase().includes(searchTerm) ||
        event.businessId.toLowerCase().includes(searchTerm) ||
        event.ownerName.toLowerCase().includes(searchTerm) ||
        event.category.toLowerCase().includes(searchTerm);

      const matchesAction = actionFilter === "todos" || event.action === actionFilter;
      return matchesQuery && matchesAction;
    });
  }, [events, query, actionFilter]);

  const totalsByAction = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const filterOptions: Array<{ value: "todos" | MovementKind; label: string }> = [
    { value: "todos", label: "Todos los movimientos" },
    { value: "creado", label: `Solicitud creada (${totalsByAction.creado || 0})` },
    { value: "aprobado", label: `Aprobados (${totalsByAction.aprobado || 0})` },
    { value: "rechazado", label: `Rechazados (${totalsByAction.rechazado || 0})` },
    { value: "archivado", label: `Archivados (${totalsByAction.archivado || 0})` },
    { value: "eliminado", label: `Eliminados (${totalsByAction.eliminado || 0})` },
    { value: "desarchivado", label: `Desarchivados (${totalsByAction.desarchivado || 0})` },
    { value: "regresado", label: `Regresados a pendientes (${totalsByAction.regresado || 0})` },
    { value: "editado", label: `Editados (${totalsByAction.editado || 0})` },
  ];

  const activeFilterLabel = filterOptions.find((option) => option.value === actionFilter)?.label || "Todos los movimientos";

  const handleDeleteMovement = async (event: TimelineEvent, clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation();
    if (!event.canDelete) return;

    const movementId = (event.movementLogId || event.id || "").trim();
    if (!movementId) return;

    const confirmed = typeof window !== "undefined" ? window.confirm("Eliminar este movimiento del historial permanentemente?") : false;
    if (!confirmed) return;

    try {
      setDeletingEventId(event.id);
      const token = typeof window !== "undefined" ? localStorage.getItem("pitzbol_token") || "" : "";
      const response = await fetch(`${API_BASE}/api/admin/negocios/movimientos/${encodeURIComponent(movementId)}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`No se pudo eliminar el movimiento (${response.status})`);
      }

      setEvents((prev) => prev.filter((item) => item.id !== event.id));
      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      if (typeof window !== "undefined") {
        window.alert("No se pudo eliminar el movimiento. Intenta de nuevo.");
      }
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F0E6] via-[#FEFAF5] to-[#E8F5E9] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="relative flex items-start">
            <button
              onClick={() => router.push("/admin/negocios")}
              className="absolute -left-20 top-1 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#0D601E]/20 bg-white text-[#0D601E] shadow hover:bg-[#F1FAF3]"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-[#1A4D2E] md:text-4xl">Historial de Solicitudes</h1>
              <p className="text-sm text-gray-600">Movimientos de aprobacion, rechazo, archivado, eliminacion y cambios administrativos.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#0D601E]/20 bg-white px-5 py-4 text-right shadow">
            <p className="text-xs uppercase tracking-wide text-gray-500">Movimientos totales</p>
            <p className="text-3xl font-black text-[#0D601E]">{events.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-6 rounded-2xl border border-[#0D601E]/15 bg-white p-4 shadow">
          <div className="flex items-center gap-4">
            <div className="relative min-w-0 flex-1">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3B5D50]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por negocio, propietario, categoria o ID"
                className="w-full rounded-xl border border-[#0D601E]/30 bg-[#FCFCFC] py-3 pl-11 pr-3 text-sm text-[#1F2937] placeholder:text-gray-500 outline-none transition focus:border-[#0D601E]"
              />
            </div>
            <div ref={filterRef} className="relative w-[380px] shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-[#0D601E]/35 bg-white px-3 py-3 text-sm shadow-sm transition hover:bg-[#F5FBF7]"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-[#1A4D2E]">
                  <FaFilter className="text-[#3B5D50]" />
                  {activeFilterLabel}
                </span>
                <span className="text-[#1A4D2E]">{isFilterOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}</span>
              </button>

              {isFilterOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-[#0D601E]/25 bg-white shadow-xl">
                  {filterOptions.map((option) => {
                    const isActive = actionFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setActionFilter(option.value);
                          setIsFilterOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition"
                        style={{
                          backgroundColor: isActive ? "#0D601E" : "#FFFFFF",
                          color: isActive ? "#FFFFFF" : "#1A4D2E",
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="rounded-2xl border border-[#0D601E]/10 bg-white p-10 text-center text-gray-600 shadow">Cargando historial...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700 shadow">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-[#0D601E]/10 bg-white p-10 text-center text-gray-600 shadow">No se encontraron movimientos con los filtros actuales.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEvents.map((event, index) => {
              const visual = getActionVisual(event.action);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  onClick={() => setSelectedEvent(event)}
                  onKeyDown={(keyboardEvent: ReactKeyboardEvent<HTMLDivElement>) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault();
                      setSelectedEvent(event);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group w-full rounded-2xl border border-[#0D601E]/15 bg-white p-5 text-left shadow transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-lg font-bold text-[#1A4D2E]">{event.businessName}</p>
                      <p className="line-clamp-1 text-sm font-medium" style={{ color: "#475569", opacity: 1 }}>ID: {event.businessId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs font-semibold text-[#334155] sm:inline">{new Date(event.dateISO).toLocaleString("es-MX")}</span>
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ ...visual.style, opacity: 1 }}>
                      {visual.icon}
                      {event.actionLabel}
                      </span>
                      {event.canDelete ? (
                        <button
                          onClick={(clickEvent) => handleDeleteMovement(event, clickEvent)}
                          disabled={deletingEventId === event.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] bg-white text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                          title="Eliminar movimiento"
                          aria-label="Eliminar movimiento"
                        >
                          <FiX size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <p className="mb-3 line-clamp-2 text-base font-medium" style={{ color: "#1F2937", opacity: 1 }}>{event.businessDescription}</p>

                  <p className="mb-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm" style={{ color: "#334155", opacity: 1 }}>
                    {event.actionDetail}
                  </p>

                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2" style={{ color: "#1E293B", opacity: 1 }}>
                    <p className="inline-flex items-center gap-2 font-medium" style={{ color: "#1E293B", opacity: 1 }}>
                      <FaBuilding className="text-[#0D601E]" />
                      {event.category}
                    </p>
                    <p className="inline-flex items-center gap-2 font-medium" style={{ color: "#1E293B", opacity: 1 }}>
                      <FaCalendarAlt className="text-[#0D601E]" />
                      {new Date(event.dateISO).toLocaleString("es-MX")}
                    </p>
                    <p className="inline-flex items-center gap-2 font-medium" style={{ color: "#1E293B", opacity: 1 }}>
                      <MdOutlineTrackChanges className="text-[#0D601E]" />
                      Actor: {event.actor}
                    </p>
                    <p className="inline-flex items-center gap-2 font-medium" style={{ color: "#1E293B", opacity: 1 }}>
                      <FaHistory className="text-[#0D601E]" />
                      Estado: {event.statusSnapshot}
                    </p>
                  </div>

                  {event.reason ? <p className="mt-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm font-medium" style={{ color: "#0F172A", opacity: 1 }}>Motivo: {event.reason}</p> : null}
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {selectedEvent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-0 top-20 z-[5000] flex items-center justify-center overflow-y-auto bg-black/45 p-4 md:top-24 md:p-8">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Detalle de movimiento</p>
                    <h2 className="text-2xl font-black text-[#1A4D2E]">{selectedEvent.businessName}</h2>
                  </div>
                  <motion.button
                    onClick={() => setSelectedEvent(null)}
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D0DDD8] text-[#3B5D50] transition hover:bg-[#F1FAF3] hover:text-[#F00808]"
                    aria-label="Cerrar"
                  >
                    <FiX size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>

                <div className="space-y-3 rounded-2xl border border-[#0D601E]/20 bg-[#FBFCFB] p-4 text-sm text-[#1F2937]">
                  <p><b>ID movimiento:</b> {selectedEvent.id}</p>
                  <p><b>ID negocio:</b> {selectedEvent.businessId}</p>
                  <p><b>Accion:</b> {selectedEvent.actionLabel}</p>
                  <p><b>Detalle:</b> {selectedEvent.actionDetail}</p>
                  {selectedEvent.rawAction ? <p><b>Accion tecnica:</b> {selectedEvent.rawAction}</p> : null}
                  <p><b>Fecha:</b> {new Date(selectedEvent.dateISO).toLocaleString("es-MX")}</p>
                  <p><b>Actor:</b> {selectedEvent.actor}</p>
                  <p><b>Fuente:</b> {selectedEvent.source}</p>
                  <p><b>Propietario:</b> {selectedEvent.ownerName}</p>
                  <p><b>Contacto:</b> {selectedEvent.ownerContact}</p>
                  <p><b>Estado snapshot:</b> {selectedEvent.statusSnapshot}</p>
                  {selectedEvent.reason ? <p><b>Motivo:</b> {selectedEvent.reason}</p> : null}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => router.push(`/admin/negocios/${selectedEvent.businessId}`)}
                    className="flex-1 rounded-xl bg-[#0D601E] px-4 py-3 font-bold text-white transition hover:bg-[#1A4D2E]"
                  >
                    Ver negocio
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.navigator.clipboard.writeText(selectedEvent.id);
                      }
                    }}
                    className="flex-1 rounded-xl border border-[#0D601E]/25 bg-white px-4 py-3 font-bold text-[#0D601E] transition hover:bg-[#F3FAF5]"
                  >
                    Copiar ID movimiento
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

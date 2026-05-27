"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX, FiXCircle } from "react-icons/fi";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <FiCheckCircle size={18} />,
  error: <FiXCircle size={18} />,
  warning: <FiAlertCircle size={18} />,
  info: <FiInfo size={18} />,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-green-700 text-white",
  error: "bg-red-700 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-[#1A4D2E] text-white",
};

const DEFAULT_DURATION = 4000;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(
      () => onDismiss(toast.id),
      toast.duration ?? DEFAULT_DURATION
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm max-w-sm w-full pointer-events-auto animate-slide-in ${STYLES[toast.type]}`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <FiX size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
    },
    []
  );

  const ctx: ToastContextType = {
    toast: addToast,
    success: (m, d) => addToast(m, "success", d),
    error: (m, d) => addToast(m, "error", d),
    warning: (m, d) => addToast(m, "warning", d),
    info: (m, d) => addToast(m, "info", d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div
        aria-label="Notificaciones"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/**
 * Imperative singleton — lets non-component code (utils, etc.) fire toasts
 * by calling `showToast(message, type)`. Must be called after the provider mounts.
 */
let _imperativeToast: ToastContextType["toast"] | null = null;
export function _registerImperativeToast(fn: ToastContextType["toast"]) {
  _imperativeToast = fn;
}
export function showToast(
  message: string,
  type: ToastType = "info",
  duration?: number
) {
  _imperativeToast?.(message, type, duration);
}

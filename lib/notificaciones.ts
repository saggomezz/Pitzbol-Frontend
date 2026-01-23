/**
 * Utilidades para manejar notificaciones de Pitzbol
 */

import { agregarHistorialSolicitud } from "@/app/components/HistorialSolicitudesModal";

export interface PitzbolNotification {
  id: string;
  tipo: 'aprobado' | 'rechazado' | 'info' | 'advertencia' | 'nueva_solicitud_negocio';
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  enlace?: string; // Ruta opcional para navegar
}

/**
 * Enviar notificación a un usuario
 */
export const enviarNotificacion = async (
  userId: string,
  tipo: 'aprobado' | 'rechazado' | 'info' | 'advertencia' | 'nueva_solicitud_negocio',
  titulo: string,
  mensaje: string,
  enlace?: string
) => {
  const notificacion: PitzbolNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tipo,
    titulo,
    mensaje,
    fecha: new Date().toISOString(),
    leido: false,
    enlace
  };

  // Lógica para enviar al backend si existe sesión
  const token = localStorage.getItem('pitzbol_token');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  if (token) {
    try {
      await fetch(`${API_BASE}/api/admin/notificaciones/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificacion)
      });
    } catch (e) {
      // fallback local
      guardarNotificacionLocal(userId, notificacion);
    }
  } else {
    guardarNotificacionLocal(userId, notificacion);
  }
  return notificacion;
};

function guardarNotificacionLocal(userId: string, notificacion: PitzbolNotification) {
  const key = `pitzbol_notifications_${userId}`;
  const notificacionesActuales = JSON.parse(localStorage.getItem(key) || '[]');
  const notificacionesActualizadas = [notificacion, ...notificacionesActuales];
  if (notificacionesActualizadas.length > 50) {
    notificacionesActualizadas.pop();
  }
  localStorage.setItem(key, JSON.stringify(notificacionesActualizadas));
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(notificacionesActualizadas),
      url: window.location.href
    })
  );
}

/**
 * Enviar notificación de aprobación como guía
 */
export const notificarAprobacionGuia = (userId: string) => {
  return enviarNotificacion(
    userId,
    'aprobado',
    '¡Felicidades! 🎉',
    'Tu solicitud para ser Guía Oficial Pitzbol ha sido aprobada. Ahora puedes crear experiencias y comenzar a guiar turistas.',
    '/perfil'
  );
};

/**
 * Enviar notificación de rechazo de solicitud de guía
 */
export const notificarRechazoGuia = (userId: string) => {
  return enviarNotificacion(
    userId,
    'rechazado',
    'Solicitud Rechazada',
    'Lamentablemente, tu solicitud para ser Guía Pitzbol no fue aprobada esta vez. Puedes volver a intentar más adelante.',
    '/perfil'
  );
};

/**
 * Enviar notificación cuando se envía solicitud de guía
 */
export const notificarSolicitudEnviada = (userId: string) => {
  return enviarNotificacion(
    userId,
    'info',
    'Solicitud Enviada ✓',
    'Tu solicitud para ser Guía Pitzbol ha sido enviada correctamente. Estamos revisando tu información y te notificaremos pronto.',
    '/perfil'
  );
};

/**
 * Obtener todas las notificaciones de un usuario
 */
export const obtenerNotificaciones = (userId: string): PitzbolNotification[] => {
  const key = `pitzbol_notifications_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

/**
 * Contar notificaciones sin leer
 */
export const contarNoLeidas = (userId: string): number => {
  const notificaciones = obtenerNotificaciones(userId);
  return notificaciones.filter(n => !n.leido).length;
};

/**
 * Marcar una notificación como leída
 */
export const marcarNotificacionComoLeida = (userId: string, notificationId: string) => {
  const key = `pitzbol_notifications_${userId}`;
  const notificaciones = JSON.parse(localStorage.getItem(key) || '[]');
  
  const notificacionesActualizadas = notificaciones.map((notif: PitzbolNotification) =>
    notif.id === notificationId ? { ...notif, leido: true } : notif
  );
  
  localStorage.setItem(key, JSON.stringify(notificacionesActualizadas));
  
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(notificacionesActualizadas),
      url: window.location.href
    })
  );
};

/**
 * Registrar acción en el historial de solicitudes
 */
export const registrarAccionSolicitud = (accion: "aceptada" | "rechazada", nombre: string, mensaje: string) => {
  agregarHistorialSolicitud({
    id: `solicitud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nombre,
    accion,
    fecha: new Date().toISOString(),
    mensaje
  });
};

/**
 * Utilidades para manejar notificaciones de Pitzbol
 */

export interface PitzbolNotification {
  id: string;
  tipo: 'aprobado' | 'rechazado' | 'info' | 'advertencia';
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  enlace?: string; // Ruta opcional para navegar
}

/**
 * Enviar notificación a un usuario
 */
export const enviarNotificacion = (
  userId: string,
  tipo: 'aprobado' | 'rechazado' | 'info' | 'advertencia',
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

  const key = `pitzbol_notifications_${userId}`;
  const notificacionesActuales = JSON.parse(localStorage.getItem(key) || '[]');
  const notificacionesActualizadas = [notificacion, ...notificacionesActuales];

  // Mantener solo las últimas 50 notificaciones
  if (notificacionesActualizadas.length > 50) {
    notificacionesActualizadas.pop();
  }

  localStorage.setItem(key, JSON.stringify(notificacionesActualizadas));

  // Disparar evento de storage para sincronizar entre pestañas
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(notificacionesActualizadas),
      url: window.location.href
    })
  );

  return notificacion;
};

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
 * Limpiar todas las notificaciones de un usuario
 */
export const limpiarNotificaciones = (userId: string) => {
  const key = `pitzbol_notifications_${userId}`;
  localStorage.removeItem(key);
  
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue: null,
      url: window.location.href
    })
  );
};

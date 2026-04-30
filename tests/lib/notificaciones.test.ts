/* eslint-disable */
// Mock historial helper used by `registrarAccionSolicitud`
jest.mock('@/app/components/HistorialSolicitudesModal', () => ({
  agregarHistorialSolicitud: jest.fn()
}));

describe('notificaciones util', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    localStorage.removeItem('pitzbol_token');
    jest.clearAllMocks();
  });

  it('saves notifications locally and retrieves them', async () => {
    const { enviarNotificacion, obtenerNotificaciones } = require('../../lib/notificaciones');
    const n = await enviarNotificacion('user-1', 'info', 'Título prueba', 'Mensaje prueba', '/test');
    const listado = obtenerNotificaciones('user-1');
    expect(listado.length).toBe(1);
    expect(listado[0].id).toBe(n.id);
    expect(listado[0].titulo).toBe('Título prueba');
    expect(listado[0].mensaje).toBe('Mensaje prueba');
    expect(listado[0].enlace).toBe('/test');
    expect(listado[0].leido).toBe(false);
  });

  it('marks notifications as read and counts unread', async () => {
    const { enviarNotificacion, contarNoLeidas, marcarNotificacionComoLeida } = require('../../lib/notificaciones');
    const a = await enviarNotificacion('user-2', 'info', 'A', 'a');
    const b = await enviarNotificacion('user-2', 'info', 'B', 'b');
    expect(contarNoLeidas('user-2')).toBe(2);
    marcarNotificacionComoLeida('user-2', a.id);
    expect(contarNoLeidas('user-2')).toBe(1);
    const { obtenerNotificaciones } = require('../../lib/notificaciones');
    const listado = obtenerNotificaciones('user-2');
    const marc = listado.find((x: any) => x.id === a.id);
    expect(marc).toBeDefined();
    expect(marc!.leido).toBe(true);
  });

  it('keeps last 50 notifications and maintains newest-first order', async () => {
    const { enviarNotificacion, obtenerNotificaciones } = require('../../lib/notificaciones');
    const userId = 'user-3';
    const created: string[] = [];
    for (let i = 0; i < 55; i++) {
      const n = await enviarNotificacion(userId, 'info', `T${i}`, `M${i}`);
      created.push(n.id);
    }
    const stored = obtenerNotificaciones(userId).map((s: any) => s.id);
    expect(stored.length).toBe(50);
    const expected = created.slice(-50).reverse();
    expect(stored).toEqual(expected);
  });

  it('registrarAccionSolicitud forwards to agregarHistorialSolicitud', () => {
    const mock = require('@/app/components/HistorialSolicitudesModal').agregarHistorialSolicitud;
    const { registrarAccionSolicitud } = require('../../lib/notificaciones');
    registrarAccionSolicitud('aceptada', 'Juan', 'Mensaje X');
    expect(mock).toHaveBeenCalledTimes(1);
    const arg = mock.mock.calls[0][0];
    expect(arg.nombre).toBe('Juan');
    expect(arg.accion).toBe('aceptada');
    expect(arg.mensaje).toBe('Mensaje X');
    expect(arg.id).toMatch(/^solicitud_/);
    expect(arg.fecha).toBeDefined();
  });
});

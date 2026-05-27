/* eslint-disable */
/**
 * Unit tests for the booking page 409 / error-handling behaviour.
 *
 * We don't render the full page (it has many heavy deps) — instead we test
 * the core logic functions extracted here so the tests stay fast and reliable.
 */

// ---------------------------------------------------------------------------
// Helpers that mirror the logic inside BookTourPage's handleSubmit
// ---------------------------------------------------------------------------

type BookingResponse = {
  status: number;
  data: {
    success: boolean;
    message?: string;
    code?: string;
    disponibles?: number;
    capacidad?: number;
  };
};

function deriveBookingErrorMessage(response: BookingResponse): string | null {
  const { status, data } = response;
  if (data.success) return null;
  if (status === 409 && data.code === 'TOUR_FULL') {
    const disponibles = data.disponibles ?? 0;
    if (disponibles === 0) {
      return 'Este tour está completo para la fecha seleccionada. Por favor elige otra fecha.';
    }
    return `Capacidad insuficiente. Solo quedan ${disponibles} plaza${disponibles !== 1 ? 's' : ''} disponible${disponibles !== 1 ? 's' : ''}. Reduce el número de personas.`;
  }
  if (status === 409) {
    return 'El guía ya tiene una reserva en esa fecha y hora. Por favor elige otra fecha u horario.';
  }
  return data.message || 'Error al crear la reserva. Inténtalo de nuevo.';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveBookingErrorMessage (booking page 409 logic)', () => {
  it('returns null on success', () => {
    expect(
      deriveBookingErrorMessage({ status: 200, data: { success: true } })
    ).toBeNull();
  });

  it('returns TOUR_FULL message when 0 spots remain', () => {
    const msg = deriveBookingErrorMessage({
      status: 409,
      data: { success: false, code: 'TOUR_FULL', disponibles: 0, capacidad: 10 },
    });
    expect(msg).toMatch(/completo para la fecha/i);
  });

  it('returns singular spot message when exactly 1 spot remains', () => {
    const msg = deriveBookingErrorMessage({
      status: 409,
      data: { success: false, code: 'TOUR_FULL', disponibles: 1, capacidad: 10 },
    });
    expect(msg).toContain('1 plaza disponible');
    expect(msg).not.toContain('plazas');
  });

  it('returns plural spots message when multiple spots remain', () => {
    const msg = deriveBookingErrorMessage({
      status: 409,
      data: { success: false, code: 'TOUR_FULL', disponibles: 3, capacidad: 10 },
    });
    expect(msg).toContain('3 plazas disponibles');
  });

  it('returns guide-unavailable message for 409 without TOUR_FULL code', () => {
    const msg = deriveBookingErrorMessage({
      status: 409,
      data: { success: false, message: 'El guía no está disponible en esa fecha y hora' },
    });
    expect(msg).toMatch(/guía ya tiene una reserva/i);
  });

  it('returns backend message for non-409 errors', () => {
    const msg = deriveBookingErrorMessage({
      status: 400,
      data: { success: false, message: 'Faltan datos requeridos' },
    });
    expect(msg).toBe('Faltan datos requeridos');
  });

  it('returns generic fallback when no message and non-409 status', () => {
    const msg = deriveBookingErrorMessage({
      status: 500,
      data: { success: false },
    });
    expect(msg).toMatch(/inténtalo de nuevo/i);
  });
});

// ---------------------------------------------------------------------------
// Tests for date validation logic
// ---------------------------------------------------------------------------

function isBookingDateValid(fechaStr: string): boolean {
  const bookingDate = new Date(fechaStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(bookingDate.getTime()) && bookingDate >= today;
}

describe('isBookingDateValid (booking page date guard)', () => {
  it('rejects empty string', () => {
    expect(isBookingDateValid('')).toBe(false);
  });

  it('rejects a date from the past', () => {
    expect(isBookingDateValid('2020-01-01')).toBe(false);
  });

  it('accepts today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isBookingDateValid(today)).toBe(true);
  });

  it('accepts a future date', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    expect(isBookingDateValid(future)).toBe(true);
  });
});

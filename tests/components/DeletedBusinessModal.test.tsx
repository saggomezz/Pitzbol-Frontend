import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Reuse the framer-motion sanitizer used across tests to avoid prop leakage to DOM
jest.mock('framer-motion', () => {
  const React = require('react');
  const sanitize = (props: any) => {
    const { whileHover, whileTap, whileTapPropagation, whileHoverPropagation, ...rest } = props || {};
    return rest;
  };
  const motion: any = {
    div: (props: any) => React.createElement('div', sanitize(props), props?.children),
    button: (props: any) => React.createElement('button', sanitize(props), props?.children),
  };
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  };
});

import DeletedBusinessModal from '@/app/components/DeletedBusinessModal';

describe('DeletedBusinessModal', () => {
  test('returns null when notification is null', () => {
    const { container } = render(<DeletedBusinessModal isOpen={true} onClose={() => {}} notification={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders title, extracted business name and formatted date, and calls onClose', () => {
    const onClose = jest.fn();
    const notif = {
      titulo: 'Notificación de eliminación',
      mensaje: 'El negocio "La Taquería" fue eliminado por el administrador. Se detectó fraude.',
      fecha: '2026-04-01T12:00:00.000Z',
    };

    render(<DeletedBusinessModal isOpen={true} onClose={onClose} notification={notif} />);

    // Title
    expect(screen.getByText(/Notificación de eliminación/i)).toBeInTheDocument();

    // Extracted business name from message
    expect(screen.getByText(/La Taquería/)).toBeInTheDocument();

    // Reason should be displayed (parsed from message)
    expect(screen.getByText(/Motivo:/i)).toBeInTheDocument();

    // Close via icon button (aria-label="Cerrar")
    const closeBtn = screen.getByLabelText('Cerrar');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  test('prefers explicit businessName prop over parsed fallback', () => {
    const onClose = jest.fn();
    const notif = {
      titulo: 'Eliminado',
      mensaje: 'El negocio "Nombre viejo" fue eliminado por el administrador.',
      fecha: '2026-04-01T12:00:00.000Z',
    };

    render(<DeletedBusinessModal isOpen={true} onClose={onClose} notification={notif} businessName={'Nombre Nuevo'} />);

    expect(screen.getByText('Nombre Nuevo')).toBeInTheDocument();
  });
});

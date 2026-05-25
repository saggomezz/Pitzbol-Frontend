/* eslint-disable */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock framer-motion to simple wrappers for commonly used motion elements
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

// Mock next/router/navigation used by the component
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Mock fetchWithAuth to return an empty notification set
jest.mock('@/lib/fetchWithAuth', () => ({
  ensureValidAuthToken: jest.fn(async () => 'token'),
  fetchWithAuth: jest.fn(async () => ({ ok: true, json: async () => ({ success: true, totalUnread: 0, chats: [] }) })),
}));

// Mock notifications util
jest.mock('@/lib/notificaciones', () => ({
  obtenerNotificaciones: jest.fn(() => []),
  contarNoLeidas: jest.fn(() => 0),
  marcarNotificacionComoLeida: jest.fn(),
}));

import NotificationsPanel from '@/app/components/NotificationsPanel';
import { fireEvent } from '@testing-library/react';

describe('NotificationsPanel component', () => {
  test('renders empty state when there are no notifications', async () => {
    render(React.createElement(NotificationsPanel, { userId: 'testuser' }));

    // Open the panel by clicking the bell button
    const btn = screen.getByTitle('Notificaciones');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Sin notificaciones/i)).toBeInTheDocument();
    });
  });
});

/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next-intl used by the component
jest.mock('next-intl', () => ({
  useTranslations: () => (k: string) => k,
  NextIntlClientProvider: ({ children }: any) => children,
}));

// Mock framer-motion to simple wrappers
jest.mock('framer-motion', () => {
  const React = require('react');
  const motion: any = {
    div: (props: any) => React.createElement('div', props, props?.children),
    button: (props: any) => React.createElement('button', props, props?.children),
  };
  return { motion, AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, {}, children) };
});

// Mock next/image to avoid transform issues
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => React.createElement('img', props) }));

describe('AuthModal component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    ;(window as any).alert = jest.fn();
  });

  it('registers a new turista, stores token/user and redirects', async () => {
    const onClose = jest.fn();

    // Mock fetch responses for register and login
    // @ts-ignore
    global.fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/register')) {
        const payload = { msg: 'registered' };
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => payload, text: async () => JSON.stringify(payload) };
      }
      if (url.includes('/api/auth/login')) {
        const payload = { token: 'abc', user: { email: 'u@u.com', uid: 'u1', nombre: 'Test', apellido: 'User', telefono: '123', nacionalidad: 'México', role: 'turista' } };
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => payload, text: async () => JSON.stringify(payload) };
      }
      return { ok: false, status: 404, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '{}' };
    });

    // render
    const AuthModal = require('../../app/components/AuthModal').default;

    render(React.createElement(AuthModal, { isOpen: true, onClose, intendedRole: 'turista' }));

    // Fill registration fields (use exact placeholder matches)
    fireEvent.change(screen.getByPlaceholderText(/^name$/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/^lastName$/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'México' } });
    fireEvent.change(screen.getByPlaceholderText(/^phone$/i), { target: { value: '+52 1234567890' } });
    const regEmails = screen.getAllByPlaceholderText(/^email$/i);
    const regPasswords = screen.getAllByPlaceholderText(/^password$/i);
    fireEvent.change(regEmails[1], { target: { value: 'u@u.com' } });
    fireEvent.change(regPasswords[1], { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/^confirmPassword$/i), { target: { value: 'password123' } });

    // Find the submit button (register) which has type="submit"
    const registerBtns = screen.getAllByRole('button', { name: /register/i });
    const submitRegister = registerBtns.find((b: any) => b.getAttribute('type') === 'submit') || registerBtns[0];
    fireEvent.click(submitRegister);

    await waitFor(() => {
      expect(localStorage.getItem('pitzbol_token')).toBe('abc');
      const userRaw = localStorage.getItem('pitzbol_user');
      expect(userRaw).toBeTruthy();
      const user = JSON.parse(userRaw || '{}');
      expect(user.email).toBe('u@u.com');
      expect(sessionStorage.getItem('justRegistered')).toBe('true');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('registers a guia and calls window.onAuthSuccessShowGuide', async () => {
    const onClose = jest.fn();
    ;(window as any).onAuthSuccessShowGuide = jest.fn();

    // @ts-ignore
    global.fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/register')) {
        const payload = {};
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => payload, text: async () => JSON.stringify(payload) };
      }
      if (url.includes('/api/auth/login')) {
        const payload = { token: 'tok', user: { email: 'g@g.com', uid: 'g1', nombre: 'G', apellido: 'U', role: 'guia' } };
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => payload, text: async () => JSON.stringify(payload) };
      }
      return { ok: false, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '{}' };
    });

    const AuthModal = require('../../app/components/AuthModal').default;
    render(React.createElement(AuthModal, { isOpen: true, onClose, intendedRole: 'guia' }));

    fireEvent.change(screen.getByPlaceholderText(/^name$/i), { target: { value: 'G' } });
    fireEvent.change(screen.getByPlaceholderText(/^lastName$/i), { target: { value: 'U' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'México' } });
    fireEvent.change(screen.getByPlaceholderText(/^phone$/i), { target: { value: '+52 12345678' } });
    const regEmails2 = screen.getAllByPlaceholderText(/^email$/i);
    const regPasswords2 = screen.getAllByPlaceholderText(/^password$/i);
    fireEvent.change(regEmails2[1], { target: { value: 'g@g.com' } });
    fireEvent.change(regPasswords2[1], { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText(/^confirmPassword$/i), { target: { value: 'pass123' } });

    const registerBtns2 = screen.getAllByRole('button', { name: /register/i });
    const submitRegister2 = registerBtns2.find((b: any) => b.getAttribute('type') === 'submit') || registerBtns2[0];
    fireEvent.click(submitRegister2);

    await waitFor(() => {
      expect(localStorage.getItem('pitzbol_token')).toBe('tok');
      expect(onClose).toHaveBeenCalled();
      expect((window as any).onAuthSuccessShowGuide).toHaveBeenCalled();
    });
  });

  it('shows server error alert on failed login', async () => {
    const onClose = jest.fn();
    ;(window as any).alert = jest.fn();

    // Mock a failing login
    // @ts-ignore
    global.fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/login')) return { ok: false, status: 401, headers: { get: () => 'application/json' }, json: async () => ({ msg: 'Invalid credentials' }), text: async () => JSON.stringify({ msg: 'Invalid credentials' }) };
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '{}' };
    });

    const AuthModal = require('../../app/components/AuthModal').default;
    render(React.createElement(AuthModal, { isOpen: true, onClose }));

    // Fill login inputs and submit (use the first email/password inputs)
    const loginEmails = screen.getAllByPlaceholderText(/^email$/i);
    const loginPasswords = screen.getAllByPlaceholderText(/^password$/i);
    fireEvent.change(loginEmails[0], { target: { value: 'x@x.com' } });
    fireEvent.change(loginPasswords[0], { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect((window as any).alert).toHaveBeenCalled();
    });
  });
});

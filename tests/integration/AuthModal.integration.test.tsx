/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock ESM-only modules that Jest can't parse directly in tests
jest.mock('next-intl', () => ({
  useTranslations: () => (k: string) => k,
  NextIntlClientProvider: ({ children }: any) => children,
}));
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: { div: (p: any) => React.createElement('div', p, p.children), button: (p: any) => React.createElement('button', p, p.children) },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  };
});
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => React.createElement('img', props) }));

const BACKEND = process.env.TEST_BACKEND_URL || 'http://localhost:3001';

if (!BACKEND) {
  // If no backend configured, skip the integration tests in this file.
  // (This branch is unlikely because we provide a default, but kept for clarity.)
  describe.skip('AuthModal integration (skipped)', () => {});
} else {
  describe('AuthModal integration tests (real backend)', () => {
    beforeAll(async () => {
      // Try to polyfill global.fetch using node-fetch (dynamic import)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nf = await import('node-fetch');
        // @ts-ignore
        global.fetch = nf.default || nf;
      } catch (err) {
        // If node-fetch isn't available, tests may still run if Node provides fetch
      }
    });

    beforeEach(() => {
      // Point client helpers to the real backend
      // @ts-ignore
      window.__TEST_BACKEND_URL__ = BACKEND;
      localStorage.clear();
      sessionStorage.clear();
      // Stub alert which isn't implemented in jsdom
      // @ts-ignore
      window.alert = jest.fn();
    });

    test('registers a new turista end-to-end against backend', async () => {
      const onClose = jest.fn();
      const AuthModal = require('../../app/components/AuthModal').default;

      render(React.createElement(AuthModal, { isOpen: true, onClose, intendedRole: 'turista' }));

      const unique = Date.now();
      const email = `integration+${unique}@example.com`;

      // Fill form fields (use placeholders present in component)
      fireEvent.change(screen.getByPlaceholderText(/^name$/i), { target: { value: 'Int' } });
      fireEvent.change(screen.getByPlaceholderText(/^lastName$/i), { target: { value: 'Test' } });
      // nationality is a select / combobox
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'México' } });
      fireEvent.change(screen.getByPlaceholderText(/^phone$/i), { target: { value: '+521234567890' } });

      const allEmails = screen.getAllByPlaceholderText(/^email$/i);
      const allPasswords = screen.getAllByPlaceholderText(/^password$/i);
      // registration email/password are the second set of inputs in the modal
      fireEvent.change(allEmails[1], { target: { value: email } });
      fireEvent.change(allPasswords[1], { target: { value: 'TestPassword123' } });
      fireEvent.change(screen.getByPlaceholderText(/^confirmPassword$/i), { target: { value: 'TestPassword123' } });

      // Submit (find submit-type register button)
      const registerBtns = screen.getAllByRole('button', { name: /register/i });
      const submitRegister = registerBtns.find((b: any) => b.getAttribute('type') === 'submit') || registerBtns[0];
      fireEvent.click(submitRegister);

      // Wait for real backend response to be processed by the client
      await waitFor(() => {
        const token = localStorage.getItem('pitzbol_token');
        expect(token).toBeTruthy();
        const userRaw = localStorage.getItem('pitzbol_user');
        expect(userRaw).toBeTruthy();
        const user = JSON.parse(userRaw || '{}');
        expect(user.email).toBe(email);
      }, { timeout: 30000 });
    }, 45000);
  });
}

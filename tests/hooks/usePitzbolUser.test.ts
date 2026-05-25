/* eslint-disable */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

const TestComponent = () => {
  const { usePitzbolUser } = require('../../lib/usePitzbolUser');
  const user = usePitzbolUser();
  return React.createElement('div', {}, user ? user.nombre : 'no-user');
};

describe('usePitzbolUser hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('reads initial user from localStorage', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.c', nombre: 'A', apellido: 'B', role: 'turista' };
    localStorage.setItem('pitzbol_user', JSON.stringify(fakeUser));
    render(React.createElement(TestComponent));
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());
  });

  it('updates on storage event', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.c', nombre: 'A', apellido: 'B', role: 'turista' };
    localStorage.setItem('pitzbol_user', JSON.stringify(fakeUser));
    render(React.createElement(TestComponent));
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());

    const newUser = { uid: 'u2', email: 'x@y.z', nombre: 'X', apellido: 'Y', role: 'turista' };
    localStorage.setItem('pitzbol_user', JSON.stringify(newUser));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'pitzbol_user', newValue: JSON.stringify(newUser) }));
    });
    await waitFor(() => expect(screen.getByText('X')).toBeInTheDocument());
  });

  it('clears when localStorage removed and authStateChanged triggers', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.c', nombre: 'A', apellido: 'B', role: 'turista' };
    localStorage.setItem('pitzbol_user', JSON.stringify(fakeUser));
    render(React.createElement(TestComponent));
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());

    localStorage.removeItem('pitzbol_user');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'pitzbol_user', newValue: null }));
    });
    await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument());

    const newUser = { uid: 'u3', email: 'z@z.z', nombre: 'Z', apellido: 'Q', role: 'turista' };
    localStorage.setItem('pitzbol_user', JSON.stringify(newUser));
    act(() => {
      window.dispatchEvent(new Event('authStateChanged'));
    });
    await waitFor(() => expect(screen.getByText('Z')).toBeInTheDocument());
  });
});

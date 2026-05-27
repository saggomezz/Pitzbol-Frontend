/* eslint-disable */
/**
 * Unit tests for the global ErrorBoundary component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../app/components/ErrorBoundary';

// A component that throws on first render, then renders normally after reset
let shouldThrow = true;
function BrokenComponent() {
  if (shouldThrow) throw new Error('Test render error');
  return <div>Recovered content</div>;
}

// Suppress console.error noise during these tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('renders the fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /ir al inicio/i })).toBeTruthy();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeTruthy();
  });

  it('recovers when the "Reintentar" button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    // Confirm error state
    expect(screen.getByText(/algo salió mal/i)).toBeTruthy();

    // Fix the broken component
    shouldThrow = false;

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // Re-render so the ErrorBoundary renders its (now-fixed) child
    rerender(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered content')).toBeTruthy();
  });
});

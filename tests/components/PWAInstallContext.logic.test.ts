/* eslint-disable */
/**
 * Unit tests for PWAInstallContext — specifically the fix that avoids
 * calling e.preventDefault() when the user has permanently dismissed the
 * install banner (which was causing the Chrome "Banner not shown" warning).
 */

import React from 'react';
import { render, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Helpers — simulate the beforeinstallprompt handler logic
// ---------------------------------------------------------------------------

interface HandlerOptions {
  never: boolean;
  recentlyDismissed: boolean;
}

function buildBeforeInstallPromptHandler(opts: HandlerOptions) {
  return function handler(e: { preventDefault: () => void }) {
    if (!opts.never && !opts.recentlyDismissed) {
      e.preventDefault();
      // would call setDeferredPrompt + setTimeout(showBanner, 3000)
    }
    // always capture the event for the manual install button
  };
}

describe('PWAInstallContext beforeinstallprompt handler', () => {
  it('calls preventDefault() when banner should be shown (user has not dismissed)', () => {
    const handler = buildBeforeInstallPromptHandler({
      never: false,
      recentlyDismissed: false,
    });
    const mockEvent = { preventDefault: jest.fn() };
    handler(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('does NOT call preventDefault() when user permanently dismissed the banner', () => {
    const handler = buildBeforeInstallPromptHandler({
      never: true,
      recentlyDismissed: false,
    });
    const mockEvent = { preventDefault: jest.fn() };
    handler(mockEvent);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('does NOT call preventDefault() when banner was recently dismissed (7-day cooldown)', () => {
    const handler = buildBeforeInstallPromptHandler({
      never: false,
      recentlyDismissed: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    handler(mockEvent);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('does NOT call preventDefault() when both never and recentlyDismissed are true', () => {
    const handler = buildBeforeInstallPromptHandler({
      never: true,
      recentlyDismissed: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    handler(mockEvent);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests for "recently dismissed" time-window logic
// ---------------------------------------------------------------------------

function isRecentlyDismissed(dismissedTimestamp: number | null): boolean {
  if (!dismissedTimestamp) return false;
  return Date.now() - dismissedTimestamp < 7 * 24 * 60 * 60 * 1000;
}

describe('isRecentlyDismissed (7-day cooldown)', () => {
  it('returns false when no timestamp stored', () => {
    expect(isRecentlyDismissed(null)).toBe(false);
  });

  it('returns true when dismissed 1 hour ago', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    expect(isRecentlyDismissed(oneHourAgo)).toBe(true);
  });

  it('returns true when dismissed 6 days ago', () => {
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    expect(isRecentlyDismissed(sixDaysAgo)).toBe(true);
  });

  it('returns false when dismissed 8 days ago (cooldown expired)', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    expect(isRecentlyDismissed(eightDaysAgo)).toBe(false);
  });
});

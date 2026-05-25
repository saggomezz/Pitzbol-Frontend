/* eslint-disable */
import { jest } from '@jest/globals';

describe('backendUrl helper', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('in browser (jsdom) returns empty origin and api base /api', async () => {
    // In the default test environment (jsdom) getBackendOrigin() should be ''
    const { getBackendOrigin, getApiBaseUrl } = await import('@/lib/backendUrl');
    expect(getBackendOrigin()).toBe('');
    expect(getApiBaseUrl()).toBe('/api');
  });

  test('in server environment uses BACKEND_INTERNAL_URL env var', async () => {
    // Simulate server by un-defining `window` and setting env var
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const originalWindow = global.window;
    // @ts-ignore
    global.window = undefined;

    process.env.BACKEND_INTERNAL_URL = 'https://staging.example.com';
    jest.resetModules();
    const { getSocketBackendOrigin } = await import('@/lib/backendUrl');

    expect(getSocketBackendOrigin()).toBe('https://staging.example.com');

    // restore
    process.env.BACKEND_INTERNAL_URL = '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.window = originalWindow;
  });
});

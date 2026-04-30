import '@testing-library/jest-dom';

// Allow integration tests to run against deployed backend when TEST_BACKEND_URL is set.
const INTEGRATION_BACKEND = Boolean(process.env.TEST_BACKEND_URL) || process.env.INTEGRATION_TEST_BACKEND === 'true';

// If not running integration tests, mock Firebase client and socket.io-client to avoid real network.
if (!INTEGRATION_BACKEND) {
  // Mock local firebase wrapper used by the app
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  jest.mock('../lib/firebase', () => ({
    __esModule: true,
    storage: {
      ref: jest.fn(() => ({
        put: jest.fn().mockResolvedValue({}),
        getDownloadURL: jest.fn().mockResolvedValue('https://mock.storage/default.jpg')
      }))
    }
  }));

  // Mock socket.io-client to a no-op socket in unit tests
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  jest.mock('socket.io-client', () => ({
    __esModule: true,
    io: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false
    }))
  }));
}

// Mock window.location to avoid test failures when components access it
try {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost/'
    },
    writable: true
  });
} catch (e) {
  // In some jsdom versions `location` is non-configurable; fallback to setting href
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.location.href = 'http://localhost/';
}

// Basic localStorage mock for Node/Jest environment (jsdom already provides one, but ensure APIs exist)
if (!window.localStorage) {
  const storage: Record<string, string> = {};
  window.localStorage = {
    getItem: (k: string) => storage[k] || null,
    setItem: (k: string, v: string) => { storage[k] = v; },
    removeItem: (k: string) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    key: (index: number) => Object.keys(storage)[index] || null,
    length: 0
  } as any;
}

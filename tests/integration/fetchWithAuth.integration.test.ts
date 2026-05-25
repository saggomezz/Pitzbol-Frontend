describe('fetchWithAuth integration/unit behaviors', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;

  if (BACKEND) {
    test('fetchWithAuth can call deployed backend (integration)', async () => {
      try {
        const nf = await import('node-fetch');
        // @ts-ignore
        global.fetch = nf.default || nf;
      } catch (err) {
        // ignore
      }

      // Call with full URL so the helper doesn't rely on relative paths
      const { fetchWithAuth } = require('../../lib/fetchWithAuth');
      // Put a token in localStorage so the wrapper adds Authorization header
      localStorage.setItem('pitzbol_token', 'integration-test-token');

      const res = await fetchWithAuth(`${BACKEND}/api`);
      // Backend may return 2xx or 4xx for the base /api path; ensure it's not a server error
      expect(res.status).toBeLessThan(500);
    }, 20000);
    return;
  }

  test('fetchWithAuth refreshes token on 401 and retries (unit)', async () => {
    const { fetchWithAuth } = require('../../lib/fetchWithAuth');

    // Mock global.fetch to simulate 401 then refresh then success
    const originalFetch = global.fetch;
    let call = 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.fetch = jest.fn((url: any) => {
      call++;
      if (String(url).includes('/auth/refresh-token')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ token: 'new.jwt' }) });
      }
      if (call === 1) {
        return Promise.resolve({ ok: false, status: 401, json: async () => null });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => 'ok' });
    });

    localStorage.setItem('pitzbol_token', 'old.jwt');
    const res = await fetchWithAuth('/api/some');
    expect(res.status).toBe(200);

    // Restore original fetch
    global.fetch = originalFetch;
  });
});

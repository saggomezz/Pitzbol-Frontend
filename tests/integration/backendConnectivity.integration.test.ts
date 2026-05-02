describe('Backend connectivity (integration)', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;

  if (!BACKEND) {
    test.skip('No TEST_BACKEND_URL provided — skipping integration connectivity test', () => {});
    return;
  }

  beforeAll(async () => {
    try {
      const nf = await import('node-fetch');
      // @ts-ignore
      global.fetch = nf.default || nf;
    } catch (err) {
      // ignore if node has built-in fetch
    }
  });

  test('GET /api responds (not a server error)', async () => {
    const res = await fetch(`${BACKEND}/api`);
    // Accept 2xx or 4xx as a reachable backend response (not 5xx)
    expect(res.status).toBeLessThan(500);
    const json = await res.json();
    expect(json).toBeDefined();
  }, 20000);
});

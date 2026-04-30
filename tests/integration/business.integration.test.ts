describe('Business endpoints (integration, read-only)', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;
  const TOKEN = process.env.TEST_USER_TOKEN;

  if (!BACKEND || !TOKEN) {
    test.skip('Missing TEST_BACKEND_URL or TEST_USER_TOKEN — skipping business integration', () => {});
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

  test('GET /api/business/my-business responds (200 or 404)', async () => {
    const res = await fetch(`${BACKEND}/api/business/my-business`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    // Accept 200 (business found) or 404 (no business yet) as valid read-only responses
    expect([200, 404]).toContain(res.status);
  }, 15000);
});

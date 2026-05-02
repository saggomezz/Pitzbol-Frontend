describe('Favorites integration (read-only)', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;
  const TOKEN = process.env.TEST_USER_TOKEN;

  if (!BACKEND || !TOKEN) {
    test.skip('Missing TEST_BACKEND_URL or TEST_USER_TOKEN — skipping favorites integration', () => {});
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

    // Ensure frontend libs use the deployed backend
    process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;
    // Provide localStorage user with idToken for the favorites helper
    const user = { uid: process.env.TEST_USER_ID || 'test-user', idToken: TOKEN };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.localStorage.setItem('pitzbol_user', JSON.stringify(user));
  });

  test('GET /api/favorites returns an array', async () => {
    const { obtenerFavoritosBackend } = require('../../lib/favoritesApi');
    const favs = await obtenerFavoritosBackend();
    expect(Array.isArray(favs)).toBe(true);
  }, 15000);
});

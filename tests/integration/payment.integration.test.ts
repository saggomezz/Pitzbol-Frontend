describe('Payments integration (create-payment-intent)', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;
  const TOKEN = process.env.TEST_USER_TOKEN;
  const USER_ID = process.env.TEST_USER_ID;
  const ALLOW = process.env.TEST_ALLOW_PAYMENTS === 'true' || process.env.TEST_STRIPE_TEST_MODE === 'true';

  if (!BACKEND || !TOKEN || !USER_ID) {
    test.skip('Missing TEST_BACKEND_URL, TEST_USER_TOKEN or TEST_USER_ID — skipping payments integration', () => {});
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

  if (!ALLOW) {
    test.skip('Payments disabled: set TEST_ALLOW_PAYMENTS=true and TEST_STRIPE_TEST_MODE=true to run', () => {});
    return;
  }

  test('POST /api/payments/create-payment-intent returns 201 and a paymentIntentId', async () => {
    const body = { bookingId: `test-booking-${Date.now()}`, userId: USER_ID, amount: 100.0, currency: 'mxn' };
    const res = await fetch(`${BACKEND}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toBeDefined();
    expect(json.paymentIntentId || json.client_secret || json.paymentIntent?.id).toBeTruthy();
  }, 20000);
});

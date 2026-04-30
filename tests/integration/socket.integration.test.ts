describe('Socket.IO connectivity (integration)', () => {
  const BACKEND = process.env.TEST_BACKEND_URL;
  const TOKEN = process.env.TEST_USER_TOKEN;

  if (!BACKEND || !TOKEN) {
    test.skip('Missing TEST_BACKEND_URL or TEST_USER_TOKEN — skipping socket integration', () => {});
    return;
  }

  test('connects to backend socket with auth token', (done) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { io } = require('socket.io-client');
    const socket = io(BACKEND, {
      transports: ['websocket'],
      auth: { token: TOKEN },
      reconnectionAttempts: 1,
      timeout: 10000,
    });

    socket.on('connect', () => {
      try {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      } catch (err) {
        done(err);
      }
    });

    socket.on('connect_error', (err: any) => {
      done(err);
    });

    setTimeout(() => {
      if (!socket.connected) {
        socket.close();
        done(new Error('Socket connection timed out'));
      }
    }, 10000);
  }, 20000);
});

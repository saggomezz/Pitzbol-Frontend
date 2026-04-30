import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';

// Create a controllable fake socket so tests can trigger events
const handlers: Record<string, Function> = {};
const fakeSocket: any = {
  on: (ev: string, cb: Function) => { handlers[ev] = cb; },
  off: (ev: string) => { delete handlers[ev]; },
  emit: jest.fn(),
  connect: () => { if (handlers.connect) handlers.connect(); },
  disconnect: jest.fn(),
  connected: false,
  auth: {},
  trigger: (ev: string, payload?: any) => { if (handlers[ev]) handlers[ev](payload); },
};

jest.mock('socket.io-client', () => ({ io: jest.fn(() => fakeSocket) }));

jest.mock('@/lib/fetchWithAuth', () => ({
  ensureValidAuthToken: jest.fn(async () => 'mock-token'),
  fetchWithAuth: jest.fn(async () => ({ ok: true, json: async () => ({ success: true, totalUnread: 0, chats: [] }) })),
}));

jest.mock('@/lib/backendUrl', () => ({
  getSocketBackendOrigin: () => 'http://localhost',
}));

import { useMessageNotifications } from '@/lib/useMessageNotifications';

function Harness({ userId }: { userId: string }) {
  const hook = useMessageNotifications({ userId, userType: 'tourist', enabled: true });
  return (
    <div>
      <div data-testid="connected">{String(hook.isConnected)}</div>
      <div data-testid="unread">{String(hook.unreadCount)}</div>
      <div data-testid="newmsg">{hook.newMessageNotification ? hook.newMessageNotification.message : ''}</div>
      <button data-testid="clear" onClick={hook.clearNotification}>clear</button>
      <button data-testid="mark" onClick={() => void hook.markChatAsRead('chat-1')}>mark</button>
    </div>
  );
}

describe('useMessageNotifications hook', () => {
  beforeEach(() => {
    // clear handlers and mock state
    Object.keys(handlers).forEach(k => delete handlers[k]);
    fakeSocket.emit.mockClear();
    fakeSocket.connected = false;
  });

  test('connects, fetches unread and handles new-message events', async () => {
    render(<Harness userId="user1" />);

    // Simulate socket connection
    act(() => {
      fakeSocket.connect();
      fakeSocket.connected = true;
    });

    // fetchWithAuth mock returns totalUnread = 0, so unread should reflect that
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('0'));

    // Simulate an incoming message from another user
    act(() => {
      fakeSocket.trigger('new-message', {
        senderId: 'other',
        chatId: 'chat-1',
        content: 'Hola testing',
        senderName: 'Ana',
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => expect(screen.getByTestId('newmsg')).toHaveTextContent('Hola testing'));
  });

  test('does not increment unread for messages from same user and emits mark-as-read when marking', async () => {
    render(<Harness userId="me" />);

    act(() => {
      fakeSocket.connect();
      fakeSocket.connected = true;
    });

    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('0'));

    // Message from same user should not increase unread
    act(() => {
      fakeSocket.trigger('new-message', {
        senderId: 'me',
        chatId: 'chat-2',
        content: 'Self message',
        senderName: 'Me',
        timestamp: new Date().toISOString(),
      });
    });

    // still zero
    expect(screen.getByTestId('unread')).toHaveTextContent('0');

    // Click mark button to trigger markChatAsRead -> should call socket.emit('mark-as-read', ...)
    const markBtn = screen.getByTestId('mark');
    act(() => { fireEvent.click(markBtn); });

    // because fakeSocket.connected=true, emit should be invoked (mark-as-read)
    await waitFor(() => expect(fakeSocket.emit).toHaveBeenCalled());
    expect(fakeSocket.emit).toHaveBeenCalledWith('mark-as-read', expect.objectContaining({ chatId: 'chat-1' }));
  });
});

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the Wails runtime bridge for tests
Object.defineProperty(window, 'go', {
  value: {
    main: {
      App: {
        Greet: (name: string) =>
          Promise.resolve(`Hello ${name}! mqtts frontend is running in browser preview mode.`),
        ListConnections: () => Promise.resolve([]),
        GetConnection: (_id: string) => Promise.reject(new Error('not found')),
        CreateConnection: (_conn: unknown) => Promise.resolve('test-id'),
        UpdateConnection: (_conn: unknown) => Promise.resolve(undefined),
        DeleteConnection: (_id: string) => Promise.resolve(undefined),
        GetSettings: () => Promise.resolve(null),
        SaveSettings: (_settings: unknown) => Promise.resolve(undefined),
        Connect: (_id: string) => Promise.resolve(undefined),
        Disconnect: (_id: string) => Promise.resolve(undefined),
        IsConnected: (_id: string) => Promise.resolve(false),
        Publish: (_msg: unknown) => Promise.resolve(undefined),
        Subscribe: (_sub: unknown) => Promise.resolve(undefined),
        Unsubscribe: (_id: string) => Promise.resolve(undefined),
        ListSubscriptions: (_connId: string) => Promise.resolve([]),
        CreateSubscription: (_sub: unknown) => Promise.resolve(undefined),
        UpdateSubscription: (_sub: unknown) => Promise.resolve(undefined),
        DeleteSubscription: (_id: string) => Promise.resolve(undefined),
        ListMessages: (_input: unknown) => Promise.resolve({ messages: [], total: 0 }),
        DeleteMessagesByConnection: (_connId: string) => Promise.resolve(undefined),
        ListPublishHeaders: (_connId: string) => Promise.resolve([]),
        ListPublishPayloads: (_connId: string) => Promise.resolve([]),
        UpdateSettings: (_settings: unknown) => Promise.resolve(undefined),
        ExportAll: () => Promise.resolve('{}'),
        ImportAll: (_json: string) => Promise.resolve({ connectionsImported: 0, subscriptionsImported: 0 }),
      },
    },
  },
});

// Mock the Wails runtime (EventsOn, EventsOff, etc.)
Object.defineProperty(window, 'runtime', {
  value: {
    EventsOnMultiple: vi.fn(),
    EventsOn: vi.fn(),
    EventsOff: vi.fn(),
    EventsOffAll: vi.fn(),
    EventsOnce: vi.fn(),
    EventsEmit: vi.fn(),
  },
  writable: true,
});

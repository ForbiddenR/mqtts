import { useCallback, useEffect, useState } from 'react';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import { IsConnected, Connect, Disconnect } from '../../wailsjs/go/main/App';

interface ConnectionStatusEvent {
  connectionId: string;
  status: string;
  error?: string;
  timestamp: string;
}

export interface UseMqttStatusResult {
  statuses: Record<string, string>;
  isConnected: (id: string) => boolean;
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
}

export function useMqttStatus(connectionIds: string[]): UseMqttStatusResult {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  // Subscribe to Wails events
  useEffect(() => {
    const off = EventsOn('mqtt:connection:status', (event: ConnectionStatusEvent) => {
      setStatuses((prev) => ({
        ...prev,
        [event.connectionId]: event.status,
      }));
    });

    return off;
  }, []);

  // Poll initial status for all connections
  useEffect(() => {
    if (connectionIds.length === 0) return;

    const poll = async () => {
      const newStatuses: Record<string, string> = {};
      for (const id of connectionIds) {
        try {
          const connected = await IsConnected(id);
          newStatuses[id] = connected ? 'connected' : 'disconnected';
        } catch {
          newStatuses[id] = 'disconnected';
        }
      }
      setStatuses((prev) => ({ ...prev, ...newStatuses }));
    };

    poll();
  }, [connectionIds]);

  const isConnected = useCallback(
    (id: string) => statuses[id] === 'connected',
    [statuses],
  );

  const connect = useCallback(async (id: string) => {
    try {
      setStatuses((prev) => ({ ...prev, [id]: 'connecting' }));
      await Connect(id);
    } catch (err) {
      setStatuses((prev) => ({ ...prev, [id]: 'error' }));
      throw err;
    }
  }, []);

  const disconnect = useCallback(async (id: string) => {
    try {
      setStatuses((prev) => ({ ...prev, [id]: 'disconnecting' }));
      await Disconnect(id);
    } catch (err) {
      setStatuses((prev) => ({ ...prev, [id]: 'error' }));
      throw err;
    }
  }, []);

  return { statuses, isConnected, connect, disconnect };
}

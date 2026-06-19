import { useCallback, useEffect, useState } from 'react';
import { ListMessages, DeleteMessagesByConnection } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import type { models } from '../../wailsjs/go/models';

export interface UseMessagesResult {
  messages: models.Message[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
  clearAll: () => Promise<void>;
  hasMore: boolean;
}

const PAGE_SIZE = 50;

export function useMessages(connectionId: string | null): UseMessagesResult {
  const [messages, setMessages] = useState<models.Message[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const reload = useCallback(async () => {
    if (!connectionId) {
      setMessages([]);
      setTotal(0);
      setOffset(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await ListMessages({ connectionId, limit: PAGE_SIZE, offset: 0 });
      setMessages(result?.messages ?? []);
      setTotal(result?.total ?? 0);
      setOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  const loadMore = useCallback(async () => {
    if (!connectionId || loading) return;
    const nextOffset = offset + PAGE_SIZE;
    if (nextOffset >= total) return;
    try {
      setLoading(true);
      const result = await ListMessages({ connectionId, limit: PAGE_SIZE, offset: nextOffset });
      setMessages((prev) => [...prev, ...(result?.messages ?? [])]);
      setTotal(result?.total ?? 0);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [connectionId, offset, total, loading]);

  const clearAll = useCallback(async () => {
    if (!connectionId) return;
    try {
      setError(null);
      await DeleteMessagesByConnection(connectionId);
      setMessages([]);
      setTotal(0);
      setOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [connectionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Listen for real-time messages
  useEffect(() => {
    if (!connectionId) return;

    const offReceived = EventsOn('mqtt:message:received', (event: { connectionId: string; message: models.Message }) => {
      if (event.connectionId !== connectionId) return;
      setMessages((prev) => [event.message, ...prev]);
      setTotal((prev) => prev + 1);
    });

    const offPublished = EventsOn('mqtt:message:published', (event: { connectionId: string; message: models.Message }) => {
      if (event.connectionId !== connectionId) return;
      setMessages((prev) => [event.message, ...prev]);
      setTotal((prev) => prev + 1);
    });

    return () => {
      offReceived();
      offPublished();
    };
  }, [connectionId]);

  const hasMore = offset + PAGE_SIZE < total;

  return { messages, total, loading, error, reload, loadMore, clearAll, hasMore };
}

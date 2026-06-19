import { useCallback, useEffect, useState } from 'react';
import {
  ListSubscriptions,
  CreateSubscription,
  UpdateSubscription,
  DeleteSubscription,
  Subscribe,
  Unsubscribe,
} from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import type { models } from '../../wailsjs/go/models';

export interface UseSubscriptionsResult {
  subscriptions: models.Subscription[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (sub: models.Subscription) => Promise<void>;
  update: (sub: models.Subscription) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useSubscriptions(connectionId: string | null): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<models.Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!connectionId) {
      setSubscriptions([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await ListSubscriptions(connectionId);
      setSubscriptions(list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  const add = useCallback(async (sub: models.Subscription) => {
    try {
      setError(null);
      await CreateSubscription(sub);
      // Also subscribe on the broker if connected
      try {
        await Subscribe({ connectionId: sub.connection_id, topic: sub.topic, qos: sub.qos });
      } catch {
        // Not connected is OK — subscription is still saved
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  const update = useCallback(async (sub: models.Subscription) => {
    try {
      setError(null);
      await UpdateSubscription(sub);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      // Find the subscription to get topic for unsubscribe
      const sub = subscriptions.find((s) => s.id === id);
      await DeleteSubscription(id);
      // Also unsubscribe from the broker if connected
      if (sub) {
        try {
          await Unsubscribe({ connectionId: sub.connection_id, topic: sub.topic });
        } catch {
          // Not connected is OK
        }
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload, subscriptions]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Listen for subscription changes from the broker
  useEffect(() => {
    if (!connectionId) return;

    const off = EventsOn('mqtt:subscription:changed', () => {
      reload();
    });

    return off;
  }, [connectionId, reload]);

  return { subscriptions, loading, error, reload, add, update, remove };
}

import { useCallback, useEffect, useState } from 'react';
import { GetConnectionStats, GetAllConnectionStats } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

export interface ConnectionStats {
  connectionId: string;
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  connectedAt?: string;
  lastLatencyMs: number;
  avgLatencyMs: number;
  latencySamples: number;
  lastError?: string;
  reconnectCount: number;
}

export interface UseConnectionStatsResult {
  stats: ConnectionStats | null;
  allStats: ConnectionStats[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useConnectionStats(connectionId: string | null): UseConnectionStatsResult {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [allStats, setAllStats] = useState<ConnectionStats[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      if (connectionId) {
        const s = await GetConnectionStats(connectionId);
        setStats(s);
      }
      const all = await GetAllConnectionStats();
      setAllStats(all ?? []);
    } catch {
      // Silently handle — stats are non-critical
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  // Poll stats every 3 seconds
  useEffect(() => {
    if (!connectionId) {
      setStats(null);
      return;
    }

    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [connectionId, refresh]);

  // Listen for connection status changes to refresh stats
  useEffect(() => {
    const off = EventsOn('mqtt:connection:status', () => {
      refresh();
    });
    return off;
  }, [refresh]);

  return { stats, allStats, loading, refresh };
}

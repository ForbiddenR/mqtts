import { useCallback, useEffect, useState } from 'react';
import {
  ListConnections,
  CreateConnection,
  UpdateConnection,
  DeleteConnection,
} from '../../wailsjs/go/main/App';
import { models } from '../../wailsjs/go/models';

export interface UseConnectionsResult {
  connections: models.Connection[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (conn: models.Connection) => Promise<void>;
  update: (conn: models.Connection) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (conn: models.Connection) => Promise<void>;
}

export function useConnections(): UseConnectionsResult {
  const [connections, setConnections] = useState<models.Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await ListConnections();
      setConnections(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (conn: models.Connection) => {
    try {
      setError(null);
      await CreateConnection(conn);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  const update = useCallback(async (conn: models.Connection) => {
    try {
      setError(null);
      await UpdateConnection(conn);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      await DeleteConnection(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  const duplicate = useCallback(async (conn: models.Connection) => {
    try {
      setError(null);
      const copy = { ...conn };
      copy.id = '';
      copy.name = `${conn.name} (copy)`;
      copy.client_id = `${conn.client_id}_copy`;
      copy.created_at = '';
      copy.updated_at = '';
      await CreateConnection(copy as models.Connection);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { connections, loading, error, reload, create, update, remove, duplicate };
}

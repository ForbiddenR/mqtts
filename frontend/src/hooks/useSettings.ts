import { useCallback, useEffect, useState } from 'react';
import { GetSettings, UpdateSettings } from '../../wailsjs/go/main/App';
import type { models } from '../../wailsjs/go/models';

export interface UseSettingsResult {
  settings: models.Settings | null;
  loading: boolean;
  error: string | null;
  save: (s: models.Settings) => Promise<void>;
  reload: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<models.Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const s = await GetSettings();
      setSettings(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (s: models.Settings) => {
    try {
      setError(null);
      await UpdateSettings(s);
      setSettings(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { settings, loading, error, save, reload };
}

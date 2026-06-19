import { useState, useEffect } from 'react';
import { Input, Select, Checkbox } from '../../components/FormField';
import type { models } from '../../../wailsjs/go/models';
import type { UseSettingsResult } from '../../hooks/useSettings';

interface SettingsPageProps {
  settings: UseSettingsResult;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const LOG_LEVEL_OPTIONS = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
];

export function SettingsPage({ settings: settingsResult, onClose }: SettingsPageProps) {
  const { settings, loading, error, save } = settingsResult;
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings } as Record<string, unknown>);
    }
  }, [settings]);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await save(form as unknown as models.Settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error is set in the hook
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Configure application preferences</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg space-y-8">
          {/* Appearance */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Appearance</h3>
            <div className="space-y-4">
              <Select
                label="Theme"
                options={THEME_OPTIONS}
                value={String(form.current_theme ?? 'dark')}
                onChange={(e) => updateField('current_theme', e.target.value)}
              />
              <Checkbox
                label="Sync with OS Theme"
                description="Automatically switch theme based on system preference"
                checked={!!form.sync_os_theme}
                onChange={(e) => updateField('sync_os_theme', e.target.checked)}
              />
              <Checkbox
                label="JSON Syntax Highlighting"
                description="Highlight JSON payloads in messages"
                checked={!!form.json_highlight}
                onChange={(e) => updateField('json_highlight', e.target.checked)}
              />
              <Select
                label="Language"
                options={LANG_OPTIONS}
                value={String(form.current_lang ?? 'en')}
                onChange={(e) => updateField('current_lang', e.target.value)}
              />
            </div>
          </section>

          {/* MQTT */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">MQTT</h3>
            <div className="space-y-4">
              <Input
                label="Max Reconnect Times"
                type="number"
                value={String(form.max_reconnect_times ?? 10)}
                onChange={(e) => updateField('max_reconnect_times', parseInt(e.target.value) || 0)}
                description="Maximum number of automatic reconnect attempts"
              />
              <Checkbox
                label="Auto Resubscribe"
                description="Automatically resubscribe to topics after reconnecting"
                checked={!!form.auto_resub}
                onChange={(e) => updateField('auto_resub', e.target.checked)}
              />
              <Checkbox
                label="Multi-topic Input"
                description="Allow subscribing to multiple topics at once"
                checked={!!form.multi_topics}
                onChange={(e) => updateField('multi_topics', e.target.checked)}
              />
              <Checkbox
                label="Ignore QoS 0 Messages"
                description="Do not display QoS 0 messages in the timeline"
                checked={!!form.ignore_qos0_message}
                onChange={(e) => updateField('ignore_qos0_message', e.target.checked)}
              />
            </div>
          </section>

          {/* Logging */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Logging</h3>
            <div className="space-y-4">
              <Select
                label="Log Level"
                options={LOG_LEVEL_OPTIONS}
                value={String(form.log_level ?? 'info')}
                onChange={(e) => updateField('log_level', e.target.value)}
              />
            </div>
          </section>

          {/* Updates */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Updates</h3>
            <div className="space-y-4">
              <Checkbox
                label="Auto-check for Updates"
                description="Check for new versions on startup"
                checked={!!form.auto_check}
                onChange={(e) => updateField('auto_check', e.target.checked)}
              />
            </div>
          </section>

          {/* Copilot */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Copilot</h3>
            <div className="space-y-4">
              <Checkbox
                label="Enable AI Copilot"
                description="Use AI to help with MQTT tasks"
                checked={!!form.enable_copilot}
                onChange={(e) => updateField('enable_copilot', e.target.checked)}
              />
              {!!form.enable_copilot && (
                <>
                  <Input
                    label="API Host"
                    placeholder="https://api.openai.com/v1"
                    value={String(form.open_ai_api_host ?? '')}
                    onChange={(e) => updateField('open_ai_api_host', e.target.value)}
                  />
                  <Input
                    label="API Key"
                    type="password"
                    placeholder="sk-..."
                    value={String(form.open_ai_api_key ?? '')}
                    onChange={(e) => updateField('open_ai_api_key', e.target.value)}
                  />
                  <Input
                    label="Model"
                    placeholder="gpt-4o"
                    value={String(form.model ?? '')}
                    onChange={(e) => updateField('model', e.target.value)}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Input, Select, Textarea, Checkbox } from '../../components/FormField';
import { Publish } from '../../../wailsjs/go/main/App';
import type { models } from '../../../wailsjs/go/models';
import type { PayloadTemplate } from '../../hooks/useSettings';

interface PublishComposerProps {
  connectionId: string;
  recentTopics?: models.PublishHistoryHeader[];
  templates?: PayloadTemplate[];
  onSaveTemplate?: (t: PayloadTemplate) => void;
}

const QOS_OPTIONS = [
  { value: '0', label: 'QoS 0 - At most once' },
  { value: '1', label: 'QoS 1 - At least once' },
  { value: '2', label: 'QoS 2 - Exactly once' },
];

const FORMAT_OPTIONS = [
  { value: 'plaintext', label: 'Plaintext' },
  { value: 'json', label: 'JSON' },
  { value: 'base64', label: 'Base64' },
  { value: 'hex', label: 'Hex' },
];

// Mock data generators
const randomId = () => Math.random().toString(36).substring(2, 10);
const randomFloat = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);
const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const randomBool = () => Math.random() > 0.5;

const MOCK_GENERATORS: Record<string, () => { payload: string; format: string }> = {
  'JSON Sensor': () => ({
    payload: JSON.stringify({
      id: randomId(),
      temperature: randomFloat(18, 35),
      humidity: randomFloat(30, 90),
      pressure: randomFloat(990, 1030),
      timestamp: new Date().toISOString(),
    }, null, 2),
    format: 'json',
  }),
  'JSON Device': () => ({
    payload: JSON.stringify({
      deviceId: `device-${randomId()}`,
      status: randomBool() ? 'online' : 'offline',
      battery: randomInt(0, 100),
      firmware: `v${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 99)}`,
      rssi: randomInt(-100, -30),
      timestamp: new Date().toISOString(),
    }, null, 2),
    format: 'json',
  }),
  'JSON Event': () => ({
    payload: JSON.stringify({
      event: ['click', 'scroll', 'submit', 'load', 'error'][randomInt(0, 4)],
      userId: `user-${randomInt(1000, 9999)}`,
      page: ['home', 'dashboard', 'settings', 'profile'][randomInt(0, 3)],
      duration: randomInt(50, 5000),
      timestamp: new Date().toISOString(),
    }, null, 2),
    format: 'json',
  }),
  'Random String': () => ({
    payload: Array.from({ length: randomInt(10, 50) }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(randomInt(0, 35))
    ).join(''),
    format: 'plaintext',
  }),
  'Timestamp': () => ({
    payload: new Date().toISOString(),
    format: 'plaintext',
  }),
  'Counter': (() => {
    let count = 0;
    return () => ({
      payload: JSON.stringify({ count: ++count, timestamp: new Date().toISOString() }),
      format: 'json',
    });
  })(),
  'Boolean': () => ({
    payload: JSON.stringify({ value: randomBool() }),
    format: 'json',
  }),
  'Number': () => ({
    payload: String(randomFloat(-1000, 1000)),
    format: 'plaintext',
  }),
};

export function PublishComposer({
  connectionId,
  recentTopics = [],
  templates = [],
  onSaveTemplate,
}: PublishComposerProps) {
  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [qos, setQos] = useState(0);
  const [retain, setRetain] = useState(false);
  const [format, setFormat] = useState('plaintext');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showMockMenu, setShowMockMenu] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    try {
      setPublishing(true);
      setError(null);
      await Publish({ connectionId, topic: topic.trim(), payload, qos, retain });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  };

  const selectRecentTopic = (h: models.PublishHistoryHeader) => {
    setTopic(h.topic);
    setQos(h.qos);
    setRetain(h.retain);
    setShowRecent(false);
  };

  const loadTemplate = (t: PayloadTemplate) => {
    if (t.name) setTopic(t.name);
    setPayload(t.payload);
    setQos(t.qos);
    setRetain(t.retain);
    setShowTemplates(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    onSaveTemplate({
      name: templateName.trim(),
      payload,
      qos,
      retain,
    });
    setTemplateName('');
    setShowSaveDialog(false);
  };

  const generateMock = useCallback((type: string) => {
    const generator = MOCK_GENERATORS[type];
    if (!generator) return;
    const result = generator();
    setPayload(result.payload);
    setFormat(result.format);
    setShowMockMenu(false);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-300">Publish</h3>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMockMenu(!showMockMenu)}
              className="rounded px-2 py-1 text-xs text-amber-400 hover:bg-slate-800 hover:text-amber-300"
              title="Generate mock data"
            >
              Mock
            </button>
            {showMockMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMockMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                  {Object.keys(MOCK_GENERATORS).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => generateMock(type)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {templates.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                title="Load template"
              >
                Templates
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                    {templates.map((t, i) => (
                      <button
                        key={`${t.name}-${i}`}
                        type="button"
                        onClick={() => loadTemplate(t)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                      >
                        <span className="font-medium">{t.name}</span>
                        <span className="ml-2 text-xs text-slate-500">QoS {t.qos}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {onSaveTemplate && (
            <button
              type="button"
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Save as template"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div className="border-b border-slate-800 px-4 py-3 space-y-2">
          <Input
            label="Template Name"
            placeholder="My template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      )}

      <form onSubmit={handlePublish} className="flex flex-1 flex-col overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="relative">
          <Input
            label="Topic"
            placeholder="sensor/temperature"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          {recentTopics.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecent(!showRecent)}
              className="absolute right-0 top-0 text-xs text-cyan-400 hover:text-cyan-300"
            >
              Recent
            </button>
          )}
          {showRecent && recentTopics.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRecent(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                {recentTopics.map((h, i) => (
                  <button
                    key={`${h.topic}-${i}`}
                    type="button"
                    onClick={() => selectRecentTopic(h)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  >
                    <span className="font-mono">{h.topic}</span>
                    <span className="ml-2 text-xs text-slate-500">QoS {h.qos}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Select
              label="QoS"
              options={QOS_OPTIONS}
              value={String(qos)}
              onChange={(e) => setQos(parseInt(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Format"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
          </div>
        </div>

        <Textarea
          label="Payload"
          placeholder="Message payload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={8}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            label="Retain"
            checked={retain}
            onChange={(e) => setRetain(e.target.checked)}
          />
          <button
            type="submit"
            disabled={publishing || !topic.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Input, Select, Textarea, Checkbox } from '../../components/FormField';
import { Publish } from '../../../wailsjs/go/main/App';
import type { models } from '../../../wailsjs/go/models';

interface PublishComposerProps {
  connectionId: string;
  recentTopics?: models.PublishHistoryHeader[];
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

export function PublishComposer({ connectionId, recentTopics = [] }: PublishComposerProps) {
  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [qos, setQos] = useState(0);
  const [retain, setRetain] = useState(false);
  const [format, setFormat] = useState('plaintext');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);

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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-300">Publish</h3>
      </div>

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

import { useState } from 'react';
import { Input, Select, Checkbox } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { models } from '../../../wailsjs/go/models';
import type { UseSubscriptionsResult } from '../../hooks/useSubscriptions';

interface SubscriptionPanelProps {
  connectionId: string;
  subscriptions: UseSubscriptionsResult;
}

const QOS_OPTIONS = [
  { value: '0', label: 'QoS 0' },
  { value: '1', label: 'QoS 1' },
  { value: '2', label: 'QoS 2' },
];

export function SubscriptionPanel({ connectionId, subscriptions }: SubscriptionPanelProps) {
  const { subscriptions: subs, loading, error, add, remove } = subscriptions;
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [qos, setQos] = useState(0);
  const [alias, setAlias] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<models.Subscription | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    try {
      setSaving(true);
      await add({
        id: '',
        topic: topic.trim(),
        qos,
        alias: alias || undefined,
        connection_id: connectionId,
        disabled: false,
        retain: false,
        nl: false,
        rap: false,
        rh: 0,
        color: '',
        created_at: '',
      } as unknown as models.Subscription);
      setTopic('');
      setQos(0);
      setAlias('');
      setShowForm(false);
    } catch {
      // Error is set in the hook
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-300">
          Subscriptions ({subs.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-cyan-700"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="border-b border-slate-800 p-4 space-y-3">
          <Input
            label="Topic Filter"
            placeholder="sensor/+/temperature"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
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
              <Input
                label="Alias"
                placeholder="optional"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !topic.trim()}
            className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && subs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            Loading...
          </div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <p className="text-sm text-slate-500">No subscriptions</p>
            <p className="mt-1 text-xs text-slate-600">
              Click &quot;+ Add&quot; to subscribe to a topic
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {subs.map((sub) => (
              <li
                key={sub.id}
                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {sub.topic}
                  </p>
                  <p className="text-xs text-slate-500">
                    QoS {sub.qos}
                    {sub.alias ? ` · ${sub.alias}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(sub)}
                  className="rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  title="Unsubscribe"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Unsubscribe"
        message={`Remove subscription to "${deleteTarget?.topic}"?`}
        confirmLabel="Unsubscribe"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

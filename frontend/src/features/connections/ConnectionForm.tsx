import { useState } from 'react';
import { Tabs } from '../../components/Tabs';
import { Input, Select, Textarea, Checkbox } from '../../components/FormField';
import type { models } from '../../../wailsjs/go/models';

interface ConnectionFormProps {
  connection?: models.Connection | null;
  onSave: (conn: models.Connection) => Promise<void>;
  onCancel: () => void;
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'auth', label: 'Auth' },
  { id: 'connection', label: 'Connection' },
  { id: 'tls', label: 'TLS' },
  { id: 'mqtt5', label: 'MQTT 5' },
  { id: 'will', label: 'Will' },
];

const PROTOCOL_OPTIONS = [
  { value: 'mqtt', label: 'MQTT' },
  { value: 'mqtts', label: 'MQTTS' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'wss', label: 'Secure WebSocket' },
];

const MQTT_VERSION_OPTIONS = [
  { value: '3.1', label: 'MQTT 3.1' },
  { value: '3.1.1', label: 'MQTT 3.1.1' },
  { value: '5.0', label: 'MQTT 5.0' },
];

const QOS_OPTIONS = [
  { value: '0', label: '0 - At most once' },
  { value: '1', label: '1 - At least once' },
  { value: '2', label: '2 - Exactly once' },
];

const CERT_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'server', label: 'Server certificate' },
  { value: 'self', label: 'Self-signed' },
];

function defaultConnection(): models.Connection {
  return {
    id: '',
    name: '',
    client_id: `mqtts_${Date.now()}`,
    protocol: 'mqtt',
    host: 'localhost',
    port: 1883,
    mqtt_version: '3.1.1',
    clean: true,
    keepalive: 60,
    connect_timeout: 10,
    reconnect: false,
    reconnect_period: 4000,
    ssl: false,
    cert_type: '',
    reject_unauthorized: true,
    collection_id: null,
    created_at: '',
    updated_at: '',
  } as unknown as models.Connection;
}

export function ConnectionForm({ connection, onSave, onCancel }: ConnectionFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    if (connection) return { ...connection } as Record<string, unknown>;
    return { ...defaultConnection() } as Record<string, unknown>;
  });

  // Will state
  const [will, setWill] = useState({
    last_will_topic: '',
    last_will_payload: '',
    last_will_qos: 0,
    last_will_retain: false,
  });

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSave(form as unknown as models.Connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {connection ? 'Edit Connection' : 'New Connection'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure your MQTT broker connection
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="border-b border-slate-800 px-6 py-3">
        <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-lg space-y-4">
            <Input
              label="Connection Name"
              placeholder="My Broker"
              value={String(form.name ?? '')}
              onChange={(e) => updateField('name', e.target.value)}
            />
            <Input
              label="Client ID"
              placeholder="mqtts_client"
              value={String(form.client_id ?? '')}
              onChange={(e) => updateField('client_id', e.target.value)}
              description="Unique identifier for this MQTT client"
            />
            <Select
              label="Protocol"
              options={PROTOCOL_OPTIONS}
              value={String(form.protocol ?? 'mqtt')}
              onChange={(e) => {
                updateField('protocol', e.target.value);
                if (e.target.value === 'mqtts' || e.target.value === 'wss') {
                  updateField('ssl', true);
                }
              }}
            />
            <Input
              label="Host"
              placeholder="broker.example.com"
              value={String(form.host ?? '')}
              onChange={(e) => updateField('host', e.target.value)}
            />
            <Input
              label="Port"
              type="number"
              value={String(form.port ?? 1883)}
              onChange={(e) => updateField('port', parseInt(e.target.value) || 0)}
            />
            <Select
              label="MQTT Version"
              options={MQTT_VERSION_OPTIONS}
              value={String(form.mqtt_version ?? '3.1.1')}
              onChange={(e) => updateField('mqtt_version', e.target.value)}
            />
            {(form.protocol === 'ws' || form.protocol === 'wss') && (
              <Input
                label="WebSocket Path"
                placeholder="/mqtt"
                value={String(form.path ?? '/mqtt')}
                onChange={(e) => updateField('path', e.target.value)}
              />
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="max-w-lg space-y-4">
            <Input
              label="Username"
              placeholder="username"
              value={String(form.username ?? '')}
              onChange={(e) => updateField('username', e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="password"
              value={String(form.password ?? '')}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </div>
        )}

        {activeTab === 'connection' && (
          <div className="max-w-lg space-y-4">
            <Checkbox
              label="Clean Session"
              description="Start a new session or resume existing one"
              checked={!!form.clean}
              onChange={(e) => updateField('clean', e.target.checked)}
            />
            <Input
              label="Keep Alive (seconds)"
              type="number"
              value={String(form.keepalive ?? 60)}
              onChange={(e) => updateField('keepalive', parseInt(e.target.value) || 0)}
              description="Ping interval in seconds. 0 disables keepalive."
            />
            <Input
              label="Connect Timeout (seconds)"
              type="number"
              value={String(form.connect_timeout ?? 10)}
              onChange={(e) => updateField('connect_timeout', parseInt(e.target.value) || 0)}
            />
            <Checkbox
              label="Auto Reconnect"
              description="Automatically reconnect when connection is lost"
              checked={!!form.reconnect}
              onChange={(e) => updateField('reconnect', e.target.checked)}
            />
            {!!form.reconnect && (
              <Input
                label="Reconnect Period (ms)"
                type="number"
                value={String(form.reconnect_period ?? 4000)}
                onChange={(e) => updateField('reconnect_period', parseInt(e.target.value) || 0)}
              />
            )}
          </div>
        )}

        {activeTab === 'tls' && (
          <div className="max-w-lg space-y-4">
            <Checkbox
              label="Enable SSL/TLS"
              description="Use encrypted connection"
              checked={!!form.ssl}
              onChange={(e) => updateField('ssl', e.target.checked)}
            />
            {!!form.ssl && (
              <>
                <Select
                  label="Certificate Type"
                  options={CERT_TYPE_OPTIONS}
                  value={String(form.cert_type ?? '')}
                  onChange={(e) => updateField('cert_type', e.target.value)}
                />
                <Checkbox
                  label="Reject Unauthorized"
                  description="Verify server certificate against CA"
                  checked={!!form.reject_unauthorized}
                  onChange={(e) => updateField('reject_unauthorized', e.target.checked)}
                />
                <Textarea
                  label="CA Certificate (PEM)"
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={String(form.ca ?? '')}
                  onChange={(e) => updateField('ca', e.target.value)}
                  rows={4}
                />
                {form.cert_type === 'self' && (
                  <>
                    <Textarea
                      label="Client Certificate (PEM)"
                      placeholder="-----BEGIN CERTIFICATE-----"
                      value={String(form.cert ?? '')}
                      onChange={(e) => updateField('cert', e.target.value)}
                      rows={4}
                    />
                    <Textarea
                      label="Client Key (PEM)"
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      value={String(form.key ?? '')}
                      onChange={(e) => updateField('key', e.target.value)}
                      rows={4}
                    />
                  </>
                )}
                <Input
                  label="ALPN Protocols"
                  placeholder="mqtt, http/1.1"
                  value={String(form.alpn_protocols ?? '')}
                  onChange={(e) => updateField('alpn_protocols', e.target.value)}
                  description="Comma-separated list of ALPN protocols"
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'mqtt5' && (
          <div className="max-w-lg space-y-4">
            {form.mqtt_version !== '5.0' ? (
              <p className="text-sm text-slate-500">
                MQTT 5 properties are only available when using MQTT 5.0 protocol.
                Switch to MQTT 5.0 in the General tab.
              </p>
            ) : (
              <>
                <Input
                  label="Session Expiry Interval"
                  type="number"
                  placeholder="0"
                  value={String((form.mqtt5_properties as Record<string, unknown>)?.session_expiry_interval ?? '')}
                  onChange={(e) =>
                    updateField('mqtt5_properties', {
                      ...(form.mqtt5_properties as Record<string, unknown> ?? {}),
                      session_expiry_interval: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  description="Seconds until session expires. 0xFFFFFFFF = never expire."
                />
                <Input
                  label="Receive Maximum"
                  type="number"
                  placeholder="65535"
                  value={String((form.mqtt5_properties as Record<string, unknown>)?.receive_maximum ?? '')}
                  onChange={(e) =>
                    updateField('mqtt5_properties', {
                      ...(form.mqtt5_properties as Record<string, unknown> ?? {}),
                      receive_maximum: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  label="Maximum Packet Size"
                  type="number"
                  placeholder=""
                  value={String((form.mqtt5_properties as Record<string, unknown>)?.maximum_packet_size ?? '')}
                  onChange={(e) =>
                    updateField('mqtt5_properties', {
                      ...(form.mqtt5_properties as Record<string, unknown> ?? {}),
                      maximum_packet_size: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  label="Topic Alias Maximum"
                  type="number"
                  placeholder="0"
                  value={String((form.mqtt5_properties as Record<string, unknown>)?.topic_alias_maximum ?? '')}
                  onChange={(e) =>
                    updateField('mqtt5_properties', {
                      ...(form.mqtt5_properties as Record<string, unknown> ?? {}),
                      topic_alias_maximum: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  label="Authentication Method"
                  placeholder="SCRAM-SHA-256"
                  value={String((form.mqtt5_properties as Record<string, unknown>)?.authentication_method ?? '')}
                  onChange={(e) =>
                    updateField('mqtt5_properties', {
                      ...(form.mqtt5_properties as Record<string, unknown> ?? {}),
                      authentication_method: e.target.value,
                    })
                  }
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'will' && (
          <div className="max-w-lg space-y-4">
            <Input
              label="Will Topic"
              placeholder="status/offline"
              value={will.last_will_topic}
              onChange={(e) => setWill((prev) => ({ ...prev, last_will_topic: e.target.value }))}
            />
            <Textarea
              label="Will Payload"
              placeholder="Client disconnected"
              value={will.last_will_payload}
              onChange={(e) => setWill((prev) => ({ ...prev, last_will_payload: e.target.value }))}
              rows={3}
            />
            <Select
              label="Will QoS"
              options={QOS_OPTIONS}
              value={String(will.last_will_qos)}
              onChange={(e) =>
                setWill((prev) => ({ ...prev, last_will_qos: parseInt(e.target.value) }))
              }
            />
            <Checkbox
              label="Will Retain"
              description="Broker should retain the will message"
              checked={will.last_will_retain}
              onChange={(e) =>
                setWill((prev) => ({ ...prev, last_will_retain: e.target.checked }))
              }
            />
          </div>
        )}
      </div>
    </form>
  );
}

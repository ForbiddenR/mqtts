import { useState, useEffect, useMemo } from 'react';
import { ConnectionList } from './features/connections/ConnectionList';
import { ConnectionForm } from './features/connections/ConnectionForm';
import { ConnectionStatsPanel } from './features/connections/ConnectionStatsPanel';
import { SubscriptionPanel } from './features/subscriptions/SubscriptionPanel';
import { PublishComposer } from './features/publish/PublishComposer';
import { MessageTimeline } from './features/messages/MessageTimeline';
import { SettingsPage } from './features/settings/SettingsPage';
import { ImportExportPage } from './features/import-export/ImportExportPage';
import { useConnections } from './hooks/useConnections';
import { useMqttStatus } from './hooks/useMqttStatus';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useMessages } from './hooks/useMessages';
import { useSettings } from './hooks/useSettings';
import { useConnectionStats } from './hooks/useConnectionStats';
import type { PayloadTemplate } from './hooks/useSettings';
import { Greet } from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';

export default function App() {
  const connectionsResult = useConnections();
  const { connections } = connectionsResult;
  const settingsResult = useSettings();

  const connectionIds = useMemo(() => connections.map((c) => c.id), [connections]);
  const mqttResult = useMqttStatus(connectionIds);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'settings' | 'import-export'>('list');
  const [editing, setEditing] = useState<models.Connection | null>(null);
  const [rightPanel, setRightPanel] = useState<'publish' | 'stats'>('publish');
  const [greeting, setGreeting] = useState('');

  const selectedConn = useMemo(
    () => connections.find((c) => c.id === selectedId) ?? null,
    [connections, selectedId],
  );
  const selectedStatus = selectedId ? mqttResult.statuses[selectedId] : undefined;
  const isConnected = selectedStatus === 'connected';

  const subscriptions = useSubscriptions(selectedId);
  const messages = useMessages(selectedId);
  const connectionStats = useConnectionStats(selectedId);

  useEffect(() => {
    let isMounted = true;
    Greet('Phase 11')
      .then((msg) => {
        if (isMounted) setGreeting(msg);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Restore last selected connection from settings
  useEffect(() => {
    if (settingsResult.settings?.last_connection_id && !selectedId) {
      const lastId = settingsResult.settings.last_connection_id;
      // Only restore if the connection still exists
      if (connections.some((c) => c.id === lastId)) {
        setSelectedId(lastId);
      }
    }
  }, [settingsResult.settings, connections, selectedId]);

  // Persist selected connection ID to settings
  useEffect(() => {
    if (!settingsResult.settings || !settingsResult.save) return;
    const current = settingsResult.settings.last_connection_id;
    if (selectedId && selectedId !== current) {
      settingsResult.settings.last_connection_id = selectedId;
      settingsResult.save(settingsResult.settings).catch(() => {});
    }
  }, [selectedId, settingsResult.settings]);

  const handleNew = () => {
    setEditing(null);
    setView('form');
  };

  const handleEdit = (conn: models.Connection) => {
    setEditing(conn);
    setView('form');
  };

  const handleSave = async (conn: models.Connection) => {
    if (conn.id) {
      await connectionsResult.update(conn);
    } else {
      await connectionsResult.create(conn);
    }
    setView('list');
    setEditing(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditing(null);
  };

  const handleSaveTemplate = async (t: PayloadTemplate) => {
    if (!settingsResult.settings) return;
    const s = settingsResult.settings;
    s.payload_templates = [...(s.payload_templates ?? []), t];
    await settingsResult.save(s);
  };

  const templates = settingsResult.settings?.payload_templates ?? [];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">mqtts</p>
              <h1 className="mt-2 text-lg font-semibold text-white">MQTT workbench</h1>
            </div>
            <button
              type="button"
              onClick={() => setView(view === 'settings' ? 'list' : 'settings')}
              className={`rounded-lg p-2 transition ${
                view === 'settings'
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
              title="Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConnectionList
            connections={connectionsResult}
            mqtt={mqttResult}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setView('list'); }}
            onNew={handleNew}
            onEdit={handleEdit}
          />
        </div>

        <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setView(view === 'import-export' ? 'list' : 'import-export')}
            className={`rounded-lg p-1.5 transition ${
              view === 'import-export'
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-slate-600 hover:text-slate-400'
            }`}
            title="Import / Export"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'settings' ? (
          <SettingsPage settings={settingsResult} onClose={() => setView('list')} />
        ) : view === 'import-export' ? (
          <ImportExportPage onClose={() => setView('list')} onImportComplete={() => connectionsResult.reload()} />
        ) : view === 'form' ? (
          <ConnectionForm
            connection={editing}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : selectedConn && isConnected ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Subscription panel */}
            <div className="w-64 shrink-0 border-r border-slate-800">
              <SubscriptionPanel
                connectionId={selectedId!}
                subscriptions={subscriptions}
              />
            </div>

            {/* Center: Message timeline */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <MessageTimeline
                connectionId={selectedId!}
                messages={messages}
              />
            </div>

            {/* Right: Publish / Stats toggle */}
            <div className="w-80 shrink-0 border-l border-slate-800 flex flex-col">
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setRightPanel('publish')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    rightPanel === 'publish'
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanel('stats')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    rightPanel === 'stats'
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Stats
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {rightPanel === 'publish' ? (
                  <PublishComposer
                    connectionId={selectedId!}
                    recentTopics={[]}
                    templates={templates}
                    onSaveTemplate={handleSaveTemplate}
                  />
                ) : (
                  <ConnectionStatsPanel stats={connectionStats.stats} />
                )}
              </div>
            </div>
          </div>
        ) : selectedConn ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedConn.name || selectedConn.client_id}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedConn.protocol}://{selectedConn.host}:{selectedConn.port}
                </p>
              </div>
              <p className="text-sm text-slate-400">
                This connection is not active. Connect to start publishing and subscribing.
              </p>
              <button
                type="button"
                onClick={() => mqttResult.connect(selectedId!)}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Connect
              </button>
            </div>
            {greeting && <p className="mt-8 text-sm text-slate-600">{greeting}</p>}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 space-y-2 text-slate-500">
              <svg
                className="mx-auto h-12 w-12 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-sm">
                {connections.length === 0
                  ? 'No connections yet. Click "New Connection" to get started.'
                  : 'Select a connection from the sidebar or create a new one.'}
              </p>
            </div>
            {greeting && <p className="text-sm text-slate-600">{greeting}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

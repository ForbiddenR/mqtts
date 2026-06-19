import { useState, useEffect, useMemo } from 'react';
import { ConnectionList } from './features/connections/ConnectionList';
import { ConnectionForm } from './features/connections/ConnectionForm';
import { useConnections } from './hooks/useConnections';
import { useMqttStatus } from './hooks/useMqttStatus';
import { Greet } from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';

export default function App() {
  const connectionsResult = useConnections();
  const { connections } = connectionsResult;

  const connectionIds = useMemo(() => connections.map((c) => c.id), [connections]);
  const mqttResult = useMqttStatus(connectionIds);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<models.Connection | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    let isMounted = true;
    Greet('Phase 5')
      .then((msg) => {
        if (isMounted) setGreeting(msg);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">mqtts</p>
          <h1 className="mt-2 text-lg font-semibold text-white">MQTT workbench</h1>
          <p className="mt-1 text-sm text-slate-500">MQTT client for developers</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConnectionList
            connections={connectionsResult}
            mqtt={mqttResult}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={handleNew}
            onEdit={handleEdit}
          />
        </div>

        <div className="border-t border-slate-800 px-5 py-3">
          <p className="text-xs text-slate-600">
            {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'form' ? (
          <ConnectionForm
            connection={editing}
            onSave={handleSave}
            onCancel={handleCancel}
          />
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

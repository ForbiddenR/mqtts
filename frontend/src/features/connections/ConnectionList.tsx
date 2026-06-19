import { ConnectionListItem } from './ConnectionListItem';
import type { UseConnectionsResult } from '../../hooks/useConnections';
import type { UseMqttStatusResult } from '../../hooks/useMqttStatus';
import type { models } from '../../../wailsjs/go/models';

interface ConnectionListProps {
  connections: UseConnectionsResult;
  mqtt: UseMqttStatusResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (conn: models.Connection) => void;
}

export function ConnectionList({
  connections: { connections, loading, error, remove, duplicate },
  mqtt,
  selectedId,
  onSelect,
  onNew,
  onEdit,
}: ConnectionListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-300">Connections</h2>
        <button
          type="button"
          onClick={onNew}
          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-700"
        >
          + New
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading && connections.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            Loading...
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-500">No connections yet</p>
            <p className="mt-1 text-xs text-slate-600">
              Click &quot;+ New&quot; to create one
            </p>
          </div>
        ) : (
          connections.map((conn) => (
            <ConnectionListItem
              key={conn.id}
              connection={conn}
              status={mqtt.statuses[conn.id] || 'disconnected'}
              isSelected={conn.id === selectedId}
              onSelect={() => onSelect(conn.id)}
              onEdit={() => onEdit(conn)}
              onDuplicate={() => duplicate(conn)}
              onDelete={() => remove(conn.id)}
              onConnect={() => mqtt.connect(conn.id)}
              onDisconnect={() => mqtt.disconnect(conn.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

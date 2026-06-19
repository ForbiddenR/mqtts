import { useState } from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { models } from '../../../wailsjs/go/models';

interface ConnectionListItemProps {
  connection: models.Connection;
  status: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionListItem({
  connection,
  status,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onConnect,
  onDisconnect,
}: ConnectionListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isConnected = status === 'connected';
  const isBusy = status === 'connecting' || status === 'disconnecting';

  return (
    <>
      <div
        className={`group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
          isSelected
            ? 'bg-cyan-500/10 border border-cyan-500/30'
            : 'border border-transparent hover:bg-slate-800/60'
        }`}
        onClick={onSelect}
      >
        <ConnectionStatus status={status} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {connection.name || connection.client_id}
          </p>
          <p className="truncate text-xs text-slate-500">
            {connection.protocol}://{connection.host}:{connection.port}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {isConnected ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect();
              }}
              disabled={isBusy}
              className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              title="Disconnect"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConnect();
              }}
              disabled={isBusy}
              className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
              title="Connect"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
              title="More actions"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDuplicate();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Connection"
        message={`Are you sure you want to delete "${connection.name || connection.client_id}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

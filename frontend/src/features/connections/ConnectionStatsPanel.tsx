import type { ConnectionStats } from '../../hooks/useConnectionStats';

interface ConnectionStatsPanelProps {
  stats: ConnectionStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatUptime(connectedAt: string): string {
  const ms = Date.now() - new Date(connectedAt).getTime();
  if (ms < 0) return '—';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function ConnectionStatsPanel({ stats }: ConnectionStatsPanelProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-500">
        No connection active
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold text-slate-300">Connection Statistics</h3>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Messages Sent"
          value={stats.messagesSent.toLocaleString()}
          icon="↑"
          color="text-blue-400"
        />
        <StatCard
          label="Messages Received"
          value={stats.messagesReceived.toLocaleString()}
          icon="↓"
          color="text-emerald-400"
        />
        <StatCard
          label="Bytes Sent"
          value={formatBytes(stats.bytesSent)}
          icon="↑"
          color="text-blue-400"
        />
        <StatCard
          label="Bytes Received"
          value={formatBytes(stats.bytesReceived)}
          icon="↓"
          color="text-emerald-400"
        />
        <StatCard
          label="Latency (last)"
          value={stats.lastLatencyMs > 0 ? `${stats.lastLatencyMs.toFixed(1)} ms` : '—'}
          icon="⚡"
          color="text-amber-400"
        />
        <StatCard
          label="Latency (avg)"
          value={stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs.toFixed(1)} ms` : '—'}
          icon="⚡"
          color="text-amber-400"
        />
        {stats.connectedAt && (
          <StatCard
            label="Uptime"
            value={formatUptime(stats.connectedAt)}
            icon="⏱"
            color="text-cyan-400"
          />
        )}
        {stats.reconnectCount > 0 && (
          <StatCard
            label="Reconnects"
            value={String(stats.reconnectCount)}
            icon="↻"
            color="text-yellow-400"
          />
        )}
      </div>

      {stats.lastError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          <span className="font-medium">Last error:</span> {stats.lastError}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center gap-1.5">
        <span className={`text-sm ${color}`}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-200">{value}</p>
    </div>
  );
}

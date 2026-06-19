import { useRef, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { models } from '../../../wailsjs/go/models';
import type { UseMessagesResult } from '../../hooks/useMessages';

interface MessageTimelineProps {
  connectionId: string;
  messages: UseMessagesResult;
}

export function MessageTimeline({ connectionId, messages }: MessageTimelineProps) {
  const { messages: msgs, total, loading, error, loadMore, clearAll, hasMore } = messages;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchTopic, setSearchTopic] = useState('');

  // Auto-scroll to top when new messages arrive (messages are newest-first)
  useEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollTop < 50) {
      // Stay at top if already near top
    }
  }, [msgs.length]);

  const filtered = msgs.filter((m) => {
    if (filter === 'in' && m.out) return false;
    if (filter === 'out' && !m.out) return false;
    if (searchTopic && !m.topic.toLowerCase().includes(searchTopic.toLowerCase())) return false;
    return true;
  });

  const handleClear = async () => {
    await clearAll();
    setShowClearConfirm(false);
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const truncatePayload = (payload: string, maxLen = 200) => {
    if (payload.length <= maxLen) return payload;
    return payload.slice(0, maxLen) + '…';
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-300">
            Messages ({total})
          </h3>
          <div className="flex rounded-lg border border-slate-700 text-xs">
            {(['all', 'in', 'out'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 transition ${
                  filter === f
                    ? 'bg-slate-700 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in' ? 'Received' : 'Sent'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter topic..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
            title="Clear all messages"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading && msgs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            Loading messages...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <svg className="mx-auto h-10 w-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-2 text-sm text-slate-500">
              {msgs.length === 0 ? 'No messages yet' : 'No messages match the filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map((msg) => (
              <MessageItem key={msg.id} message={msg} formatTime={formatTime} truncatePayload={truncatePayload} />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="w-full py-3 text-center text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                {loading ? 'Loading...' : 'Load older messages'}
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear Messages"
        message={`Delete all ${total} messages for this connection?`}
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

function MessageItem({
  message,
  formatTime,
  truncatePayload,
}: {
  message: models.Message;
  formatTime: (ts: string) => string;
  truncatePayload: (p: string, max?: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group px-4 py-2.5 transition hover:bg-slate-800/30 cursor-pointer ${
        message.out ? 'border-l-2 border-l-blue-500/30' : 'border-l-2 border-l-emerald-500/30'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                message.out
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {message.out ? 'PUB' : 'RECV'}
            </span>
            <span className="truncate font-mono text-xs text-cyan-400">{message.topic}</span>
            <span className="text-[10px] text-slate-600">QoS {message.qos}</span>
            {message.retain && (
              <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[10px] text-amber-400">
                RET
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs text-slate-400 ${expanded ? '' : 'line-clamp-2'}`}>
            {expanded ? message.payload : truncatePayload(message.payload)}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-slate-600">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

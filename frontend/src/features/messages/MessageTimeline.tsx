import { useRef, useEffect, useState, useCallback } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { models } from '../../../wailsjs/go/models';
import type { UseMessagesResult } from '../../hooks/useMessages';

interface MessageTimelineProps {
  connectionId: string;
  messages: UseMessagesResult;
}

type DisplayMode = 'text' | 'json' | 'hex' | 'base64';

export function MessageTimeline({ connectionId, messages }: MessageTimelineProps) {
  const { messages: msgs, total, loading, error, loadMore, clearAll, hasMore } = messages;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchTopic, setSearchTopic] = useState('');
  const [qosFilter, setQosFilter] = useState<-1 | 0 | 1 | 2>(-1);
  const [retainFilter, setRetainFilter] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<models.Message | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('text');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollTop < 50) {
      // Stay at top if already near top
    }
  }, [msgs.length]);

  const filtered = msgs.filter((m) => {
    if (directionFilter === 'in' && m.out) return false;
    if (directionFilter === 'out' && !m.out) return false;
    if (searchTopic && !m.topic.toLowerCase().includes(searchTopic.toLowerCase())) return false;
    if (qosFilter >= 0 && m.qos !== qosFilter) return false;
    if (retainFilter && !m.retain) return false;
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

  const formatDateTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const truncatePayload = (payload: string, maxLen = 200) => {
    if (payload.length <= maxLen) return payload;
    return payload.slice(0, maxLen) + '…';
  };

  const formatPayload = useCallback((payload: string, mode: DisplayMode): string => {
    switch (mode) {
      case 'json': {
        try {
          return JSON.stringify(JSON.parse(payload), null, 2);
        } catch {
          return payload;
        }
      }
      case 'hex':
        return Array.from(new TextEncoder().encode(payload))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ');
      case 'base64':
        return btoa(payload);
      default:
        return payload;
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-slate-800 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Messages ({total})
            </h3>
            <div className="flex rounded-lg border border-slate-700 text-xs">
              {(['all', 'in', 'out'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDirectionFilter(f)}
                  className={`px-2.5 py-1 transition ${
                    directionFilter === f
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter topic..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <select
            value={qosFilter}
            onChange={(e) => setQosFilter(parseInt(e.target.value) as -1 | 0 | 1 | 2)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value={-1}>All QoS</option>
            <option value={0}>QoS 0</option>
            <option value={1}>QoS 1</option>
            <option value={2}>QoS 2</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={retainFilter}
              onChange={(e) => setRetainFilter(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            Retained
          </label>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Message list */}
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
              <MessageItem
                key={msg.id}
                message={msg}
                formatTime={formatTime}
                truncatePayload={truncatePayload}
                onSelect={setSelectedMsg}
              />
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

      {/* Message detail drawer */}
      {selectedMsg && (
        <div className="border-t border-slate-800 bg-slate-900 max-h-[50%] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  selectedMsg.out ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {selectedMsg.out ? 'PUB' : 'RECV'}
              </span>
              <span className="font-mono text-sm text-cyan-400">{selectedMsg.topic}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="hex">Hex</option>
                <option value="base64">Base64</option>
              </select>
              <button
                type="button"
                onClick={() => copyToClipboard(formatPayload(selectedMsg.payload, displayMode))}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMsg(null)}
                className="rounded-lg p-1 text-slate-500 hover:text-slate-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Topic</span>
                <p className="font-mono text-slate-200">{selectedMsg.topic}</p>
              </div>
              <div>
                <span className="text-slate-500">Time</span>
                <p className="text-slate-200">{formatDateTime(selectedMsg.created_at)}</p>
              </div>
              <div>
                <span className="text-slate-500">QoS</span>
                <p className="text-slate-200">{selectedMsg.qos}</p>
              </div>
              <div>
                <span className="text-slate-500">Retain</span>
                <p className="text-slate-200">{selectedMsg.retain ? 'Yes' : 'No'}</p>
              </div>
              {selectedMsg.content_type && (
                <div>
                  <span className="text-slate-500">Content Type</span>
                  <p className="text-slate-200">{selectedMsg.content_type}</p>
                </div>
              )}
              {selectedMsg.response_topic && (
                <div>
                  <span className="text-slate-500">Response Topic</span>
                  <p className="font-mono text-slate-200">{selectedMsg.response_topic}</p>
                </div>
              )}
              {selectedMsg.message_expiry_interval != null && (
                <div>
                  <span className="text-slate-500">Message Expiry</span>
                  <p className="text-slate-200">{selectedMsg.message_expiry_interval}s</p>
                </div>
              )}
              {selectedMsg.topic_alias != null && (
                <div>
                  <span className="text-slate-500">Topic Alias</span>
                  <p className="text-slate-200">{selectedMsg.topic_alias}</p>
                </div>
              )}
            </div>
            {selectedMsg.user_properties && Object.keys(selectedMsg.user_properties).length > 0 && (
              <div>
                <span className="text-xs text-slate-500">User Properties</span>
                <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950 p-2">
                  {Object.entries(selectedMsg.user_properties).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="font-mono text-cyan-400">{k}:</span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-500">Payload ({selectedMsg.payload.length} bytes)</span>
              <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">
                {formatPayload(selectedMsg.payload, displayMode)}
              </pre>
            </div>
          </div>
        </div>
      )}

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
  onSelect,
}: {
  message: models.Message;
  formatTime: (ts: string) => string;
  truncatePayload: (p: string, max?: number) => string;
  onSelect: (msg: models.Message) => void;
}) {
  return (
    <div
      className={`group px-4 py-2.5 transition hover:bg-slate-800/30 cursor-pointer ${
        message.out ? 'border-l-2 border-l-blue-500/30' : 'border-l-2 border-l-emerald-500/30'
      }`}
      onClick={() => onSelect(message)}
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
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {truncatePayload(message.payload)}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-slate-600">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

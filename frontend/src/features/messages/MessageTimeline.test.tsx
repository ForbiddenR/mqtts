import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageTimeline } from './MessageTimeline';
import type { UseMessagesResult } from '../../hooks/useMessages';

function makeMessages(overrides: Partial<UseMessagesResult> = {}): UseMessagesResult {
  return {
    messages: [],
    total: 0,
    loading: false,
    error: null,
    reload: vi.fn(),
    loadMore: vi.fn(),
    clearAll: vi.fn(),
    hasMore: false,
    ...overrides,
  };
}

const sampleMessages = [
  {
    id: '1',
    topic: 'sensor/temp',
    payload: '{"value": 23.5}',
    qos: 0,
    retain: false,
    out: false,
    connection_id: 'c1',
    created_at: '2026-06-19T12:00:00Z',
  },
  {
    id: '2',
    topic: 'sensor/humidity',
    payload: 'hello',
    qos: 1,
    retain: true,
    out: true,
    connection_id: 'c1',
    created_at: '2026-06-19T12:01:00Z',
  },
] as any[];

describe('MessageTimeline', () => {
  it('renders empty state', () => {
    render(
      <MessageTimeline connectionId="c1" messages={makeMessages()} />
    );
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('renders message count', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ messages: sampleMessages, total: 2 })}
      />
    );
    expect(screen.getByText('Messages (2)')).toBeInTheDocument();
  });

  it('renders message topics', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ messages: sampleMessages, total: 2 })}
      />
    );
    expect(screen.getByText('sensor/temp')).toBeInTheDocument();
    expect(screen.getByText('sensor/humidity')).toBeInTheDocument();
  });

  it('shows direction badges', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ messages: sampleMessages, total: 2 })}
      />
    );
    expect(screen.getByText('RECV')).toBeInTheDocument();
    expect(screen.getByText('PUB')).toBeInTheDocument();
  });

  it('shows retain badge', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ messages: sampleMessages, total: 2 })}
      />
    );
    expect(screen.getByText('RET')).toBeInTheDocument();
  });

  it('filters by direction', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ messages: sampleMessages, total: 2 })}
      />
    );

    // Click "Received" filter
    fireEvent.click(screen.getByText('Received'));
    expect(screen.getByText('sensor/temp')).toBeInTheDocument();
    expect(screen.queryByText('sensor/humidity')).not.toBeInTheDocument();

    // Click "Sent" filter
    fireEvent.click(screen.getByText('Sent'));
    expect(screen.queryByText('sensor/temp')).not.toBeInTheDocument();
    expect(screen.getByText('sensor/humidity')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ loading: true })}
      />
    );
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <MessageTimeline
        connectionId="c1"
        messages={makeMessages({ error: 'connection lost' })}
      />
    );
    expect(screen.getByText('connection lost')).toBeInTheDocument();
  });
});

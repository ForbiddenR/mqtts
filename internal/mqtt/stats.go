package mqtt

import (
	"sync/atomic"
	"time"
)

// ConnectionStats holds real-time statistics for an MQTT connection.
type ConnectionStats struct {
	ConnectionID   string  `json:"connectionId"`
	MessagesSent   int64   `json:"messagesSent"`
	MessagesRecv   int64   `json:"messagesReceived"`
	BytesSent      int64   `json:"bytesSent"`
	BytesRecv      int64   `json:"bytesReceived"`
	ConnectedAt    string  `json:"connectedAt,omitempty"`
	LastLatencyMs  float64 `json:"lastLatencyMs"`
	AvgLatencyMs   float64 `json:"avgLatencyMs"`
	LatencySamples int64   `json:"latencySamples"`
	LastError      string  `json:"lastError,omitempty"`
	ReconnectCount int     `json:"reconnectCount"`
}

// Stats tracks real-time connection statistics using atomic operations.
type Stats struct {
	messagesSent   atomic.Int64
	messagesRecv   atomic.Int64
	bytesSent      atomic.Int64
	bytesRecv      atomic.Int64
	connectedAt    time.Time
	lastLatencyMs  atomic.Int64 // stored as microseconds * 1000 for atomic access
	latencySumMs   atomic.Int64 // stored as microseconds for atomic access
	latencySamples atomic.Int64
	lastError      atomic.Value // string
	reconnectCount atomic.Int32
}

// NewStats creates a new Stats instance.
func NewStats() *Stats {
	return &Stats{}
}

// RecordSent increments sent counters.
func (s *Stats) RecordSent(bytes int64) {
	s.messagesSent.Add(1)
	s.bytesSent.Add(bytes)
}

// RecordReceived increments received counters.
func (s *Stats) RecordReceived(bytes int64) {
	s.messagesRecv.Add(1)
	s.bytesRecv.Add(bytes)
}

// RecordLatency records a latency sample in milliseconds.
func (s *Stats) RecordLatency(ms float64) {
	s.lastLatencyMs.Store(int64(ms * 1000))
	s.latencySumMs.Store(s.latencySumMs.Load() + int64(ms*1000))
	s.latencySamples.Add(1)
}

// RecordError stores the last error message.
func (s *Stats) RecordError(err string) {
	s.lastError.Store(err)
}

// RecordReconnect increments the reconnect counter.
func (s *Stats) RecordReconnect() {
	s.reconnectCount.Add(1)
}

// SetConnectedAt records when the connection was established.
func (s *Stats) SetConnectedAt(t time.Time) {
	s.connectedAt = t
}

// Snapshot returns a point-in-time copy of the stats.
func (s *Stats) Snapshot(connID string) ConnectionStats {
	samples := s.latencySamples.Load()
	var avgMs float64
	if samples > 0 {
		avgMs = float64(s.latencySumMs.Load()) / float64(samples) / 1000.0
	}

	lastErr, _ := s.lastError.Load().(string)

	var connectedAt string
	if !s.connectedAt.IsZero() {
		connectedAt = s.connectedAt.Format(time.RFC3339)
	}

	return ConnectionStats{
		ConnectionID:   connID,
		MessagesSent:   s.messagesSent.Load(),
		MessagesRecv:   s.messagesRecv.Load(),
		BytesSent:      s.bytesSent.Load(),
		BytesRecv:      s.bytesRecv.Load(),
		ConnectedAt:    connectedAt,
		LastLatencyMs:  float64(s.lastLatencyMs.Load()) / 1000.0,
		AvgLatencyMs:   avgMs,
		LatencySamples: samples,
		LastError:      lastErr,
		ReconnectCount: int(s.reconnectCount.Load()),
	}
}

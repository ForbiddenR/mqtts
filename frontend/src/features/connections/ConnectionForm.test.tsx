import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionForm } from './ConnectionForm';

describe('ConnectionForm', () => {
  it('renders new connection form', () => {
    render(<ConnectionForm onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('New Connection')).toBeInTheDocument();
    expect(screen.getByText('Connection Name')).toBeInTheDocument();
    expect(screen.getByText('Client ID')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Port')).toBeInTheDocument();
    expect(screen.getByDisplayValue('localhost')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1883')).toBeInTheDocument();
  });

  it('renders edit connection form', () => {
    const conn = {
      id: 'test-id',
      name: 'My Broker',
      client_id: 'my-client',
      host: 'broker.example.com',
      port: 1883,
      protocol: 'mqtt',
      mqtt_version: '3.1.1',
      clean: true,
      keepalive: 60,
      connect_timeout: 10,
      reconnect: false,
      reconnect_period: 4000,
      ssl: false,
      cert_type: '',
      reject_unauthorized: true,
    } as any;

    render(<ConnectionForm connection={conn} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Edit Connection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Broker')).toBeInTheDocument();
    expect(screen.getByDisplayValue('broker.example.com')).toBeInTheDocument();
  });

  it('switches tabs', () => {
    render(<ConnectionForm onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Auth'));
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Connection'));
    expect(screen.getByText(/Keep Alive/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('TLS'));
    expect(screen.getByText(/Enable SSL\/TLS/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<ConnectionForm onSave={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when form is submitted', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ConnectionForm onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalled();
  });
});

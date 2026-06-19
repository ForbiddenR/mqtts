import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the connection management shell', async () => {
    render(<App />);

    expect(screen.getByText('MQTT workbench')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('+ New')).toBeInTheDocument();
    expect(screen.getByText('0 connections')).toBeInTheDocument();
  });

  it('shows empty state when no connections exist', async () => {
    render(<App />);

    expect(
      await screen.findByText(/No connections yet/)
    ).toBeInTheDocument();
  });
});

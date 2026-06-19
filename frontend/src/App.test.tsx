import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Phase 2 bootstrap shell', async () => {
    render(<App />);

    expect(screen.getByText('MQTT workbench')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connections/i })).toBeInTheDocument();
    expect(await screen.findByText(/mqtts frontend is running/i)).toBeInTheDocument();
  });
});

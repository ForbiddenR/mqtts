import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublishComposer } from './PublishComposer';

describe('PublishComposer', () => {
  it('renders publish form', () => {
    render(<PublishComposer connectionId="c1" />);

    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(screen.getByText('QoS')).toBeInTheDocument();
    expect(screen.getByText('Retain')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('has a disabled publish button when topic is empty', () => {
    render(<PublishComposer connectionId="c1" />);

    const btn = screen.getByRole('button', { name: 'Publish' });
    expect(btn).toBeDisabled();
  });

  it('shows templates button when templates provided', () => {
    const templates = [
      { name: 'Temperature', payload: '{"temp": 0}', qos: 0, retain: false },
    ];

    render(<PublishComposer connectionId="c1" templates={templates} />);

    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('shows save button when onSaveTemplate provided', () => {
    render(<PublishComposer connectionId="c1" onSaveTemplate={vi.fn()} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('opens save dialog when save is clicked', () => {
    render(<PublishComposer connectionId="c1" onSaveTemplate={vi.fn()} />);

    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByText('Template Name')).toBeInTheDocument();
    expect(screen.getByText('Save Template')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    render(<PublishComposer connectionId="c1" />);
    expect(screen.getByPlaceholderText('sensor/temperature')).toBeInTheDocument();
  });
});

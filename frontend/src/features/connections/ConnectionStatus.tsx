interface ConnectionStatusProps {
  status: string;
  size?: 'sm' | 'md';
}

export function ConnectionStatus({ status, size = 'sm' }: ConnectionStatusProps) {
  const sizeClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  const colorClass = (() => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-400 shadow-emerald-400/50';
      case 'connecting':
        return 'bg-yellow-400 shadow-yellow-400/50 animate-pulse';
      case 'disconnecting':
        return 'bg-yellow-400 shadow-yellow-400/50 animate-pulse';
      case 'error':
        return 'bg-red-400 shadow-red-400/50';
      default:
        return 'bg-slate-500';
    }
  })();

  return (
    <span
      className={`inline-block rounded-full shadow-sm ${sizeClass} ${colorClass}`}
      title={status}
    />
  );
}

import { useState, useRef } from 'react';
import { ExportAll, ImportAll } from '../../../wailsjs/go/main/App';

interface ImportExportPageProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportExportPage({ onClose, onImportComplete }: ImportExportPageProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    connectionsImported: number;
    subscriptionsImported: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      const json = await ExportAll();

      // Download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mqtts-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setImportResult(null);

      const text = await file.text();
      const result = await ImportAll(text);
      setImportResult(result);
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Import / Export</h2>
          <p className="mt-1 text-sm text-slate-500">Migrate data or create backups</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {importResult && (
        <div className="mx-6 mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <p className="font-medium">Import complete</p>
          <p className="mt-1">
            {importResult.connectionsImported} connection(s) and{' '}
            {importResult.subscriptionsImported} subscription(s) imported.
          </p>
          {importResult.errors && importResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-300">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg space-y-8">
          {/* Export */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-sm font-semibold text-slate-300">Export</h3>
            <p className="mt-2 text-sm text-slate-500">
              Download all connections and subscriptions as a JSON file. Passwords and sensitive data are included — store the file securely.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export All Data'}
            </button>
          </section>

          {/* Import */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-sm font-semibold text-slate-300">Import</h3>
            <p className="mt-2 text-sm text-slate-500">
              Import connections and subscriptions from a previously exported JSON file. Existing data is not modified — imported items are added as new entries.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import from File'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

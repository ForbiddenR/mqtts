import { useEffect, useMemo, useState } from 'react';
import { Greet } from '../wailsjs/go/main/App';

type NavItem = {
  id: string;
  label: string;
  description: string;
};

const navItems: NavItem[] = [
  {
    id: 'connections',
    label: 'Connections',
    description: 'Create and manage saved MQTT broker profiles.',
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Inspect received and published MQTT messages.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure themes, reconnect behavior, and app preferences.',
  },
  {
    id: 'import-export',
    label: 'Import/Export',
    description: 'Migrate MQTTX data and manage local backups.',
  },
  {
    id: 'logs',
    label: 'Logs',
    description: 'Review connection, broker, and application diagnostics.',
  },
];

function App() {
  const [activeId, setActiveId] = useState(navItems[0].id);
  const [greeting, setGreeting] = useState('Connecting to Go backend...');

  const activeItem = useMemo(
    () => navItems.find((item) => item.id === activeId) ?? navItems[0],
    [activeId],
  );

  useEffect(() => {
    let isMounted = true;

    Greet('World')
      .then((message) => {
        if (isMounted) {
          setGreeting(message);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setGreeting(error instanceof Error ? error.message : 'Failed to call Go backend');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900/80">
        <div className="border-b border-slate-800 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">mqtts</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">MQTT workbench</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Phase 2 bootstrap shell for the Wails desktop rewrite.
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.id === activeId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={`mt-1 block text-xs ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                  {item.description}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-8">
          <div>
            <p className="text-sm text-slate-500">Current workspace</p>
            <h2 className="text-lg font-semibold text-white">{activeItem.label}</h2>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Bootstrap ready
          </span>
        </header>

        <section className="flex-1 overflow-auto p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">Placeholder</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">{activeItem.label}</h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                {activeItem.description} This panel reserves the route and layout area for the
                upcoming MQTT implementation phases.
              </p>

              <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-semibold text-slate-300">Frontend/backend bridge smoke test</p>
                <p className="mt-3 rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm text-emerald-300">
                  {greeting}
                </p>
              </div>
            </article>

            <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">Phase 2 scope</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>• Wails v2 app shell</li>
                <li>• React 19 + TypeScript + Vite</li>
                <li>• Tailwind CSS styling</li>
                <li>• Bun package scripts</li>
                <li>• Go bridge smoke test</li>
              </ul>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

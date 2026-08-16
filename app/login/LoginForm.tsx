'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LoginFormProps {
  redirectPath: string;
}

export default function LoginForm({ redirectPath }: LoginFormProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSession({ isAdmin: true, username });
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || 'Login fehlgeschlagen');
      }
    } catch (loginError) {
      console.error('Login error:', loginError);
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-page min-h-[calc(100vh-4rem)]">
      <div className="grid min-h-[min(44rem,calc(100vh-8rem))] overflow-hidden border border-[var(--border-default)] bg-[var(--card-bg)] lg:grid-cols-[minmax(0,1fr)_30rem]">
        <section className="hidden bg-[var(--brand-navy)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">PokéTool Verwaltung</p>
            <h1 className="mt-5 max-w-xl font-[var(--font-display)] text-6xl font-black uppercase leading-[0.9] tracking-[-0.055em]">
              Das Spiel im Blick. Die Verwaltung im Griff.
            </h1>
          </div>
          <div className="border-t border-white/25 pt-5 text-sm text-white/70">
            Teams, Routen, Runs und Spielstände an einem Ort verwalten.
          </div>
        </section>

        <section className="flex items-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full">
            <div className="border-l-4 border-[var(--brand-red)] pl-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--brand-red)]">Admin</p>
              <h2 className="mt-1 font-[var(--font-display)] text-4xl font-black uppercase tracking-[-0.04em] text-[var(--foreground)]">
                Anmelden
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Melde dich an, um PokéTool zu verwalten.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="border-l-4 border-red-600 bg-red-500/10 p-4" role="alert">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-xs font-black uppercase tracking-[0.09em] text-[var(--text-secondary)]">
                    Benutzername
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="relative block min-h-12 w-full appearance-none border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20 sm:text-sm"
                    placeholder="Benutzername"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-black uppercase tracking-[0.09em] text-[var(--text-secondary)]">
                    Passwort
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="relative block min-h-12 w-full appearance-none border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20 sm:text-sm"
                    placeholder="Passwort"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="app-action-primary min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Anmelden…' : 'Anmelden'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Mobile Bottom Navigation
 * Keeps the four primary destinations visible and groups secondary actions.
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJson } from '@/lib/fetchJson';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/lib/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const primaryItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
      </svg>
    ),
  },
  {
    href: '/pokeroute',
    label: 'Routen',
    icon: (
      <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s7-4.4 7-11a7 7 0 10-14 0c0 6.6 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    ),
  },
  {
    href: '/pokeradar',
    label: 'Vergleich',
    icon: (
      <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h11m0 0-3-3m3 3-3 3M16 17H5m0 0 3 3m-3-3 3-3" />
      </svg>
    ),
  },
  {
    href: '/tabelle',
    label: 'Tabelle',
    icon: (
      <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18M8 4v16" />
      </svg>
    ),
  },
];

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { spriteMode, toggleSpriteMode } = useSpriteMode();
  const { isAdmin, setSession } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const closeMore = useCallback((restoreFocus = true) => {
    setMoreOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => moreButtonRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!moreOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const sheet = sheetRef.current;
    const initialTarget = sheet?.querySelector<HTMLElement>('[data-sheet-close]');
    window.requestAnimationFrame(() => initialTarget?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMore();
        return;
      }

      if (event.key !== 'Tab' || !sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMore, moreOpen]);

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
      setSession({ isAdmin: false, username: null });
      closeMore(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const moreIsActive = pathname === '/statistik'
    || pathname === '/streams'
    || pathname?.startsWith('/admin')
    || pathname === '/login';

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={() => closeMore()}
          />
          <div
            id="mobile-more-dialog"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] max-h-[min(72vh,34rem)] overflow-y-auto border-t-4 border-[var(--brand-navy)] bg-[var(--card-bg)] px-4 pb-5 pt-3 text-[var(--foreground)] shadow-[0_-18px_55px_rgba(0,0,0,0.28)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-default)]" aria-hidden="true" />
            <div className="flex min-h-11 items-center justify-between">
              <h2 id="mobile-more-title" className="text-lg font-semibold">Mehr</h2>
              <button
                data-sheet-close
                type="button"
                onClick={() => closeMore()}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-[var(--background-tertiary)]"
                aria-label="Mehr-Menü schließen"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <Link
                href="/statistik"
                onClick={() => closeMore(false)}
                aria-current={isActive('/statistik') ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 border-b border-[var(--border-default)] px-2 text-sm font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] ${
                  isActive('/statistik')
                    ? 'text-[var(--brand-red)]'
                    : 'text-[var(--foreground)]'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19V9m7 10V5m7 14v-7" />
                </svg>
                Statistik
              </Link>
              <Link
                href="/streams"
                onClick={() => closeMore(false)}
                aria-current={isActive('/streams') ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 border-b border-[var(--border-default)] px-2 text-sm font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] ${
                  isActive('/streams')
                    ? 'text-[var(--brand-red)]'
                    : 'text-[var(--foreground)]'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Streams
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => closeMore(false)}
                  aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}
                  className={`flex min-h-12 items-center gap-3 border-b border-[var(--border-default)] px-2 text-sm font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] ${
                    pathname?.startsWith('/admin')
                      ? 'text-[var(--brand-red)]'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
              )}
            </div>

            <div className="mt-4 border-t border-[var(--border-default)] pt-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Darstellung</p>
              <button
                type="button"
                onClick={toggleSpriteMode}
                aria-pressed={spriteMode === 'animated'}
                className="mt-2 flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-[var(--background-tertiary)]"
              >
                <span className="flex items-center gap-3">
                  {spriteMode === 'animated' ? (
                    <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  Pokémon-Bilder
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{spriteMode === 'animated' ? 'Animiert' : 'Statisch'}</span>
              </button>
              <div className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium">
                <span>Farbschema</span>
                <div className="[&_button]:min-h-11 [&_button]:min-w-11">
                  <ThemeToggle />
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--border-default)] pt-4">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-12 w-full rounded-xl px-3 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-[var(--background-tertiary)]"
                >
                  Abmelden
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => closeMore(false)}
                  aria-current={pathname === '/login' ? 'page' : undefined}
                  className={`flex min-h-12 items-center rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    pathname === '/login'
                      ? 'bg-blue-600 text-white'
                      : 'text-[var(--foreground)] active:bg-[var(--background-tertiary)]'
                  }`}
                >
                  Anmelden
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Hauptnavigation mobil"
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--border-default)] bg-[var(--background)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex h-16 items-stretch">
          {primaryItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  active ? 'text-[var(--brand-red)]' : 'text-[var(--text-secondary)] active:bg-[var(--background-tertiary)]'
                }`}
              >
                {item.icon}
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-controls="mobile-more-dialog"
            aria-label={moreIsActive ? 'Mehr, aktueller Bereich' : 'Mehr'}
            className={`relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
              moreOpen || moreIsActive
                ? 'text-[var(--brand-red)]'
                : 'text-[var(--text-secondary)] active:bg-[var(--background-tertiary)]'
            }`}
          >
            <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="5" cy="12" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="19" cy="12" r="1.75" />
            </svg>
            <span>Mehr</span>
            {moreIsActive && !moreOpen && (
              <span className="absolute right-[calc(50%-15px)] top-2 h-2 w-2 rounded-full bg-[var(--brand-red)] ring-2 ring-[var(--background)]" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { fetchJson } from '@/lib/fetchJson';
import ThemeToggle from './ThemeToggle';

const coreNavItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/pokeroute', label: 'Routen' },
  { href: '/pokeradar', label: 'Vergleich' },
  { href: '/tabelle', label: 'Tabelle' },
  { href: '/statistik', label: 'Statistik' },
  { href: '/streams', label: 'Streams' },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, setSession } = useAuth();
  const { spriteMode, toggleSpriteMode } = useSpriteMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isStreamsPage = pathname === '/streams';
  const [navHidden, setNavHidden] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNavHidden(true), 5000);
  }, []);

  const showNav = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setNavHidden(false);
  }, []);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    if (isStreamsPage) {
      startHideTimer();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      resetTimer = setTimeout(() => setNavHidden(false), 0);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [isStreamsPage, startHideTimer]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
      setSession({ isAdmin: false, username: null });
      setMobileOpen(false);
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

  const navItems = isAdmin
    ? [...coreNavItems, { href: '/admin', label: 'Admin' } as const]
    : coreNavItems;

  return (
    <>
      {isStreamsPage ? (
        <div
          className="fixed left-0 top-0 z-30 hidden h-3 w-full md:block"
          onMouseEnter={showNav}
        />
      ) : null}

      <nav
        aria-label="Hauptnavigation"
        className={`${isStreamsPage ? 'fixed w-full' : 'sticky'} top-0 z-40 hidden border-b border-[var(--border-default)] bg-[var(--background)] transition-transform duration-300 md:block ${isStreamsPage && navHidden ? '-translate-y-full' : 'translate-y-0'}`}
        onMouseEnter={isStreamsPage ? showNav : undefined}
        onMouseLeave={isStreamsPage ? startHideTimer : undefined}
      >
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-stretch px-5 lg:px-8">
          <Link
            href="/"
            className="mr-5 flex shrink-0 items-center gap-2.5 text-[var(--foreground)] transition-opacity hover:opacity-75 lg:mr-9"
          >
            <Image src="/pokeball.svg" alt="" width={30} height={30} priority />
            <span className="text-[1.2rem] font-black tracking-[-0.04em]">PokéTool</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-stretch" role="list">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center px-2.5 font-[Arial_Narrow,Roboto_Condensed,var(--font-inter),sans-serif] text-[0.72rem] font-black uppercase tracking-[0.015em] transition-colors lg:px-4 lg:text-[0.78rem] ${active ? 'text-[var(--brand-red)]' : 'text-[var(--foreground)] hover:text-[var(--brand-red)]'}`}
                >
                  {item.label}
                  {active ? <span className="absolute inset-x-2.5 bottom-0 h-[3px] bg-[var(--brand-red)] lg:inset-x-4" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2 border-l border-[var(--border-default)] pl-3">
            <div className="[&_button]:min-h-9 [&_button]:rounded-sm [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2 [&_button]:shadow-none">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={toggleSpriteMode}
              className="hidden min-h-9 items-center gap-1.5 border border-[var(--border-default)] px-2 text-[0.7rem] font-extrabold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] xl:flex"
              title={spriteMode === 'animated' ? 'Animierte Sprites aktiv' : 'Statische Sprites aktiv'}
              aria-label={spriteMode === 'animated' ? 'Zu statischen Sprites wechseln' : 'Zu animierten Sprites wechseln'}
              aria-pressed={spriteMode === 'animated'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {spriteMode === 'animated' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2 1.6-1.6a2 2 0 012.8 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                )}
              </svg>
              {spriteMode === 'animated' ? 'GIF' : 'Statisch'}
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-9 px-2.5 text-xs font-bold text-[var(--foreground)] transition-colors hover:text-[var(--brand-red)]"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className="app-action min-h-9 px-3">Login</Link>
            )}
          </div>
        </div>
      </nav>

      <header className="sticky top-0 z-40 flex h-[58px] items-center justify-between border-b border-[var(--border-default)] bg-[var(--background)] px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2 text-[var(--foreground)]">
          <Image src="/pokeball.svg" alt="" width={28} height={28} priority />
          <span className="text-lg font-black tracking-[-0.04em]">PokéTool</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center text-[var(--foreground)]"
          aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-panel"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
      </header>

      {mobileOpen ? (
        <div id="mobile-navigation-panel" className="fixed inset-0 top-[58px] z-[65] overflow-y-auto bg-[var(--background)] px-4 pb-24 pt-4 md:hidden">
          <nav aria-label="Erweiterte Hauptnavigation" className="border-t-4 border-[var(--brand-navy)]">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-12 items-center justify-between border-b border-[var(--border-default)] px-2 font-[Arial_Narrow,Roboto_Condensed,var(--font-inter),sans-serif] text-lg font-black uppercase ${active ? 'text-[var(--brand-red)]' : 'text-[var(--foreground)]'}`}
                >
                  {item.label}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </nav>
          <div className="app-toolbar mt-6 flex-wrap justify-start">
            <button type="button" className="app-action" onClick={toggleSpriteMode}>
              Sprites: {spriteMode === 'animated' ? 'Animiert' : 'Statisch'}
            </button>
            <div className="[&_button]:min-h-10 [&_button]:rounded-sm [&_button]:shadow-none">
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-5">
            {isAdmin ? (
              <button type="button" onClick={handleLogout} className="app-action w-full">Abmelden</button>
            ) : (
              <Link href="/login" className="app-action app-action-primary w-full">Anmelden</Link>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

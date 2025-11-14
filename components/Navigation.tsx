'use client';

/**
 * Navigations-Komponente
 * Zeigt die Hauptnavigation mit Admin-Link (nur wenn eingeloggt)
 */

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/fetchJson';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth-Status prüfen
  useEffect(() => {
    let cancelled = false;
    
    fetchJson<{ isAdmin?: boolean }>('/api/auth/status')
      .then(data => {
        if (!cancelled) {
          setIsAdmin(data.isAdmin || false);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Error checking auth status:', err);
          setLoading(false);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
      setIsAdmin(false);
      router.push('/pokeroute');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/pokeroute" className="flex items-center hover:opacity-80 transition">
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg" 
                alt="Poké Ball" 
                width={32}
                height={32}
                priority
              />
            </Link>

            <div
              className={`${
                mobileOpen ? 'flex' : 'hidden'
              } flex-col space-y-2 md:flex md:flex-row md:space-x-4 md:space-y-0 w-full md:w-auto md:items-center`}
            >
              <Link
                href="/pokeroute"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/pokeroute')
                    ? 'bg-red-800 text-white'
                    : 'hover:bg-red-500'
                }`}
              >
                Routen
              </Link>
              <Link
                href="/pokeradar"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/pokeradar')
                    ? 'bg-red-800 text-white'
                    : 'hover:bg-red-500'
                }`}
              >
                Vergleich
              </Link>
              <Link
                href="/tabelle"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/tabelle')
                    ? 'bg-red-800 text-white'
                    : 'hover:bg-red-500'
                }`}
              >
                Tabelle
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md transition ${
                    pathname?.startsWith('/admin')
                      ? 'bg-red-800 text-white'
                      : 'hover:bg-red-500'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Navigation umschalten"
                onClick={() => setMobileOpen((prev) => !prev)}
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {isAdmin ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 rounded-md transition text-sm"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 rounded-md transition text-sm"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-red-700 bg-opacity-95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-red-500">
            <span className="text-xl font-bold">Navigation</span>
            <button
              type="button"
              className="p-2 rounded-md bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Menü schließen"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 text-lg font-semibold">
            <Link
              href="/pokeroute"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-md ${
                isActive('/pokeroute') ? 'bg-red-900 text-white' : 'hover:bg-red-600'
              }`}
            >
              Routen
            </Link>
            <Link
              href="/pokeradar"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-md ${
                isActive('/pokeradar') ? 'bg-red-900 text-white' : 'hover:bg-red-600'
              }`}
            >
              Vergleich
            </Link>
            <Link
              href="/tabelle"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-md ${
                isActive('/tabelle') ? 'bg-red-900 text-white' : 'hover:bg-red-600'
              }`}
            >
              Tabelle
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-md ${
                  pathname?.startsWith('/admin')
                    ? 'bg-red-900 text-white'
                    : 'hover:bg-red-600'
                }`}
              >
                Admin
              </Link>
            )}
            {!loading && (
              <div className="pt-4 border-t border-red-600">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 bg-red-900 text-white rounded-md"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 bg-red-900 text-white rounded-md text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}


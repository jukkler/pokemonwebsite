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
    <nav className="bg-white border-b border-gray-200 shadow-sm hidden md:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/pokeroute" className="flex items-center hover:opacity-80 transition">
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg" 
                alt="Poké Ball" 
                width={32}
                height={32}
                priority
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">PokéTool</span>
            </Link>

            <div className="flex items-center space-x-1">
              <Link
                href="/pokeroute"
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isActive('/pokeroute')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Routen
              </Link>
              <Link
                href="/pokeradar"
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isActive('/pokeradar')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Vergleich
              </Link>
              <Link
                href="/tabelle"
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isActive('/tabelle')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tabelle
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    pathname?.startsWith('/admin')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {isAdmin ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
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
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <span className="text-xl font-semibold text-gray-900">Navigation</span>
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menü schließen"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                className="h-6 w-6 text-gray-700"
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
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <Link
              href="/pokeroute"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium ${
                isActive('/pokeroute') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Routen
            </Link>
            <Link
              href="/pokeradar"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium ${
                isActive('/pokeradar') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Vergleich
            </Link>
            <Link
              href="/tabelle"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium ${
                isActive('/tabelle') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tabelle
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium ${
                  pathname?.startsWith('/admin')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            )}
            {!loading && (
              <div className="pt-4 border-t border-gray-200">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-medium"
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


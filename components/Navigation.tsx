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

            <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
              <Link
                href="/pokeroute"
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
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/pokeradar')
                    ? 'bg-red-800 text-white'
                    : 'hover:bg-red-500'
                }`}
              >
                Vergleich
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
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
    </nav>
  );
}


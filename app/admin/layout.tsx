/**
 * Admin Layout
 * Überprüft Auth-Status und zeigt Admin-Navigation
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import './admin.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-seitige Auth-Prüfung
  let authorized = false;
  
  try {
    authorized = await isAdmin();
  } catch (error) {
    console.error('Error checking admin status in layout:', error);
    redirect('/login?redirect=/admin');
  }
  
  if (!authorized) {
    redirect('/login?redirect=/admin');
  }

  return (
    <div className="admin-surface min-h-screen bg-[var(--background)]">
      {/* Admin Navigation */}
      <div className="admin-subnav" aria-label="Admin-Bereiche">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-12 items-center gap-1 overflow-x-auto py-1">
            <span className="admin-subnav-label">Verwaltung</span>
            <Link
              href="/admin"
              className="admin-subnav-link"
            >
              Übersicht
            </Link>
            <Link
              href="/admin/players"
              className="admin-subnav-link"
            >
              Spieler
            </Link>
            <Link
              href="/admin/pokemon"
              className="admin-subnav-link"
            >
              Pokémon-Cache
            </Link>
            <Link
              href="/admin/gamesaves"
              className="admin-subnav-link"
            >
              Spielstände
            </Link>
            <Link
              href="/admin/import"
              className="admin-subnav-link"
            >
              CSV-Import
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}


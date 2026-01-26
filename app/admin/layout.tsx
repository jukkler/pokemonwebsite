/**
 * Admin Layout
 * Überprüft Auth-Status und zeigt Admin-Navigation
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';

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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <div className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 py-3 overflow-x-auto">
            <Link
              href="/admin"
              className="whitespace-nowrap hover:text-gray-300 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/players"
              className="whitespace-nowrap hover:text-gray-300 transition"
            >
              Spieler
            </Link>
            <Link
              href="/admin/pokemon"
              className="whitespace-nowrap hover:text-gray-300 transition"
            >
              Pokemon-Cache
            </Link>
            <Link
              href="/admin/gamesaves"
              className="whitespace-nowrap hover:text-gray-300 transition"
            >
              💾 Spielstände
            </Link>
            <Link
              href="/admin/import"
              className="whitespace-nowrap hover:text-gray-300 transition"
            >
              📤 CSV Import
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}


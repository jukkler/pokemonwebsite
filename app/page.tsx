import Dashboard from '@/components/dashboard/Dashboard';
import { loadDashboardData } from './dashboard-data';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    return await loadDashboardData();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return null;
  }
}

export default async function Home() {
  const data = await getDashboardData();
  if (data) return <Dashboard data={data} />;

  return (
    <div className="app-page">
      <section className="app-section px-4 py-10 text-center" role="alert">
        <h1 className="app-section-title">Dashboard nicht verfügbar</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Die Live-Daten konnten gerade nicht geladen werden. Bitte versuche es gleich noch einmal.
        </p>
      </section>
    </div>
  );
}

import Link from 'next/link';
import type { DashboardData } from '@/app/dashboard-data';

function formatDuration(durationMs: number) {
  const totalMinutes = Math.floor(durationMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} T ${hours} Std ${minutes} Min`;
  if (hours > 0) return `${hours} Std ${minutes} Min`;
  return `${minutes} Min`;
}

function statusTone(status: NonNullable<DashboardData['run']>['status']) {
  if (status === 'paused') return 'paused';
  if (status === 'won') return 'complete';
  if (status === 'lost') return 'danger';
  return 'active';
}

export default function DashboardHeader({ data }: { data: DashboardData }) {
  return (
    <header className="dashboard-header app-page-header">
      <div className="dashboard-title-block">
        <span className="dashboard-index" aria-hidden="true">01</span>
        <h1>Dashboard</h1>
      </div>

      {data.run ? (
        <div className="dashboard-run-line" aria-label="Aktueller Run">
          <strong>{data.run.gameName}</strong>
          <span aria-hidden="true">•</span>
          <strong>Run #{data.run.number}</strong>
          <span className="app-status" data-tone={statusTone(data.run.status)}>
            {data.run.statusLabel}
          </span>
          <span aria-hidden="true">•</span>
          <span>{formatDuration(data.run.durationMs)}</span>
        </div>
      ) : (
        <p className="dashboard-run-line">Kein Run vorhanden</p>
      )}

      <div className="dashboard-header-actions">
        <Link href="/pokeroute" className="dashboard-route-link">
          Routen
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

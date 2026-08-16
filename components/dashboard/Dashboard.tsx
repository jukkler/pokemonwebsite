import type { DashboardData } from '@/app/dashboard-data';
import BadgeProgressBand from './BadgeProgressBand';
import DashboardHeader from './DashboardHeader';
import OverallBalance from './OverallBalance';
import TeamSheets from './TeamSheets';

export default function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="app-page dashboard-page">
      <DashboardHeader data={data} />
      <BadgeProgressBand data={data} />
      <TeamSheets players={data.players} />
      <OverallBalance
        totals={data.totals}
        playerTotals={data.playerTotals}
        gameName={data.run?.gameName ?? null}
      />
    </div>
  );
}

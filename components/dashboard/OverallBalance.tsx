import type { DashboardData } from '@/app/dashboard-data';
import type { CSSProperties } from 'react';

interface OverallBalanceProps {
  totals: DashboardData['totals'];
  playerTotals: DashboardData['playerTotals'];
  gameName: string | null;
}

export default function OverallBalance({ totals, playerTotals, gameName }: OverallBalanceProps) {
  const values = [
    { label: 'Runs', value: totals.wins + totals.losses, tone: 'default' },
    { label: 'Siege', value: totals.wins, tone: 'default' },
    { label: 'Niederlagen', value: totals.losses, tone: 'red' },
    { label: 'Siegquote', value: totals.winRate === null ? '–' : `${totals.winRate}%`, tone: 'default' },
    { label: 'K.O.', value: totals.knockedOut, tone: 'red' },
    { label: 'Nicht gefangen', value: totals.notCaught, tone: 'gold' },
  ];

  return (
    <section className="dashboard-balance app-band app-band--navy" aria-labelledby="overall-balance-title">
      <div className="dashboard-balance-overview">
        <h2 id="overall-balance-title">
          Gesamtbilanz
          {gameName ? <small>{gameName}</small> : null}
        </h2>
        <dl>
          {values.map(item => (
            <div key={item.label}>
              <dd data-tone={item.tone}>{item.value}</dd>
              <dt>{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="dashboard-player-balance">
        <h3>Spielerbilanz der abgeschlossenen Runs</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Spieler</th>
              <th scope="col">K.O.</th>
              <th scope="col">Nicht gefangen</th>
              <th scope="col">Runs verloren</th>
              <th scope="col">Niederlagenquote</th>
            </tr>
          </thead>
          <tbody>
            {playerTotals.map(player => (
              <tr key={player.id} style={{ '--player-accent': player.color } as CSSProperties}>
                <th scope="row">
                  <strong>{player.name}</strong>
                  <small>{player.runs} {player.runs === 1 ? 'Run' : 'Runs'}</small>
                </th>
                <td>{player.knockedOut}</td>
                <td>{player.notCaught}</td>
                <td>{player.losses}</td>
                <td>{player.lossRate === null ? '–' : `${player.lossRate}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {playerTotals.length === 0 ? (
          <p className="dashboard-player-balance-empty">Noch keine Spielerstatistiken erfasst.</p>
        ) : null}
      </div>
    </section>
  );
}

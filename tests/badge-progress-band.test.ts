import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DashboardData } from '@/app/dashboard-data';
import BadgeProgressBand from '@/components/dashboard/BadgeProgressBand';
import { AuthProvider, type AdminSessionState } from '@/lib/contexts/AuthContext';
import { getBadgesForGame } from '@/lib/badge-data';

const TestAuthProvider = AuthProvider as ComponentType<{
  initialSession: AdminSessionState;
}>;

function createDashboardData(gameVersionKey: string): DashboardData {
  const badges = getBadgesForGame(gameVersionKey) ?? [];

  return {
    run: {
      id: 1,
      number: 1,
      gameName: 'Pokémon Schwarz 2',
      gameVersionKey,
      status: 'active',
      statusLabel: 'Aktiv',
      badgesEarned: 3,
      durationMs: 0,
    },
    badges: badges.map((badge, index) => ({
      key: badge.key,
      name: badge.nameDe,
      leader: badge.leaderDe,
      imagePath: badge.imagePath,
      earned: index < 3,
      position: index + 1,
    })),
    players: [],
    playerTotals: [],
    totals: {
      wins: 0,
      losses: 0,
      winRate: null,
      knockedOut: 0,
      notCaught: 0,
    },
  };
}

describe('BadgeProgressBand', () => {
  it('zeigt für jeden Orden das spielspezifische Level-Cap an', () => {
    const markup = renderToStaticMarkup(
      createElement(
        TestAuthProvider,
        { initialSession: { isAdmin: false, username: null } },
        createElement(BadgeProgressBand, { data: createDashboardData('black2') }),
      ),
    );

    expect(markup.match(/dashboard-badge-level-cap/g)).toHaveLength(8);
    for (const levelCap of [13, 18, 24, 30, 33, 39, 48, 51]) {
      expect(markup).toContain(`LV ${levelCap}`);
      expect(markup).toContain(`Level-Cap ${levelCap}`);
    }
  });
});

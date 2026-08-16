import type { GameEvent } from '@/lib/event-store';

export type EventTone =
  | 'ko'
  | 'escape'
  | 'badge'
  | 'team'
  | 'box'
  | 'failure'
  | 'victory';
export type EventVisualKind = 'pokemon' | 'badge' | 'team' | 'failure' | 'victory';

export interface EventPresentation {
  tone: EventTone;
  visual: EventVisualKind;
  eyebrow: string;
  headline: string;
  declaration: string;
  details: string[];
}

function pokemonName(event: GameEvent): string {
  return event.data.pokemonNameGerman || event.data.pokemonName || 'Pokémon';
}

export function getEventPresentation(event: GameEvent): EventPresentation {
  switch (event.type) {
    case 'pokemon_ko':
      return {
        tone: 'ko',
        visual: 'pokemon',
        eyebrow: 'NUZLOCKE-VERLUST',
        headline: pokemonName(event),
        declaration: 'IST GEFALLEN',
        details: [
          event.data.playerName ? `K.O. durch ${event.data.playerName}` : '',
          event.data.routeName || '',
        ].filter(Boolean),
      };
    case 'pokemon_not_caught':
      return {
        tone: 'escape',
        visual: 'pokemon',
        eyebrow: 'BEGEGNUNG BEENDET',
        headline: pokemonName(event),
        declaration: 'IST ENTKOMMEN',
        details: [
          event.data.playerName ? `Nicht gefangen von ${event.data.playerName}` : '',
          event.data.routeName || '',
        ].filter(Boolean),
      };
    case 'badge_unlocked':
      return {
        tone: 'badge',
        visual: 'badge',
        eyebrow: 'MEILENSTEIN ERREICHT',
        headline: event.data.badgeName || 'Orden erhalten',
        declaration:
          event.data.badgeNumber != null
            ? `${event.data.badgeNumber}. ORDEN GESICHERT`
            : 'ORDEN GESICHERT',
        details: [],
      };
    case 'team_link_added': {
      const memberCount = event.data.teamMembers?.length ?? 0;
      return {
        tone: 'team',
        visual: 'team',
        eyebrow: 'TEAM-AUFSTELLUNG AKTUALISIERT',
        headline: 'LINK BERUFEN',
        declaration: event.data.teamSlot
          ? `AUF TEAMPLATZ ${event.data.teamSlot}`
          : 'INS TEAM',
        details: [
          event.data.routeName || '',
          memberCount > 0 ? `${memberCount} Pokémon ziehen gemeinsam ins Team` : '',
        ].filter(Boolean),
      };
    }
    case 'team_link_boxed': {
      const memberCount = event.data.teamMembers?.length ?? 0;
      return {
        tone: 'box',
        visual: 'team',
        eyebrow: 'TEAM-AUFSTELLUNG AKTUALISIERT',
        headline: 'IN DIE BOX GELEGT',
        declaration: event.data.teamSlot
          ? `TEAMPLATZ ${event.data.teamSlot} IST WIEDER FREI`
          : 'LINK EINGELAGERT',
        details: [
          event.data.routeName || '',
          memberCount > 0
            ? `${memberCount} Pokémon wurden gemeinsam eingelagert`
            : '',
        ].filter(Boolean),
      };
    }
    case 'run_completed':
      return {
        tone: 'victory',
        visual: 'victory',
        eyebrow: 'CHALLENGE ABGESCHLOSSEN',
        headline: 'SIEG',
        declaration: event.data.runNumber
          ? `RUN #${event.data.runNumber} GEWONNEN`
          : 'RUN GEWONNEN',
        details: [],
      };
    case 'run_failed':
      return {
        tone: 'failure',
        visual: 'failure',
        eyebrow: 'CHALLENGE BEENDET',
        headline: 'GESCHEITERT',
        declaration: event.data.runNumber
          ? `RUN #${event.data.runNumber}`
          : 'RUN BEENDET',
        details: [],
      };
  }
}

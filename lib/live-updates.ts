export const LIVE_UPDATE_TOPICS = [
  'encounters',
  'routes',
  'runs',
  'players',
  'streams',
  'pokemon',
] as const;

export type LiveUpdateTopic = (typeof LIVE_UPDATE_TOPICS)[number];

export type LiveRevisions = Record<LiveUpdateTopic, string>;

export const ZERO_LIVE_REVISIONS: LiveRevisions = {
  encounters: '0',
  routes: '0',
  runs: '0',
  players: '0',
  streams: '0',
  pokemon: '0',
};

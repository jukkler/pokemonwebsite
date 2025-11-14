export interface PokemonSyncProgress {
  current: number;
  total: number;
  isRunning: boolean;
  lastUpdate: number;
}

let progressState: PokemonSyncProgress = {
  current: 0,
  total: 0,
  isRunning: false,
  lastUpdate: 0,
};

export function startPokemonSync(total: number) {
  progressState = {
    current: 0,
    total,
    isRunning: true,
    lastUpdate: Date.now(),
  };
}

export function updatePokemonSync(current: number, total?: number) {
  if (!progressState.isRunning) return;
  progressState = {
    ...progressState,
    current,
    total: total ?? progressState.total,
    lastUpdate: Date.now(),
  };
}

export function finishPokemonSync() {
  progressState = {
    ...progressState,
    current: progressState.total,
    isRunning: false,
    lastUpdate: Date.now(),
  };
}

export function getPokemonSyncProgress(): PokemonSyncProgress {
  return progressState;
}



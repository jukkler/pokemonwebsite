'use client';

import { useState } from 'react';
import type { RunOutcome } from '@/lib/run-lifecycle';
import EncounterAdminDialog from './EncounterAdminDialog';

interface RunCompletionDialogProps {
  isOpen: boolean;
  run: {
    runNumber: number;
    badgesEarned: number;
    gameVersion: { name: string } | null;
  } | null;
  players: { id: number; name: string }[];
  busy?: boolean;
  onClose: () => void;
  onConfirm: (outcome: RunOutcome, loserPlayerName?: string) => void;
}

export default function RunCompletionDialog({
  isOpen,
  run,
  players,
  busy = false,
  onClose,
  onConfirm,
}: RunCompletionDialogProps) {
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [loserPlayerName, setLoserPlayerName] = useState('');

  const canConfirm =
    outcome === 'completed' ||
    (outcome === 'failed' && loserPlayerName.length > 0);

  return (
    <EncounterAdminDialog
      isOpen={isOpen}
      title="Run abschließen"
      description="Wähle das tatsächliche Ergebnis. Der aktuelle Team- und Begegnungsstand wird dabei als Historie gesichert."
      onClose={onClose}
      busy={busy}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-2 font-medium text-[var(--foreground)] hover:bg-[var(--background-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            data-testid="run-completion-confirm"
            onClick={() => {
              if (outcome && canConfirm) {
                onConfirm(
                  outcome,
                  outcome === 'failed' ? loserPlayerName : undefined,
                );
              }
            }}
            disabled={busy || !canConfirm}
            className={`min-h-11 rounded-lg border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              outcome === 'failed'
                ? 'border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
            }`}
          >
            {busy
              ? 'Wird gespeichert…'
              : outcome === 'completed'
                ? 'Sieg speichern'
                : outcome === 'failed'
                  ? 'Niederlage speichern'
                  : 'Ergebnis wählen'}
          </button>
        </>
      }
    >
      {run && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[var(--border-default)] py-4 text-sm">
          <div>
            <dt className="text-[var(--text-tertiary)]">Run</dt>
            <dd className="mt-1 font-semibold text-[var(--foreground)]">
              #{run.runNumber}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-tertiary)]">Spiel</dt>
            <dd className="mt-1 font-semibold text-[var(--foreground)]">
              {run.gameVersion?.name ?? 'Nicht festgelegt'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-tertiary)]">Orden</dt>
            <dd className="mt-1 font-semibold text-[var(--foreground)]">
              {run.badgesEarned} von 8
            </dd>
          </div>
        </dl>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[var(--foreground)]">
          Ergebnis
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            data-testid="run-outcome-completed"
            aria-pressed={outcome === 'completed'}
            onClick={() => {
              setOutcome('completed');
              setLoserPlayerName('');
            }}
            disabled={busy}
            className={`min-h-24 border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 ${
              outcome === 'completed'
                ? 'border-emerald-500 bg-emerald-500/15'
                : 'border-[var(--border-default)] bg-[var(--background-secondary)] hover:border-emerald-500/50'
            }`}
          >
            <span className="block font-semibold text-emerald-400">
              Run gewonnen
            </span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">
              Erfolgreich abgeschlossen
            </span>
          </button>
          <button
            type="button"
            data-testid="run-outcome-failed"
            aria-pressed={outcome === 'failed'}
            onClick={() => setOutcome('failed')}
            disabled={busy}
            className={`min-h-24 border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 ${
              outcome === 'failed'
                ? 'border-red-500 bg-red-500/15'
                : 'border-[var(--border-default)] bg-[var(--background-secondary)] hover:border-red-500/50'
            }`}
          >
            <span className="block font-semibold text-red-400">
              Run verloren
            </span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">
              Der Versuch ist gescheitert
            </span>
          </button>
        </div>
      </fieldset>

      {outcome === 'failed' && (
        <div>
          <label
            htmlFor="run-loser"
            className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
          >
            Wer hat verloren? <span aria-hidden="true">*</span>
          </label>
          <select
            id="run-loser"
            data-testid="run-completion-loser"
            required
            value={loserPlayerName}
            onChange={(event) => setLoserPlayerName(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">Spieler auswählen</option>
            {players.map((player) => (
              <option key={player.id} value={player.name}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {outcome === 'completed' && run && run.badgesEarned < 8 && (
        <p
          role="status"
          className="border-l-2 border-amber-400 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
        >
          Dieser Run hat erst {run.badgesEarned} von 8 Orden. Du kannst den Sieg
          trotzdem speichern, falls eure Regeln ein anderes Ziel vorsehen.
        </p>
      )}
    </EncounterAdminDialog>
  );
}

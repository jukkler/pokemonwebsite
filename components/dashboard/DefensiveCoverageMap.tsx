import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { DashboardPlayer, DashboardPokemon } from '@/app/dashboard-data';
import {
  describeDefensiveMultiplier,
  formatDefensiveMultiplier,
  getDefensiveCoverageKind,
  typeAbbreviations,
} from '@/lib/defensive-coverage';
import { getTypeColor } from '@/lib/design-tokens';
import {
  allPokemonTypes,
  getDefenseMultiplier,
  getGermanTypeName,
} from '@/lib/typeEffectiveness';

const legend = [
  { multiplier: 0, label: 'Immun' },
  { multiplier: 0.25, label: 'Stark resistent' },
  { multiplier: 0.5, label: 'Resistent' },
  { multiplier: 1, label: 'Neutral' },
  { multiplier: 2, label: 'Schwach' },
  { multiplier: 4, label: 'Kritisch' },
];

function getDisplayName(pokemon: DashboardPokemon) {
  return pokemon.nickname ?? pokemon.nameGerman ?? pokemon.name;
}

function PokemonLabel({ pokemon }: { pokemon: DashboardPokemon }) {
  const displayName = getDisplayName(pokemon);
  const species = pokemon.nameGerman ?? pokemon.name;

  return (
    <div className="dashboard-defense-map-pokemon">
      <Image
        src={pokemon.spriteUrl ?? '/pokeball.svg'}
        alt=""
        width={36}
        height={36}
        sizes="36px"
      />
      <span>
        <strong>{displayName}</strong>
        <small>
          {pokemon.nickname ? `${species} · ` : ''}
          {pokemon.types.map(getGermanTypeName).join(' / ')}
        </small>
      </span>
    </div>
  );
}

export default function DefensiveCoverageMap({ player }: { player: DashboardPlayer }) {
  return (
    <div className="dashboard-defense-map">
      {player.team.length > 0 ? (
        <div
          className="dashboard-defense-map-scroll"
          role="region"
          aria-label={`Defensive Coverage von ${player.name}, horizontal scrollbar`}
          tabIndex={0}
        >
          <table className="dashboard-defense-map-table">
            <caption className="sr-only">
              Schadensmultiplikatoren der 18 Angriffstypen gegen jedes Pokémon im Team von {player.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Team-Pokémon</th>
                {allPokemonTypes.map(type => (
                  <th
                    key={type}
                    scope="col"
                    style={{ '--type-accent': getTypeColor(type) } as CSSProperties}
                  >
                    <abbr
                      className="dashboard-defense-type-icon"
                      title={getGermanTypeName(type)}
                    >
                      <Image
                        src={`/icons/types/${type}.svg`}
                        alt=""
                        width={16}
                        height={16}
                        sizes="16px"
                      />
                      <span className="sr-only">
                        {getGermanTypeName(type)} ({typeAbbreviations[type]})
                      </span>
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {player.team.map(pokemon => (
                <tr key={pokemon.id}>
                  <th scope="row"><PokemonLabel pokemon={pokemon} /></th>
                  {allPokemonTypes.map(attackType => {
                    const multiplier = getDefenseMultiplier(pokemon.types, attackType);
                    const kind = getDefensiveCoverageKind(multiplier);
                    const typeLabel = getGermanTypeName(attackType);

                    return (
                      <td
                        key={attackType}
                        data-kind={kind}
                        aria-label={`${getDisplayName(pokemon)} gegen ${typeLabel}: ${describeDefensiveMultiplier(multiplier)}`}
                        title={`${typeLabel}: ${describeDefensiveMultiplier(multiplier)}`}
                      >
                        {formatDefensiveMultiplier(multiplier)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="dashboard-empty-state">Noch keine Pokémon in den Teams.</p>
      )}

      <div className="dashboard-defense-map-legend" aria-label="Schadensmultiplikatoren">
        {legend.map(item => (
          <span key={item.multiplier}>
            <b data-kind={getDefensiveCoverageKind(item.multiplier)}>
              {formatDefensiveMultiplier(item.multiplier)}
            </b>
            {item.label}
          </span>
        ))}
      </div>
      <p className="dashboard-method-note">
        Berechnet ausschließlich aus den Typen. Fähigkeiten, Items und kampfspezifische Effekte sind nicht berücksichtigt.
      </p>
    </div>
  );
}

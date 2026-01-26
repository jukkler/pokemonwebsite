/**
 * PokemonSwapDialog Komponente
 * Modal zum Tauschen eines Pokemon mit Suchfeld und Autocomplete
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Dialog, { DialogActions } from './ui/Dialog';
import { filterPokemonBySearch } from '@/lib/team-utils';
import type { PokemonListItem } from '@/lib/types';

interface PokemonSwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPokemonId: number) => void;
  currentPokemon?: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    spriteUrl?: string | null;
  };
  pokemon: PokemonListItem[];
  isLoading?: boolean;
}

export default function PokemonSwapDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPokemon,
  pokemon,
  isLoading = false,
}: PokemonSwapDialogProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonListItem | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchValue('');
      setSelectedPokemon(null);
      setShowDropdown(false);
      // Focus input after a short delay
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPokemon = filterPokemonBySearch(pokemon, searchValue);

  const handleSelectPokemon = (p: PokemonListItem) => {
    setSelectedPokemon(p);
    setSearchValue(p.nameGerman || p.name);
    setShowDropdown(false);
  };

  const handleConfirm = () => {
    if (selectedPokemon) {
      onConfirm(selectedPokemon.id);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    setSelectedPokemon(null);
    setShowDropdown(value.length > 0);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Pokemon tauschen"
      titleIcon="🔄"
      description={
        currentPokemon
          ? `Aktuell: #${currentPokemon.pokedexId} ${currentPokemon.nameGerman || currentPokemon.name}`
          : undefined
      }
      actions={
        <DialogActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmText="Tauschen"
          confirmVariant="primary"
          isLoading={isLoading}
          disabled={!selectedPokemon}
        />
      }
    >
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Neues Pokemon
        </label>
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => searchValue && setShowDropdown(true)}
          placeholder="Pokemon suchen..."
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />

        {/* Autocomplete Dropdown */}
        {showDropdown && filteredPokemon.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredPokemon.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPokemon(p)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition flex items-center gap-2 disabled:opacity-50"
              >
                <span className="text-gray-500 w-12">#{p.pokedexId}</span>
                <span className="font-medium">{p.nameGerman || p.name}</span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchValue && filteredPokemon.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500">Kein Pokemon gefunden</p>
          </div>
        )}
      </div>

      {/* Selected Pokemon Preview */}
      {selectedPokemon && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Ausgewaehlt:</span> #{selectedPokemon.pokedexId}{' '}
            {selectedPokemon.nameGerman || selectedPokemon.name}
          </p>
        </div>
      )}
    </Dialog>
  );
}

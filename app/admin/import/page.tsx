'use client';

import { useState } from 'react';

interface ImportResult {
  message: string;
  details: {
    routesCreated: number;
    pokemonSynced: number;
    encountersCreated: number;
    errors?: string[];
  };
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : 'Unbekannter Fehler';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Bitte wähle eine CSV-Datei aus');
      return;
    }

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import/csv', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as ImportResult & { error?: string };

      if (res.ok) {
        setResult({
          message: data.message,
          details: data.details,
        });
      } else {
        setError(data.error || 'Fehler beim Importieren');
      }
    } catch (err) {
      setError(`Netzwerkfehler: ${getErrorMessage(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (format: 'standard' | 'pivot') => {
    let csvContent = '';
    
    if (format === 'standard') {
      csvContent = `Route,Spieler,Pokemon,Nickname
Route 201,Lukas,Bidiza,
Route 201,Timo,Staralili,Tweety
Route 202,Lukas,25,Pikachu
Zweiblattdorf,Thorben,Bisasam,Planty`;
    } else {
      csvContent = `Route;Thorben;Lukas;Timo
Starter;Kryppuk;Glaziola;Bojelin
Route 201;Staralili;Bidiza;Staraptor
Route 202;Ponita;Bamelin;Plinfa`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pokemon_import_${format}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">CSV Import</h1>
      <p className="text-gray-600 mb-8">
        Importiere Routen und Pokémon-Begegnungen aus einer CSV-Datei.
        Fehlende Pokémon werden automatisch von der PokeAPI synchronisiert.
      </p>

      {/* CSV-Format Anleitung */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">📋 CSV-Format</h2>
        
        <div className="space-y-6">
          {/* Format 1: Pivot */}
          <div className="bg-white rounded-lg p-4 border border-blue-300">
            <h3 className="font-bold text-blue-900 mb-2">✅ Format 1: Pivot (Empfohlen - wie deine CSV)</h3>
            <p className="text-sm text-blue-700 mb-3">
              Jede Zeile ist eine Route, jede Spalte ist ein Spieler. Trennzeichen: <strong>Semikolon (;)</strong>
            </p>
            <pre className="bg-blue-100 p-4 rounded-lg text-sm overflow-x-auto">
{`Route;Thorben;Lukas;Timo
Starter;Kryppuk;Glaziola;Bojelin
Route 201;Staralili;Bidiza;Staraptor
Route 202;Ponita;Bamelin;Plinfa`}
            </pre>
            <button
              onClick={() => downloadTemplate('pivot')}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
            >
              📥 Pivot-Vorlage herunterladen
            </button>
          </div>

          {/* Format 2: Standard */}
          <div className="bg-white rounded-lg p-4 border border-blue-300">
            <h3 className="font-bold text-blue-900 mb-2">Format 2: Standard (Zeilenweise)</h3>
            <p className="text-sm text-blue-700 mb-3">
              Jede Zeile ist ein Encounter. Trennzeichen: <strong>Komma (,)</strong>
            </p>
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Spalten:</h4>
              <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                <li><code className="bg-blue-100 px-2 py-1 rounded">Route</code> - Name der Route</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">Spieler</code> - Name des Spielers</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">Pokemon</code> - Name oder Pokédex-ID</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">Nickname</code> (optional) - Spitzname</li>
              </ul>
            </div>
            <pre className="bg-blue-100 p-4 rounded-lg text-sm overflow-x-auto">
{`Route,Spieler,Pokemon,Nickname
Route 201,Lukas,Bidiza,
Route 201,Timo,Staralili,Tweety
Route 202,Lukas,25,Pikachu
Zweiblattdorf,Thorben,Bisasam,Planty`}
            </pre>
            <button
              onClick={() => downloadTemplate('standard')}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
            >
              📥 Standard-Vorlage herunterladen
            </button>
          </div>

          {/* Hinweise */}
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">💡 Wichtige Hinweise:</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
              <li>Spieler müssen <strong>vorher im Admin-Panel erstellt</strong> werden</li>
              <li>Routen werden automatisch erstellt, falls sie noch nicht existieren</li>
              <li>Pokémon können per <strong>Name</strong> (z.B. &quot;Bisasam&quot; oder &quot;Bulbasaur&quot;) oder <strong>Pokédex-ID</strong> (z.B. &quot;1&quot;) angegeben werden</li>
              <li><strong>Deutsche UND englische Namen</strong> werden unterstützt! 🇩🇪🇬🇧</li>
              <li>Fehlende Pokémon werden <strong>automatisch von PokeAPI</strong> geladen</li>
              <li>Pro Spieler und Route kann nur <strong>1 Pokémon</strong> gefangen werden</li>
              <li>Duplikate werden übersprungen</li>
              <li><strong>Leere Zellen</strong> im Pivot-Format werden ignoriert</li>
              <li>Beide Trennzeichen (<strong>;</strong> und <strong>,</strong>) werden automatisch erkannt</li>
              <li>⚠️ <strong>Hinweis:</strong> Deutsche Namen werden durch Suche gefunden - dies kann bei vielen unbekannten Pokémon etwas länger dauern</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload-Formular */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">CSV-Datei hochladen</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV-Datei auswählen
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Ausgewählt: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {importing ? '📤 Importiere...' : '📤 CSV importieren'}
          </button>
        </div>
      </div>

      {/* Ergebnis */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-900 mb-4">✅ Import erfolgreich</h3>
          <p className="text-green-800 mb-4">{result.message}</p>
          
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Routen erstellt:</span>
              <span className="font-bold text-green-700">{result.details.routesCreated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pokémon synchronisiert:</span>
              <span className="font-bold text-blue-700">{result.details.pokemonSynced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Encounters erstellt:</span>
              <span className="font-bold text-purple-700">{result.details.encountersCreated}</span>
            </div>
          </div>

          {result.details.errors && result.details.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-orange-800 mb-2">
                ⚠️ Warnungen ({result.details.errors.length}):
              </h4>
              <ul className="list-disc list-inside text-orange-700 text-sm space-y-1 max-h-40 overflow-y-auto">
                {result.details.errors.map((err: string, idx: number) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <a
              href="/admin/routes"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition text-sm"
            >
              Routen ansehen
            </a>
            <a
              href="/admin/encounters"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition text-sm"
            >
              Encounters ansehen
            </a>
            <a
              href="/pokeroute"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
            >
              Zur öffentlichen Ansicht
            </a>
          </div>
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-900 mb-2">❌ Fehler beim Import</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}


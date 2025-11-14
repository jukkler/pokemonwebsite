# Pokémon Playthrough Dokumentations-Website

Eine vollständige Web-Applikation zur Dokumentation eines Parallel-Playthroughs von Pokémon-Spielen mit speziellen Regeln.

## Features

- **Öffentliche Ansichten:**
  - **Pokeroute**: Übersicht der aktuellen Teams und aller gefangenen Pokémon pro Route und Spieler
  - **Pokeradar**: Vergleichstool mit Radar Chart für Pokémon-Stats (HP, Angriff, Verteidigung, etc.)

- **Admin-Panel:**
  - Spieler-Verwaltung (CRUD)
  - Routen-Verwaltung (CRUD)
  - Encounters-Verwaltung (Dokumentation gefangener Pokémon)
  - Team-Builder (6 Pokémon pro Spieler)
  - PokeAPI-Integration mit lokalem Cache

- **Technische Features:**
  - Session-basierte Authentifizierung mit iron-session
  - Offline-First: Alle Pokémon-Daten werden lokal gecacht
  - Responsive Design mit Tailwind CSS
  - TypeScript für Type-Safety
  - SQLite-Datenbank (einfach auf PostgreSQL umstellbar)

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Authentifizierung**: iron-session
- **Datenbank**: Prisma + SQLite
- **API**: PokeAPI (gecacht)

## Installation

### Voraussetzungen

- Node.js 18+ installiert
- npm oder yarn

### Setup-Schritte

1. **Repository klonen** (falls vorhanden) oder Projekt-Ordner öffnen:
   ```bash
   cd pokemonwebsite
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren:**
   
   Erstelle eine `.env` Datei im Root-Verzeichnis (falls noch nicht vorhanden):
   ```env
   DATABASE_URL="file:./dev.db"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="dein-sicheres-passwort"
   SESSION_SECRET="ein-mindestens-32-zeichen-langer-geheimer-schluessel"
   ```

   **Wichtig**: Ändere `ADMIN_PASSWORD` und `SESSION_SECRET` zu sicheren Werten!

4. **Datenbank initialisieren:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Development Server starten:**
   ```bash
   npm run dev
   ```

6. **Im Browser öffnen:**
   ```
   http://localhost:3000
   ```

## Erste Schritte

### 1. Als Admin einloggen

1. Navigiere zu `/login`
2. Melde dich mit den Credentials aus der `.env` an:
   - Username: `admin`
   - Passwort: Was du in `.env` gesetzt hast

### 2. Pokémon-Datenbank synchronisieren

1. Gehe zu `/admin/pokemon`
2. Klicke auf "Alle Pokémon synchronisieren (1-493)"
3. Warte 5-10 Minuten, bis alle Pokémon von Gen 1-4 geladen sind

### 3. Spieler erstellen

1. Gehe zu `/admin/players`
2. Füge Spieler mit Namen und Farbe hinzu (z.B. "Lukas" - Rot, "Sarah" - Blau)

### 4. Routen erstellen

1. Gehe zu `/admin/routes`
2. Erstelle Routen in der Spielreihenfolge (z.B. "Route 201", "Erzelingen", "Jubelstadt")
3. Setze die Reihenfolge-Nummer für die richtige Sortierung

### 5. Encounters dokumentieren

1. Gehe zu `/admin/encounters`
2. Wähle Spieler, Route und gefangenes Pokémon aus
3. Optional: Gib einen Spitznamen ein

### 6. Teams zusammenstellen

1. Gehe zu `/admin/team`
2. Wähle einen Spieler aus
3. Füge Pokémon aus den Encounters zu den 6 Team-Slots hinzu

### 7. Öffentliche Ansicht nutzen

- Besuche `/pokeroute` für die Übersicht aller Teams und Routen
- Besuche `/pokeradar` um Pokémon-Stats zu vergleichen

## Projektstruktur

```
pokemonwebsite/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Login/Logout/Status
│   │   ├── admin/        # Admin-CRUD-Endpunkte
│   │   ├── pokemon/      # Public: Pokémon-Liste
│   │   ├── players/      # Public: Spieler & Teams
│   │   └── routes/       # Public: Routen & Encounters
│   ├── admin/            # Admin-Seiten (geschützt)
│   ├── pokeradar/        # Vergleichstool
│   ├── pokeroute/        # Routen-Dokumentation
│   └── login/            # Login-Seite
├── components/            # React-Komponenten
│   ├── Navigation.tsx
│   ├── PokemonCard.tsx
│   ├── PokemonRadarChart.tsx
│   ├── TeamDisplay.tsx
│   └── RouteList.tsx
├── lib/                   # Utility-Funktionen
│   ├── prisma.ts         # Prisma Client
│   ├── auth.ts           # Auth-Helper
│   ├── session.ts        # Session-Config
│   └── pokeapi.ts        # PokeAPI-Service
├── prisma/
│   └── schema.prisma     # Datenbankschema
└── middleware.ts          # Route Protection
```

## Datenbank-Schema

- **Player**: Spieler mit Name und Farbe
- **Route**: Routen/Orte mit Name und Sortierung
- **Pokemon**: Gecachte Pokémon-Daten von PokeAPI
- **Encounter**: Gefangene Pokémon (Spieler + Route + Pokémon)
- **TeamMember**: Aktuelles Team eines Spielers (6 Slots)

## API-Endpunkte

### Öffentliche APIs
- `GET /api/pokemon` - Alle gecachten Pokémon
- `GET /api/players` - Alle Spieler mit Teams
- `GET /api/routes` - Alle Routen mit Encounters

### Auth APIs
- `POST /api/auth/login` - Admin-Login
- `POST /api/auth/logout` - Admin-Logout
- `GET /api/auth/status` - Auth-Status prüfen

### Admin APIs (geschützt)
- **Players**: `GET, POST /api/admin/players`, `PUT, DELETE /api/admin/players/[id]`
- **Routes**: `GET, POST /api/admin/routes`, `PUT, DELETE /api/admin/routes/[id]`
- **Encounters**: `GET, POST /api/admin/encounters`, `DELETE /api/admin/encounters/[id]`
- **Team**: `POST /api/admin/team`, `DELETE /api/admin/team/[id]`
- **Pokemon**: `POST /api/admin/pokemon/sync`, `POST /api/admin/pokemon/add`

## Deployment

### Vercel (empfohlen für Next.js)

1. **Datenbank auf PostgreSQL umstellen:**
   
   In `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **PostgreSQL-Datenbank erstellen** (z.B. bei Vercel Postgres, Supabase, Railway)

3. **Environment Variables in Vercel setzen:**
   - `DATABASE_URL` - PostgreSQL Connection String
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`

4. **Projekt deployen:**
   ```bash
   vercel
   ```

5. **Datenbank migrieren:**
   ```bash
   npx prisma migrate deploy
   ```

### Andere Hosting-Optionen

- **Docker**: Erstelle ein Dockerfile mit Node.js und SQLite/PostgreSQL
- **VPS**: Nutze PM2 oder systemd für den Node.js-Prozess
- **Railway/Render**: Ähnlich wie Vercel, unterstützen beide PostgreSQL

## Entwicklung

### Prisma Studio öffnen

Grafische Oberfläche für die Datenbank:
```bash
npx prisma studio
```

### Datenbank zurücksetzen

```bash
npx prisma migrate reset
```

### Build für Produktion

```bash
npm run build
npm start
```

## Troubleshooting

### Prisma-Fehler nach Schema-Änderungen

```bash
npx prisma generate
npx prisma migrate dev
```

### Session-Secret zu kurz

Stelle sicher, dass `SESSION_SECRET` mindestens 32 Zeichen lang ist.

### PokeAPI Synchronisierung schlägt fehl

- Prüfe Internetverbindung
- PokeAPI könnte Rate-Limiting haben - warte und versuche es erneut

### Bilder werden nicht angezeigt

Prüfe `next.config.ts` - PokeAPI-Domains müssen erlaubt sein.

## Lizenz

Dieses Projekt ist für private Zwecke erstellt.

## Autor

Erstellt als Pokémon Playthrough Dokumentationstool.

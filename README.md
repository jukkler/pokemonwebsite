# Pokemon Playthrough Dokumentations-Website

Eine vollstaendige Web-Applikation zur Dokumentation eines Parallel-Playthroughs von Pokemon-Spielen mit speziellen Regeln.

## Features

- **Oeffentliche Ansichten:**
  - **Pokeroute**: Uebersicht der aktuellen Teams und aller gefangenen Pokemon pro Route und Spieler
  - **Pokeradar**: Vergleichstool mit Radar Chart fuer Pokemon-Stats (HP, Angriff, Verteidigung, etc.)
  - **Tabelle**: Tabellarische Uebersicht aller Encounters

- **Admin-Panel:**
  - Spieler-Verwaltung (CRUD)
  - Routen-Verwaltung (CRUD)
  - Encounters-Verwaltung (Dokumentation gefangener Pokemon)
  - Team-Builder (6 Pokemon pro Spieler)
  - K.O. und "Nicht gefangen" Status
  - Spielstand-System (Speichern/Laden)
  - PokeAPI-Integration mit lokalem Cache

- **Technische Features:**
  - Session-basierte Authentifizierung mit iron-session
  - Offline-First: Alle Pokemon-Daten werden lokal gecacht
  - Responsive Design mit Tailwind CSS
  - TypeScript fuer Type-Safety
  - PostgreSQL-Datenbank mit Prisma ORM
  - Docker-Support fuer einfaches Deployment

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Authentifizierung**: iron-session
- **Datenbank**: Prisma + PostgreSQL
- **API**: PokeAPI (gecacht)
- **Deployment**: Docker + Docker Compose

---

## Schnellstart mit Docker (empfohlen)

### Voraussetzungen

- Docker Desktop installiert ([Download](https://www.docker.com/products/docker-desktop/))

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/DEIN-USERNAME/pokemonwebsite.git
cd pokemonwebsite

# 2. Umgebungsvariablen konfigurieren
cp env.example .env
# Bearbeite .env und setze sichere Passwoerter!

# 3. Container starten
docker compose up -d --build

# 4. App oeffnen
# http://localhost:3001
```

Die Datenbank wird automatisch beim ersten Start initialisiert.

---

## Lokale Entwicklung (ohne Docker)

### Voraussetzungen

- Node.js 20+ installiert
- PostgreSQL Datenbank

### Setup-Schritte

1. **Repository klonen:**
   ```bash
   git clone https://github.com/DEIN-USERNAME/pokemonwebsite.git
   cd pokemonwebsite
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren:**
   
   Erstelle eine `.env` Datei:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pokemon"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="dein-sicheres-passwort"
   SESSION_SECRET="ein-mindestens-32-zeichen-langer-geheimer-schluessel"
   ```

4. **Datenbank initialisieren:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Development Server starten:**
   ```bash
   npm run dev
   ```

6. **Im Browser oeffnen:**
   ```
   http://localhost:3001
   ```

---

## Erste Schritte in der App

### 1. Als Admin einloggen

1. Navigiere zu `/login`
2. Melde dich mit den Credentials aus der `.env` an

### 2. Pokemon-Datenbank synchronisieren

1. Gehe zu `/admin/pokemon`
2. Klicke auf "Nur Gen 1-4 synchronisieren (1-493)"
3. Warte 5-10 Minuten, bis alle Pokemon geladen sind

### 3. Spieler erstellen

1. Gehe zu `/admin/players`
2. Fuege Spieler mit Namen und Farbe hinzu

### 4. Routen erstellen

1. Gehe zu `/admin/routes`
2. Erstelle Routen in der Spielreihenfolge

### 5. Encounters dokumentieren

1. Gehe zu `/admin/encounters`
2. Waehle Spieler, Route und gefangenes Pokemon

### 6. Teams zusammenstellen

1. Gehe zu `/admin/team`
2. Weise Pokemon den Team-Slots zu

---

## Projektstruktur

```
pokemonwebsite/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Login/Logout/Status
│   │   ├── admin/        # Admin-CRUD-Endpunkte
│   │   ├── pokemon/      # Public: Pokemon-Liste
│   │   ├── players/      # Public: Spieler & Teams
│   │   └── routes/       # Public: Routen & Encounters
│   ├── admin/            # Admin-Seiten (geschuetzt)
│   ├── pokeradar/        # Vergleichstool
│   ├── pokeroute/        # Routen-Dokumentation
│   ├── tabelle/          # Tabellenansicht
│   └── login/            # Login-Seite
├── components/            # React-Komponenten
├── lib/                   # Utility-Funktionen
├── prisma/
│   └── schema.prisma     # Datenbankschema
├── deployment/           # Deployment-Dateien & Configs
├── Dockerfile            # Docker Build
├── docker-compose.yml    # Docker Orchestrierung
└── middleware.ts         # Route Protection
```

---

## Sicherheit

Diese Anwendung ist mit mehreren Sicherheitsmassnahmen ausgestattet:

### Docker-Sicherheit
- **Non-root Container**: App laeuft als User `nextjs`, nicht als root
- **Read-only Filesystem**: Container kann nicht beschrieben werden
- **Memory Limits**: Max. 512MB RAM verhindert DoS-Angriffe
- **Datenbank isoliert**: PostgreSQL nur intern erreichbar (kein Port nach aussen)
- **App nur lokal gebunden**: Port 3001 nur auf 127.0.0.1

### Nginx-Sicherheit
- **Rate Limiting**: Max. 5 Login-Versuche pro Minute pro IP
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Server-Version versteckt**: Keine Nginx-Versionsnummer in Responses
- **SSL-Hardening**: TLS 1.2+ mit sicheren Ciphers

### Anwendungs-Sicherheit
- **Session-Cookies**: httpOnly, secure, sameSite=lax
- **Passwort-Validierung**: SESSION_SECRET muss mind. 32 Zeichen lang sein
- **Image Optimization**: Nur erlaubte Domains (verhindert DoS)

### Wichtige Hinweise

1. **Sichere Passwoerter generieren:**
   ```bash
   openssl rand -base64 24  # Datenbank-Passwort
   openssl rand -base64 32  # Session Secret
   openssl rand -base64 16  # Admin-Passwort
   ```

2. **Niemals Standard-Passwoerter in Production verwenden!**

3. **.env Datei niemals in Git committen!**

Detaillierte Sicherheitsinformationen: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md#sicherheits-deep-dive)

---

## Deployment

### Docker auf Hetzner/VPS (empfohlen)

Siehe [HETZNER_DEPLOYMENT.md](HETZNER_DEPLOYMENT.md) fuer eine vollstaendige Anleitung mit:
- Server-Setup
- Docker-Installation
- SSL-Zertifikat
- Sicherheits-Haertung
- Backup-Strategien

**Kurzfassung:**
```bash
# Auf dem Server
git clone <repo>
cd pokemonwebsite
cp env.example .env
# .env bearbeiten mit sicheren Passwoertern!
docker compose up -d --build
```

### Detaillierte Docker-Anleitung

Siehe [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) fuer:
- Docker Installation
- Nginx Reverse Proxy
- SSL mit Let's Encrypt
- Sicherheits-Deep-Dive
- Troubleshooting

---

## Nuetzliche Befehle

### Docker

```bash
# Container starten
docker compose up -d

# Container stoppen
docker compose down

# Logs anzeigen
docker compose logs -f app

# Neu bauen nach Aenderungen
docker compose up -d --build

# Datenbank-Backup
docker compose exec db pg_dump -U pokemon pokemon > backup.sql
```

### Entwicklung

```bash
# Dev-Server
npm run dev

# Build
npm run build

# Prisma Studio (DB-GUI)
npx prisma studio

# Datenbank-Schema aktualisieren
npx prisma db push
```

---

## API-Endpunkte

### Oeffentliche APIs
- `GET /api/pokemon` - Alle gecachten Pokemon
- `GET /api/players` - Alle Spieler mit Teams
- `GET /api/routes` - Alle Routen mit Encounters

### Auth APIs
- `POST /api/auth/login` - Admin-Login
- `POST /api/auth/logout` - Admin-Logout
- `GET /api/auth/status` - Auth-Status pruefen

### Admin APIs (geschuetzt)
- **Players**: `/api/admin/players`
- **Routes**: `/api/admin/routes`
- **Encounters**: `/api/admin/encounters`
- **Team**: `/api/admin/team`
- **Pokemon**: `/api/admin/pokemon/sync`, `/api/admin/pokemon/add`
- **Gamesaves**: `/api/admin/gamesaves`

---

## Troubleshooting

### Docker: Container startet nicht

```bash
docker compose logs app
docker compose logs db
```

### Prisma-Fehler nach Schema-Aenderungen

```bash
npx prisma generate
npx prisma db push
```

### Session-Secret zu kurz

`SESSION_SECRET` muss mindestens 32 Zeichen lang sein:
```bash
openssl rand -base64 32
```

### PokeAPI Synchronisierung schlaegt fehl

- Pruefe Internetverbindung
- PokeAPI koennte Rate-Limiting haben - warte und versuche es erneut

### Rate Limiting sperrt mich aus (HTTP 429)

Warte 1 Minute oder erhoehe temporaer das Limit in der Nginx-Config.

---

## Lizenz

Dieses Projekt ist fuer private Zwecke erstellt.

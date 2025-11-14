# Vercel Deployment Anleitung

## ✅ Vorbereitung abgeschlossen

Die folgenden Dateien wurden für Vercel vorbereitet:
- ✅ `prisma/schema.prisma` - Auf PostgreSQL umgestellt
- ✅ `package.json` - Build-Scripts angepasst
- ✅ `vercel.json` - Vercel-Konfiguration erstellt
- ✅ `.vercelignore` - Ignore-Datei erstellt

## 📋 Nächste Schritte

### 1. Projekt auf GitHub pushen

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Account erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke auf "Sign Up"
3. Melde dich mit GitHub an

### 3. Projekt auf Vercel importieren

1. Im Vercel Dashboard: "Add New..." → "Project"
2. Wähle dein GitHub Repository aus
3. Vercel erkennt Next.js automatisch
4. Klicke auf "Deploy" (noch ohne Environment Variables)

### 4. Vercel Postgres Datenbank erstellen

1. Im Vercel Dashboard: "Storage" → "Create Database"
2. Wähle "Postgres"
3. Wähle "Hobby" Plan (kostenlos)
4. Erstelle die Datenbank
5. Die `DATABASE_URL` wird automatisch als Environment Variable gesetzt

### 5. Environment Variables setzen

Im Vercel Dashboard → Dein Projekt → "Settings" → "Environment Variables":

Füge folgende Variablen hinzu (für alle Environments: Production, Preview, Development):

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `DATABASE_URL` | ✅ Wird automatisch von Vercel Postgres gesetzt | - |
| `ADMIN_USERNAME` | Dein Admin-Username | `admin` |
| `ADMIN_PASSWORD` | Dein Admin-Passwort | `sicheres-passwort-123` |
| `SESSION_SECRET` | Zufälliges Secret | Generiere mit: `openssl rand -base64 32` |

**Session Secret generieren:**
```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### 6. Erneutes Deployment

Nach dem Setzen der Environment Variables:

1. Im Vercel Dashboard: "Deployments"
2. Klicke auf die drei Punkte beim neuesten Deployment
3. Wähle "Redeploy"
4. Oder pushe einen neuen Commit zu GitHub

### 7. Prisma Migrations

Die Migrations werden automatisch beim Build ausgeführt (durch `prisma migrate deploy` im Build Command).

Falls es Probleme gibt, kannst du manuell migrieren:

**Via Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

### 8. Domain konfigurieren (optional)

1. Im Vercel Dashboard: "Settings" → "Domains"
2. Füge deine Domain hinzu
3. Folge den DNS-Anweisungen
4. SSL wird automatisch von Vercel eingerichtet

## 🔧 Build-Prozess

Der Build-Prozess auf Vercel läuft folgendermaßen:

1. `npm install` - Dependencies installieren
2. `prisma generate` - Prisma Client generieren (via postinstall)
3. `prisma migrate deploy` - Datenbank-Migrationen ausführen
4. `next build` - Next.js App bauen
5. Deployment starten

## ⚠️ Wichtige Hinweise

- **SQLite funktioniert nicht auf Vercel** - Deshalb wurde auf PostgreSQL umgestellt
- **Lokale Entwicklung**: Du kannst weiterhin SQLite lokal verwenden, indem du eine `.env.local` Datei erstellst:
  ```
  DATABASE_URL="file:./dev.db"
  ```
  Und das Schema temporär auf SQLite umstellst (nur für lokale Entwicklung)

- **Environment Variables**: Stelle sicher, dass alle Variablen für alle Environments gesetzt sind

## 🐛 Troubleshooting

### Build schlägt fehl wegen Prisma

- Prüfe, ob `postinstall` Script in `package.json` vorhanden ist ✅
- Prüfe, ob `DATABASE_URL` gesetzt ist

### Datenbank-Verbindung schlägt fehl

- Prüfe `DATABASE_URL` in Environment Variables
- Stelle sicher, dass Vercel Postgres aktiv ist
- Prüfe, ob die Datenbank im selben Projekt ist

### Migrations werden nicht ausgeführt

- Prüfe Build-Logs in Vercel
- Stelle sicher, dass `prisma migrate deploy` im Build Command ist ✅

## 📊 Kosten

- **Vercel Hobby Plan**: Kostenlos
  - Unbegrenzte Deployments
  - 100 GB Bandwidth/Monat
  - Serverless Functions
  
- **Vercel Postgres Hobby**: Kostenlos
  - 256 MB Storage
  - 60 Stunden Compute/Monat

## ✅ Checkliste

- [ ] Projekt auf GitHub gepusht
- [ ] Vercel Account erstellt
- [ ] Projekt auf Vercel importiert
- [ ] Vercel Postgres erstellt
- [ ] Environment Variables gesetzt (ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET)
- [ ] Deployment erfolgreich
- [ ] Migrations ausgeführt
- [ ] Website funktioniert

## 🎉 Fertig!

Nach erfolgreichem Deployment ist deine Website unter `https://dein-projekt.vercel.app` erreichbar!


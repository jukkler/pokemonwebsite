#!/bin/bash

# Deployment Script für Pokémon Website
# Führe dieses Script im Projekt-Verzeichnis aus: /var/www/pokemonwebsite

set -e

echo "🚀 Starte Deployment..."

# 1. Git Pull
echo "📥 Aktualisiere Code von GitHub..."
git pull origin main

# 2. Dependencies installieren
echo "📦 Installiere Dependencies..."
npm install

# 3. Prisma Client generieren
echo "🔧 Generiere Prisma Client..."
npx prisma generate

# 4. Datenbank-Migrationen ausführen
echo "🗄️ Führe Datenbank-Migrationen aus..."
npx prisma migrate deploy

# 5. Build
echo "🏗️ Baue Next.js App..."
npm run build

# 6. PM2 Restart
echo "🔄 Starte App neu..."
pm2 restart pokemonwebsite || pm2 start npm --name "pokemonwebsite" -- start

# 7. PM2 Save
echo "💾 Speichere PM2 Konfiguration..."
pm2 save

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
pm2 status


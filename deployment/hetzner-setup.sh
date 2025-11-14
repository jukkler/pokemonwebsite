#!/bin/bash

# Hetzner Cloud Server Setup Script für Pokémon Website
# Führe dieses Script als root oder mit sudo aus

set -e

echo "🚀 Hetzner Cloud Server Setup für Pokémon Website"
echo "=================================================="

# 1. System aktualisieren
echo "📦 System wird aktualisiert..."
apt update && apt upgrade -y

# 2. Node.js installieren (Version 20)
echo "📦 Node.js wird installiert..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PostgreSQL installieren
echo "📦 PostgreSQL wird installiert..."
apt-get install -y postgresql postgresql-contrib

# 4. PM2 installieren (Process Manager)
echo "📦 PM2 wird installiert..."
npm install -g pm2

# 5. Nginx installieren
echo "📦 Nginx wird installiert..."
apt-get install -y nginx

# 6. Git installieren (falls nicht vorhanden)
echo "📦 Git wird installiert..."
apt-get install -y git

# 7. Certbot für SSL installieren
echo "📦 Certbot wird installiert..."
apt-get install -y certbot python3-certbot-nginx

# 8. Firewall konfigurieren
echo "🔥 Firewall wird konfiguriert..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 9. Projekt-Verzeichnis erstellen
echo "📁 Projekt-Verzeichnis wird erstellt..."
mkdir -p /var/www
chown -R $SUDO_USER:$SUDO_USER /var/www

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. PostgreSQL Datenbank einrichten (siehe HETZNER_DEPLOYMENT.md)"
echo "2. Projekt klonen: cd /var/www && git clone <dein-repo> pokemonwebsite"
echo "3. Environment Variables setzen"
echo "4. App builden und starten"
echo ""
echo "Siehe HETZNER_DEPLOYMENT.md für die vollständige Anleitung."


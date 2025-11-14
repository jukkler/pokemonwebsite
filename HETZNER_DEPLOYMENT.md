# Hetzner Cloud Deployment Anleitung

Vollständige Schritt-für-Schritt-Anleitung zum Deployen der Pokémon Website auf einem Hetzner Cloud Server.

## 📋 Voraussetzungen

- Hetzner Cloud Account
- Domain (optional, aber empfohlen)
- SSH-Zugriff auf den Server

## 🚀 Schritt 1: Hetzner Cloud Server erstellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Klicke auf "Add Server"
3. Wähle:
   - **Image**: Ubuntu 22.04 oder Debian 12
   - **Type**: CPX11 (2 vCPU, 2 GB RAM) oder CPX21 (3 vCPU, 4 GB RAM)
   - **Location**: Nürnberg (nbg1) oder Falkenstein (fsn1)
   - **SSH Key**: Füge deinen SSH-Key hinzu (oder erstelle einen)
4. Klicke auf "Create & Buy Now"

## 🔐 Schritt 2: Server-Zugriff

### SSH-Key erstellen (falls noch nicht vorhanden)

**Windows (PowerShell):**
```powershell
ssh-keygen -t ed25519 -C "deine-email@example.com"
# Speichere den Key z.B. in: C:\Users\Lukas\.ssh\id_ed25519
```

**Linux/Mac:**
```bash
ssh-keygen -t ed25519 -C "deine-email@example.com"
```

### SSH-Key zu Hetzner hinzufügen

1. Kopiere den öffentlichen Key:
   ```bash
   # Windows
   cat C:\Users\Lukas\.ssh\id_ed25519.pub
   
   # Linux/Mac
   cat ~/.ssh/id_ed25519.pub
   ```

2. In Hetzner Cloud Console:
   - Gehe zu "Security" → "SSH Keys"
   - Klicke auf "Add SSH Key"
   - Füge den öffentlichen Key ein

### Verbindung zum Server

```bash
# Ersetze ROOT_IP mit der IP-Adresse deines Servers
ssh root@ROOT_IP
```

## 📦 Schritt 3: Server Setup

### Option A: Automatisches Setup-Script

1. Lade das Setup-Script hoch:
   ```bash
   # Auf deinem lokalen Rechner
   scp deployment/hetzner-setup.sh root@ROOT_IP:/root/
   ```

2. Führe das Script aus:
   ```bash
   # Auf dem Server
   chmod +x /root/hetzner-setup.sh
   /root/hetzner-setup.sh
   ```

### Option B: Manuelles Setup

Führe diese Befehle auf dem Server aus:

```bash
# 1. System aktualisieren
apt update && apt upgrade -y

# 2. Node.js installieren (Version 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PostgreSQL installieren
apt-get install -y postgresql postgresql-contrib

# 4. PM2 installieren
npm install -g pm2

# 5. Nginx installieren
apt-get install -y nginx

# 6. Git installieren
apt-get install -y git

# 7. Certbot für SSL installieren
apt-get install -y certbot python3-certbot-nginx

# 8. Firewall konfigurieren
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 🗄️ Schritt 4: PostgreSQL Datenbank einrichten

```bash
# Als root auf dem Server
sudo -u postgres psql
```

In PostgreSQL:

```sql
-- Datenbank erstellen
CREATE DATABASE pokemonwebsite;

-- Benutzer erstellen
CREATE USER pokemonuser WITH PASSWORD 'DEIN-SICHERES-PASSWORT';

-- Rechte vergeben
GRANT ALL PRIVILEGES ON DATABASE pokemonwebsite TO pokemonuser;

-- PostgreSQL verlassen
\q
```

**Wichtig:** Notiere dir das Passwort! Du brauchst es für die `DATABASE_URL`.

## 📁 Schritt 5: Projekt klonen

```bash
# Projekt-Verzeichnis erstellen
mkdir -p /var/www
cd /var/www

# Projekt klonen (ersetze USERNAME und REPO-NAME)
git clone https://github.com/USERNAME/REPO-NAME.git pokemonwebsite

# In Projekt-Verzeichnis wechseln
cd pokemonwebsite

# Rechte setzen
chown -R www-data:www-data /var/www/pokemonwebsite
```

## ⚙️ Schritt 6: Environment Variables setzen

```bash
# .env Datei erstellen
nano /var/www/pokemonwebsite/.env
```

Füge folgende Variablen hinzu:

```env
# Datenbank
DATABASE_URL="postgresql://pokemonuser:DEIN-SICHERES-PASSWORT@localhost:5432/pokemonwebsite"

# Admin-Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dein-sicheres-admin-passwort

# Session Secret (generiere ein sicheres Secret)
SESSION_SECRET=generiere-ein-langes-zufaelliges-secret-min-32-zeichen
```

**Session Secret generieren:**
```bash
openssl rand -base64 32
```

Speichere mit `Ctrl+O`, dann `Enter`, dann `Ctrl+X`.

## 🔧 Schritt 7: Prisma Setup

```bash
cd /var/www/pokemonwebsite

# Prisma Client generieren
npx prisma generate

# Datenbank-Migrationen ausführen
npx prisma migrate deploy
```

## 🏗️ Schritt 8: App builden

```bash
cd /var/www/pokemonwebsite

# Dependencies installieren
npm install

# Build
npm run build
```

## 🚀 Schritt 9: App mit PM2 starten

```bash
cd /var/www/pokemonwebsite

# App starten
pm2 start npm --name "pokemonwebsite" -- start

# PM2 beim Systemstart aktivieren
pm2 startup
# Folge den Anweisungen, die PM2 ausgibt

# PM2 Konfiguration speichern
pm2 save

# Status prüfen
pm2 status
pm2 logs pokemonwebsite
```

## 🌐 Schritt 10: Nginx konfigurieren

### Nginx Config erstellen

```bash
# Config-Datei erstellen
nano /etc/nginx/sites-available/pokemonwebsite
```

Füge den Inhalt von `deployment/nginx-pokemonwebsite.conf` ein und passe die Domain an:

```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Wichtig:** Ersetze `deine-domain.de` mit deiner tatsächlichen Domain!

### Nginx Config aktivieren

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/pokemonwebsite /etc/nginx/sites-enabled/

# Testen
nginx -t

# Nginx neu starten
systemctl restart nginx

# Nginx Status prüfen
systemctl status nginx
```

## 🔒 Schritt 11: SSL-Zertifikat einrichten (Let's Encrypt)

```bash
# SSL-Zertifikat erstellen (ersetze deine-domain.de)
certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Folge den Anweisungen:
# - E-Mail eingeben
# - Terms of Service akzeptieren
# - Optional: E-Mail für Renewal-Benachrichtigungen
```

Certbot konfiguriert Nginx automatisch für HTTPS!

## ✅ Schritt 12: Testen

1. Öffne deine Domain im Browser: `https://deine-domain.de`
2. Prüfe, ob die Website lädt
3. Teste den Login: `/login`
4. Prüfe die Admin-Funktionen

## 🔄 Schritt 13: Deployment-Script einrichten (optional)

Für zukünftige Updates:

```bash
# Deployment-Script hochladen
scp deployment/deploy.sh root@ROOT_IP:/var/www/pokemonwebsite/

# Auf dem Server
chmod +x /var/www/pokemonwebsite/deploy.sh
```

**Zukünftige Deployments:**
```bash
cd /var/www/pokemonwebsite
./deploy.sh
```

## 📊 Schritt 14: Monitoring & Wartung

### PM2 Befehle

```bash
# Status anzeigen
pm2 status

# Logs anzeigen
pm2 logs pokemonwebsite

# App neu starten
pm2 restart pokemonwebsite

# App stoppen
pm2 stop pokemonwebsite

# App löschen
pm2 delete pokemonwebsite
```

### Nginx Logs

```bash
# Access Logs
tail -f /var/log/nginx/access.log

# Error Logs
tail -f /var/log/nginx/error.log
```

### PostgreSQL

```bash
# PostgreSQL Status
systemctl status postgresql

# PostgreSQL Logs
tail -f /var/log/postgresql/postgresql-*.log
```

## 🔧 Troubleshooting

### App startet nicht

```bash
# PM2 Logs prüfen
pm2 logs pokemonwebsite

# Manuell starten (für Debugging)
cd /var/www/pokemonwebsite
npm start
```

### Datenbank-Verbindung schlägt fehl

```bash
# PostgreSQL Status prüfen
systemctl status postgresql

# PostgreSQL neu starten
systemctl restart postgresql

# Verbindung testen
sudo -u postgres psql -d pokemonwebsite
```

### Nginx Fehler

```bash
# Nginx Config testen
nginx -t

# Nginx Logs prüfen
tail -f /var/log/nginx/error.log

# Nginx neu starten
systemctl restart nginx
```

### Port 3000 bereits belegt

```bash
# Prüfe, was auf Port 3000 läuft
lsof -i :3000

# Oder
netstat -tulpn | grep 3000
```

## 🔐 Sicherheit

### Firewall

```bash
# Firewall Status
ufw status

# Firewall Regeln anzeigen
ufw status verbose
```

### Regelmäßige Updates

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js Dependencies aktualisieren
cd /var/www/pokemonwebsite
npm update
```

### Backups

```bash
# Datenbank-Backup erstellen
sudo -u postgres pg_dump pokemonwebsite > /root/backup-$(date +%Y%m%d).sql

# Backup wiederherstellen
sudo -u postgres psql pokemonwebsite < /root/backup-YYYYMMDD.sql
```

## 📝 Checkliste

- [ ] Hetzner Cloud Server erstellt
- [ ] SSH-Zugriff eingerichtet
- [ ] Server Setup durchgeführt
- [ ] PostgreSQL installiert und Datenbank erstellt
- [ ] Projekt geklont
- [ ] Environment Variables gesetzt
- [ ] Prisma Setup durchgeführt
- [ ] App gebaut
- [ ] PM2 konfiguriert und App gestartet
- [ ] Nginx konfiguriert
- [ ] SSL-Zertifikat eingerichtet
- [ ] Website getestet
- [ ] Deployment-Script eingerichtet (optional)

## 💰 Kosten

- **Hetzner Cloud CPX11**: ~4,75€/Monat
- **Domain**: ~1€/Jahr (bei Hetzner)
- **Gesamt**: ~5€/Monat

## 🎉 Fertig!

Deine Website sollte jetzt unter `https://deine-domain.de` erreichbar sein!

Bei Problemen siehe den Troubleshooting-Abschnitt oder prüfe die Logs.


# Docker Deployment Guide

Vollständige Anleitung zum Deployen der Pokemon Website mit Docker auf einem Ubuntu Server (z.B. Hetzner Cloud).

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Next.js   │  │  PostgreSQL │  │    Migration    │  │
│  │    App      │◄─┤   Database  │◄─┤    Service      │  │
│  │  Port 3000  │  │  Port 5432  │  │  (runs once)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         ▲               │                               │
│         │               ▼                               │
│         │        ┌─────────────┐                       │
│         │        │   Volume    │                       │
│         │        │postgres_data│                       │
│         │        └─────────────┘                       │
└─────────┼───────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │   Nginx   │ ◄── SSL/Let's Encrypt
    │  Port 80  │
    │  Port 443 │
    └───────────┘
          ▲
          │
      Internet
```

## Voraussetzungen

- Ubuntu 20.04+ Server (Hetzner, DigitalOcean, etc.)
- Root-Zugang oder sudo-Rechte
- Mindestens 1GB RAM, 10GB Speicherplatz
- Optional: Domain für SSL

---

## Teil 1: Docker Installation

### Ubuntu System vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Benötigte Pakete installieren
sudo apt install -y ca-certificates curl gnupg lsb-release git
```

### Docker installieren

```bash
# Docker GPG Key hinzufügen
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker Repository hinzufügen
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker ohne sudo verwenden (optional, erfordert Neuanmeldung)
sudo usermod -aG docker $USER

# Installation testen
docker --version
docker compose version
```

---

## Teil 2: Projekt Setup

### Repository klonen

```bash
# Projekt-Verzeichnis erstellen
sudo mkdir -p /opt
cd /opt

# Projekt klonen (ersetze URL mit deinem Repository)
sudo git clone https://github.com/DEIN-USERNAME/pokemonwebsite.git
cd pokemonwebsite

# Berechtigungen setzen
sudo chown -R $USER:$USER /opt/pokemonwebsite
```

### Umgebungsvariablen konfigurieren

```bash
# Vorlage kopieren
cp env.example .env

# Datei bearbeiten
nano .env
```

**Wichtig: Ändere folgende Werte in der `.env` Datei:**

```env
# ================================
# PostgreSQL Database
# ================================
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=SICHERES-DATENBANK-PASSWORT-HIER
POSTGRES_DB=pokemon

# ================================
# Application
# ================================
# WICHTIG: Passwort muss mit POSTGRES_PASSWORD übereinstimmen!
DATABASE_URL=postgresql://pokemon:SICHERES-DATENBANK-PASSWORT-HIER@db:5432/pokemon

# Session Secret (mindestens 32 Zeichen!)
# Generieren mit: openssl rand -base64 32
SESSION_SECRET=HIER-MINDESTENS-32-ZEICHEN-LANGES-SECRET

# Admin Zugangsdaten
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SICHERES-ADMIN-PASSWORT
```

**Session Secret generieren:**

```bash
openssl rand -base64 32
```

---

## Teil 3: Container starten

### Erster Start

```bash
cd /opt/pokemonwebsite

# Container bauen und starten
docker compose up -d --build

# Status prüfen (alle Container sollten "running" oder "healthy" sein)
docker compose ps
```

### Was passiert beim Start?

1. **db** (PostgreSQL): Startet die Datenbank
2. **migrate**: Wartet auf DB, führt `prisma db push` aus, erstellt Tabellen
3. **app** (Next.js): Startet erst nachdem migrate erfolgreich war

### Logs prüfen

```bash
# Alle Logs anzeigen
docker compose logs -f

# Nur App-Logs
docker compose logs -f app

# Migration-Logs (einmalig beim Start)
docker compose logs migrate
```

---

## Teil 4: App testen

Die App läuft jetzt auf Port 3000:

```bash
# Lokaler Test
curl http://localhost:3000

# Von außen (Firewall beachten)
curl http://SERVER-IP:3000
```

---

## Teil 5: Nginx Reverse Proxy mit SSL

### Nginx installieren

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Nginx Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/pokemon
```

Inhalt (ersetze `deine-domain.de`):

```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
        
        # Timeouts für längere Requests (z.B. Pokemon Sync)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }
}
```

### Nginx aktivieren

```bash
# Default-Site deaktivieren
sudo rm -f /etc/nginx/sites-enabled/default

# Neue Config aktivieren
sudo ln -s /etc/nginx/sites-available/pokemon /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### SSL-Zertifikat mit Let's Encrypt

```bash
# SSL-Zertifikat erstellen
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Folge den Anweisungen:
# - E-Mail eingeben
# - Terms of Service akzeptieren (Y)
# - HTTP zu HTTPS Redirect aktivieren (2)
```

Certbot konfiguriert Nginx automatisch für HTTPS und richtet Auto-Renewal ein.

### Firewall konfigurieren

```bash
# UFW aktivieren (falls noch nicht)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Status prüfen
sudo ufw status
```

---

## Teil 6: Erste Schritte in der App

1. **Website öffnen**: `https://deine-domain.de`

2. **Als Admin einloggen**: `/login`
   - Username: Was du in `.env` als `ADMIN_USERNAME` gesetzt hast
   - Passwort: Was du in `.env` als `ADMIN_PASSWORD` gesetzt hast

3. **Pokémon synchronisieren**: `/admin/pokemon`
   - Klicke auf "Nur Gen 1-4 synchronisieren (1-493)"
   - Warte 5-10 Minuten

4. **Spieler erstellen**: `/admin/players`

5. **Routen erstellen**: `/admin/routes`

6. **Encounters dokumentieren**: `/admin/encounters`

---

## Nützliche Befehle

### Container-Management

```bash
# Container stoppen
docker compose down

# Container stoppen UND Datenbank löschen (VORSICHT!)
docker compose down -v

# Container neustarten
docker compose restart

# Container neu bauen (nach Code-Änderungen)
docker compose up -d --build

# Nur App neustarten (schnell)
docker compose restart app
```

### Logs

```bash
# Live-Logs aller Container
docker compose logs -f

# Nur App-Logs
docker compose logs -f app

# Nur DB-Logs
docker compose logs -f db

# Letzte 100 Zeilen
docker compose logs --tail=100
```

### Datenbank

```bash
# PostgreSQL CLI öffnen
docker compose exec db psql -U pokemon -d pokemon

# SQL ausführen
docker compose exec db psql -U pokemon -d pokemon -c "SELECT * FROM \"Player\";"

# Backup erstellen
docker compose exec db pg_dump -U pokemon pokemon > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
docker compose exec -T db psql -U pokemon pokemon < backup.sql
```

### Container-Shell

```bash
# In App-Container
docker compose exec app sh

# In DB-Container
docker compose exec db sh
```

---

## Updates deployen

```bash
cd /opt/pokemonwebsite

# Neuesten Code holen
git pull origin main

# Container neu bauen und starten
docker compose up -d --build

# Logs prüfen
docker compose logs -f app
```

---

## Backup-Strategie

### Manuelles Backup

```bash
cd /opt/pokemonwebsite

# Datenbank-Backup
docker compose exec db pg_dump -U pokemon pokemon > backup_$(date +%Y%m%d).sql

# Backup komprimieren
gzip backup_*.sql
```

### Automatisches Backup (Cronjob)

```bash
# Crontab bearbeiten
crontab -e

# Tägliches Backup um 3 Uhr nachts
0 3 * * * cd /opt/pokemonwebsite && docker compose exec -T db pg_dump -U pokemon pokemon | gzip > /opt/backups/pokemon_$(date +\%Y\%m\%d).sql.gz
```

### Backup-Verzeichnis erstellen

```bash
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups
```

---

## Troubleshooting

### Container startet nicht

```bash
# Status prüfen
docker compose ps -a

# Logs prüfen
docker compose logs app
docker compose logs db
docker compose logs migrate
```

### Datenbank-Verbindungsfehler

1. Prüfe ob `db` Container läuft: `docker compose ps`
2. Prüfe `DATABASE_URL` in `.env` (Passwort muss mit `POSTGRES_PASSWORD` übereinstimmen)
3. Warte bis Healthcheck grün ist

### Port 3000 bereits belegt

```bash
# Prüfen was Port 3000 belegt
sudo lsof -i :3000

# Prozess beenden oder anderen Port in docker-compose.yml verwenden
```

### SSL-Zertifikat erneuern

```bash
# Manuell erneuern
sudo certbot renew

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### Speicherplatz voll

```bash
# Docker aufräumen
docker system prune -a

# Nur ungenutzte Images
docker image prune -a

# Logs begrenzen (in docker-compose.yml)
# logging:
#   options:
#     max-size: "10m"
#     max-file: "3"
```

### Migration schlägt fehl

```bash
# Logs prüfen
docker compose logs migrate

# Manuell ausführen (im Builder-Image)
docker compose run --rm migrate npx prisma db push --skip-generate
```

---

## Monitoring

### Systemressourcen

```bash
# Docker Stats
docker stats

# Speicherplatz
df -h

# Memory
free -m
```

### Logs überwachen

```bash
# Nginx Access-Logs
sudo tail -f /var/log/nginx/access.log

# Nginx Error-Logs
sudo tail -f /var/log/nginx/error.log
```

---

## Sicherheits-Checkliste

- [ ] Sichere Passwörter in `.env` gesetzt
- [ ] Firewall aktiviert (nur 22, 80, 443)
- [ ] SSL-Zertifikat eingerichtet
- [ ] Root-Login per SSH deaktiviert (optional)
- [ ] Regelmäßige System-Updates
- [ ] Backups eingerichtet

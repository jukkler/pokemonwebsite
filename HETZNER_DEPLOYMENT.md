# Hetzner Cloud Deployment mit Docker

Vollständige Schritt-für-Schritt-Anleitung zum Deployen der Pokémon Website auf einem Hetzner Cloud Server mit Docker.

---

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Hetzner Server erstellen](#schritt-1-hetzner-cloud-server-erstellen)
3. [SSH-Zugang einrichten](#schritt-2-ssh-zugang-einrichten)
4. [Server-Setup](#schritt-3-server-setup)
5. [Projekt deployen](#schritt-4-projekt-deployen)
6. [Domain & SSL konfigurieren](#schritt-5-domain--ssl-konfigurieren)
7. [App testen](#schritt-6-app-testen)
8. [Wartung & Updates](#wartung--updates)

---

## Voraussetzungen

- Hetzner Cloud Account ([Registrierung](https://console.hetzner.cloud/))
- SSH-Client (Windows: PowerShell, PuTTY oder Windows Terminal)
- Optional: Eigene Domain

### Geschätzte Kosten

| Ressource | Kosten |
|-----------|--------|
| Hetzner CPX11 (2 vCPU, 2GB RAM) | ~4,75€/Monat |
| Domain (optional) | ~1€/Jahr |
| **Gesamt** | **~5€/Monat** |

---

## Schritt 1: Hetzner Cloud Server erstellen

### 1.1 In Hetzner Console einloggen

1. Gehe zu [console.hetzner.cloud](https://console.hetzner.cloud/)
2. Erstelle ein Projekt (falls noch keins vorhanden)
3. Klicke auf **"Add Server"**

### 1.2 Server-Konfiguration

| Einstellung | Empfehlung |
|-------------|------------|
| **Location** | Nürnberg (nbg1) oder Falkenstein (fsn1) |
| **Image** | Ubuntu 22.04 |
| **Type** | CPX11 (2 vCPU, 2 GB RAM) - reicht für die App |
| **Volume** | Nicht benötigt |
| **Network** | Default |
| **SSH Key** | Deinen SSH-Key hinzufügen (siehe Schritt 2) |
| **Name** | z.B. "pokemon-server" |

### 1.3 Server erstellen

Klicke auf **"Create & Buy Now"**. Der Server ist in ~30 Sekunden bereit.

**Notiere dir die IP-Adresse!** (z.B. `65.108.xxx.xxx`)

---

## Schritt 2: SSH-Zugang einrichten

### 2.1 SSH-Key erstellen (falls noch nicht vorhanden)

**Windows (PowerShell):**
```powershell
# SSH-Key generieren
ssh-keygen -t ed25519 -C "deine-email@example.com"

# Standard-Speicherort akzeptieren: C:\Users\DEIN_NAME\.ssh\id_ed25519

# Öffentlichen Key anzeigen (kopieren!)
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Linux/Mac:**
```bash
ssh-keygen -t ed25519 -C "deine-email@example.com"
cat ~/.ssh/id_ed25519.pub
```

### 2.2 SSH-Key zu Hetzner hinzufügen

1. In Hetzner Console: **Security** → **SSH Keys** → **Add SSH Key**
2. Füge den öffentlichen Key ein (beginnt mit `ssh-ed25519`)
3. Namen vergeben (z.B. "Mein Laptop")

### 2.3 Mit Server verbinden

```bash
# Ersetze SERVER_IP mit deiner IP-Adresse
ssh root@SERVER_IP
```

Beim ersten Mal: `yes` eingeben um den Fingerprint zu akzeptieren.

---

## Schritt 3: Server-Setup

### 3.1 System aktualisieren

```bash
apt update && apt upgrade -y
```

### 3.2 Docker installieren

```bash
# Benötigte Pakete
apt install -y ca-certificates curl gnupg lsb-release git

# Docker GPG Key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker Repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Testen
docker --version
docker compose version
```

### 3.3 Nginx installieren

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 3.4 Firewall konfigurieren

```bash
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

---

## Schritt 4: Projekt deployen

### 4.1 Repository klonen

```bash
# In /opt wechseln
cd /opt

# Projekt klonen (ersetze URL mit deinem Repository)
git clone https://github.com/DEIN-USERNAME/pokemonwebsite.git

cd pokemonwebsite
```

### 4.2 Umgebungsvariablen konfigurieren

```bash
# Vorlage kopieren
cp env.example .env

# Datei bearbeiten
nano .env
```

**Inhalt anpassen:**

```env
# ================================
# PostgreSQL Database
# ================================
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=EIN-SICHERES-PASSWORT-HIER-EINGEBEN
POSTGRES_DB=pokemon

# ================================
# Application
# ================================
DATABASE_URL=postgresql://pokemon:EIN-SICHERES-PASSWORT-HIER-EINGEBEN@db:5432/pokemon

# Session Secret generieren mit: openssl rand -base64 32
SESSION_SECRET=HIER-DEN-GENERIERTEN-KEY-EINFUEGEN

# Admin Zugangsdaten
ADMIN_USERNAME=admin
ADMIN_PASSWORD=DEIN-ADMIN-PASSWORT
```

**Session Secret generieren:**
```bash
openssl rand -base64 32
```

Speichern: `Ctrl+O` → `Enter` → `Ctrl+X`

### 4.3 Container starten

```bash
# Container bauen und starten
docker compose up -d --build

# Warten bis alles läuft (ca. 1-2 Minuten)
docker compose ps

# Alle Container sollten "running" oder "healthy" zeigen
```

### 4.4 Logs prüfen

```bash
# Migration-Logs (sollte "Your database is now in sync" zeigen)
docker compose logs migrate

# App-Logs
docker compose logs app
```

---

## Schritt 5: Domain & SSL konfigurieren

### Option A: Mit eigener Domain (empfohlen)

#### 5.1 DNS konfigurieren

Bei deinem Domain-Anbieter:
- **A-Record**: `@` → `DEINE_SERVER_IP`
- **A-Record**: `www` → `DEINE_SERVER_IP`

*DNS-Propagation kann bis zu 24 Stunden dauern (meist aber nur Minuten)*

#### 5.2 Nginx konfigurieren

```bash
nano /etc/nginx/sites-available/pokemon
```

Inhalt (ersetze `deine-domain.de`):

```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

Aktivieren:

```bash
# Default-Config entfernen
rm -f /etc/nginx/sites-enabled/default

# Neue Config aktivieren
ln -s /etc/nginx/sites-available/pokemon /etc/nginx/sites-enabled/

# Testen
nginx -t

# Nginx neustarten
systemctl restart nginx
```

#### 5.3 SSL-Zertifikat erstellen

```bash
certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

Folge den Anweisungen:
1. E-Mail eingeben
2. Terms akzeptieren: `Y`
3. Redirect zu HTTPS: `2` (empfohlen)

**Fertig!** Deine Website ist jetzt unter `https://deine-domain.de` erreichbar.

---

### Option B: Ohne Domain (nur IP-Zugriff)

```bash
nano /etc/nginx/sites-available/pokemon
```

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
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

```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/pokemon /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Website erreichbar unter: `http://DEINE_SERVER_IP`

---

## Schritt 6: App testen

### 6.1 Website öffnen

- Mit Domain: `https://deine-domain.de`
- Ohne Domain: `http://DEINE_SERVER_IP`

### 6.2 Als Admin einloggen

1. Gehe zu `/login`
2. Melde dich mit den Credentials aus `.env` an

### 6.3 Pokémon-Datenbank füllen

1. Gehe zu `/admin/pokemon`
2. Klicke auf **"Nur Gen 1-4 synchronisieren (1-493)"**
3. Warte 5-10 Minuten bis alle Pokémon geladen sind

### 6.4 Spieler und Routen erstellen

1. `/admin/players` - Spieler hinzufügen
2. `/admin/routes` - Routen erstellen
3. `/admin/encounters` - Gefangene Pokémon dokumentieren

---

## Wartung & Updates

### Code-Updates deployen

```bash
cd /opt/pokemonwebsite

# Neuesten Code holen
git pull origin main

# Container neu bauen
docker compose up -d --build
```

### Backups

#### Manuelles Backup

```bash
cd /opt/pokemonwebsite

# Datenbank sichern
docker compose exec db pg_dump -U pokemon pokemon > backup_$(date +%Y%m%d).sql
```

#### Automatisches Backup (täglich um 3 Uhr)

```bash
# Backup-Ordner erstellen
mkdir -p /opt/backups

# Cronjob einrichten
crontab -e

# Diese Zeile hinzufügen:
0 3 * * * cd /opt/pokemonwebsite && docker compose exec -T db pg_dump -U pokemon pokemon | gzip > /opt/backups/pokemon_$(date +\%Y\%m\%d).sql.gz
```

### Container-Befehle

```bash
# Status anzeigen
docker compose ps

# Logs anzeigen
docker compose logs -f app

# Container neustarten
docker compose restart

# Container stoppen
docker compose down

# Alles löschen (VORSICHT: auch Datenbank!)
docker compose down -v
```

### System-Updates

```bash
# Ubuntu Updates
apt update && apt upgrade -y

# Docker Images aktualisieren
docker compose pull
docker compose up -d
```

---

## Troubleshooting

### Container startet nicht

```bash
docker compose logs migrate
docker compose logs app
docker compose logs db
```

### Datenbank-Verbindungsfehler

- Prüfe `DATABASE_URL` in `.env`
- Stelle sicher, dass das Passwort mit `POSTGRES_PASSWORD` übereinstimmt

### SSL-Zertifikat erneuern

```bash
# Automatisch (sollte via Cron laufen)
certbot renew

# Status prüfen
certbot certificates
```

### Nginx-Fehler

```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Speicherplatz voll

```bash
# Docker aufräumen
docker system prune -a

# Alte Backups löschen
find /opt/backups -mtime +30 -delete
```

---

## Schnellreferenz

| Aktion | Befehl |
|--------|--------|
| Container starten | `docker compose up -d` |
| Container stoppen | `docker compose down` |
| Logs anzeigen | `docker compose logs -f` |
| Neu bauen | `docker compose up -d --build` |
| DB-Backup | `docker compose exec db pg_dump -U pokemon pokemon > backup.sql` |
| DB-Restore | `docker compose exec -T db psql -U pokemon pokemon < backup.sql` |

---

## Checkliste

- [ ] Hetzner Server erstellt
- [ ] SSH-Zugang funktioniert
- [ ] Docker installiert
- [ ] Projekt geklont
- [ ] `.env` konfiguriert
- [ ] Container laufen
- [ ] Nginx konfiguriert
- [ ] SSL-Zertifikat (bei Domain)
- [ ] Website erreichbar
- [ ] Admin-Login funktioniert
- [ ] Pokémon synchronisiert
- [ ] Backup eingerichtet

---

## Support

Bei Problemen:
1. Logs prüfen: `docker compose logs`
2. Container-Status: `docker compose ps`
3. Nginx-Status: `systemctl status nginx`

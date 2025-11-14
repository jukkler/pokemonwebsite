# Deployment Dateien

Dieses Verzeichnis enthält alle Dateien für das Hetzner Cloud Deployment.

## Dateien

- **`hetzner-setup.sh`** - Automatisches Setup-Script für den Server
- **`deploy.sh`** - Deployment-Script für Updates
- **`nginx-pokemonwebsite.conf`** - Nginx Konfiguration
- **`pokemonwebsite.service`** - Systemd Service File (optional, für PM2 nicht benötigt)

## Verwendung

Siehe `HETZNER_DEPLOYMENT.md` für die vollständige Anleitung.

## Schnellstart

1. Server Setup:
   ```bash
   scp hetzner-setup.sh root@SERVER_IP:/root/
   ssh root@SERVER_IP
   chmod +x /root/hetzner-setup.sh
   /root/hetzner-setup.sh
   ```

2. Deployment:
   ```bash
   scp deploy.sh root@SERVER_IP:/var/www/pokemonwebsite/
   ssh root@SERVER_IP
   cd /var/www/pokemonwebsite
   chmod +x deploy.sh
   ./deploy.sh
   ```


# Deployment unter goalkeeper91.de (Docker, Shared-Reverse-Proxy)

Ziel: Die Demo läuft als eigener Docker-Container unter der Subdomain
`zeiterfassung.goalkeeper91.de` und hängt sich an den **bereits laufenden**
Reverse-Proxy des Zielservers an (denselben, der schon `goalkeeper91.de`,
`n8n.goalkeeper91.de`, `punishersgermany.de` und `vault.punishersgermany.de`
bedient). Dieses Repo bringt **keinen eigenen nginx mit eigenem Port 80/443**
mit — genau wie das PunishersGer-Repo hängt es sich nur per externem
Docker-Netzwerk an, damit der bestehende Proxy es per Servicename erreicht.

Zusätzlich per HTTP-Basic-Auth geschützt (ein gemeinsames Passwort), damit nur
Leute mit den Zugangsdaten (z. B. Kontakte bei potenziellen Arbeitgebern) die
Seite sehen — nicht Crawler oder zufällige Besucher.

**Wichtig:** Schritte 2–5 verändern die Config eines *anderen, bereits live
laufenden* Projekts (den Shared-nginx im `demo`-Repo) — das kann dieses Repo
nicht automatisch anfassen, deshalb sind sie hier als manuelles Runbook
dokumentiert statt als Skript. Der eine geteilte nginx-Container bedient
**alle** Tenants gleichzeitig — ein kaputter Reload legt nicht nur diese Demo
lahm, sondern auch die produktive SaaS-Seite und alle anderen Subdomains.
Deshalb unbedingt in der Reihenfolge unten vorgehen.

## 1. DNS

A-Record für `zeiterfassung.goalkeeper91.de` auf dieselbe Server-IP wie
`goalkeeper91.de` zeigen lassen.

## 2. Nur den :80-Block aktivieren

Im Checkout des Shared-Proxy-Repos (`demo`) liegt bereits
`nginx/zeiterfassung.conf` (siehe dort) mit **beiden** Server-Blöcken. Bevor
ein Zertifikat existiert, darf nginx aber **nicht** den `:443`-Block mit
`ssl_certificate`-Pfaden laden, die noch nicht existieren — das lässt den
Reload fehlschlagen. Vor dem ersten Deploy also entweder:

- den `:443`-Server-Block in `nginx/zeiterfassung.conf` temporär auskommentieren, oder
- die Datei vorübergehend auf nur den `:80`-Block kürzen (Vorlage: der
  entsprechende Block in `n8n.conf` oder `punishersgermany.conf` im selben
  Ordner),

dann in `docker-compose.prod.yml` (im `demo`-Repo) die Volume-Zeile für
`zeiterfassung.conf` ergänzen (liegt dort bereits vor) und den Proxy neu
laden:

```bash
docker compose -f docker-compose.prod.yml restart nginx
# oder, ohne Container-Neustart:
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 3. htpasswd-Datei anlegen

Auf dem Server, im Checkout des `demo`-Repos. Kein Host-Paket nötig — läuft
komplett über einen Wegwerf-Container, das Passwort wird interaktiv
abgefragt und landet nirgends im Klartext/in der Shell-History:

```bash
mkdir -p nginx/htpasswd
docker run --rm -it httpd:2.4-alpine htpasswd -nB <benutzername> > nginx/htpasswd/zeiterfassung
```

(`-n` gibt die Zeile nur auf stdout aus statt eine Datei im Container zu
schreiben, `-B` = bcrypt.) Die Volume-Zeile dafür liegt in
`docker-compose.prod.yml` bereits vor — **wichtig:** Docker legt beim Start
automatisch ein leeres *Verzeichnis* am Zielpfad an, wenn die Quelldatei beim
`docker compose up`/`restart` noch fehlt. Die Datei muss also **vor** dem
nächsten Neustart/Reload existieren.

## 4. Erstzertifikat ziehen

Mit denselben Host-Pfaden, die der bestehende Certbot-Renewer-Container schon
nutzt (per `docker inspect <renewer-container> --format '{{json .Mounts}}'`
prüfen):

```bash
docker run --rm \
  -v <host-pfad-certs>:/etc/letsencrypt \
  -v <host-pfad-certbot-www>:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d zeiterfassung.goalkeeper91.de \
  --email <email> --agree-tos --no-eff-email
```

## 5. :443-Block aktivieren

Den zuvor auskommentierten/gekürzten `:443`-Block in
`nginx/zeiterfassung.conf` wieder herstellen (`ssl_certificate`/
`ssl_certificate_key` zeigen auf `.../live/zeiterfassung.goalkeeper91.de/
{fullchain,privkey}.pem`) und den Proxy erneut neu laden. Der bestehende
Certbot-Renewer erneuert das neue Zertifikat ab jetzt automatisch mit, ohne
weiteres Zutun.

## 6. Diesen Container deployen

```bash
git clone <repo-url> zeiterfassung-dashboard && cd zeiterfassung-dashboard
docker compose up -d --build
```

Der Service heißt `zeiterfassung` und hängt sich an das externe Netzwerk
`goalkeeper_prod_network` (Default, überschreibbar per `SHARED_NETWORK_NAME`
in einer `.env`) — der Proxy erreicht ihn darüber per Servicename, siehe
`nginx/zeiterfassung.conf`'s `proxy_pass http://zeiterfassung:80;`.

## 7. Zugriff testen

```bash
curl -u <benutzername> https://zeiterfassung.goalkeeper91.de
```

Im Browser fragt der Proxy automatisch per Popup nach Benutzername/Passwort,
bevor die Seite überhaupt geladen wird.

## Passwort ändern / Zugriff entziehen

```bash
docker run --rm -it httpd:2.4-alpine htpasswd -nB <benutzername> > nginx/htpasswd/zeiterfassung   # überschreibt (nur ein Nutzer)
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Updates ausrollen

Läuft nach dem Einrichten von CI/CD (siehe unten) automatisch bei jedem Push
auf `main`. Manuell/als Fallback weiterhin möglich:

```bash
git pull
docker compose up -d --build
```

Kein Proxy-Reload nötig — nur dieser eine Container wird neu gebaut, das
nginx-Routing bleibt unverändert.

## CI/CD

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) baut bei
jedem Push/PR zunächst Lint + Typecheck + Build (schneller Fehlschlag, bevor
überhaupt ein Deploy versucht wird), und deployt bei einem Push auf `main`
zusätzlich per SSH auf den Server: `git pull --ff-only && docker compose up
-d --build` — genau der manuelle Befehl von oben, nur automatisiert. Läuft
nie bei Pull Requests (auch nicht von `main` selbst), damit ein PR aus einem
Fork keinen Zugriff auf die Deploy-Secrets bekommt.

**Voraussetzung:** Schritte 1–6 oben (DNS, nginx-Config, Zertifikat, initialer
`git clone` + `docker compose up -d --build` auf dem Server) müssen einmalig
manuell erledigt sein — CI/CD übernimmt nur die Updates danach, nicht die
Erstinstallation.

**Benötigte Secrets** (GitHub → Repo → Settings → Secrets and variables →
Actions → "New repository secret", oder per `gh secret set NAME` — beides
fragt den Wert interaktiv ab bzw. liest ihn aus einer Datei, sodass er nie im
Klartext im Chat oder in der Shell-History landet):

| Secret | Bedeutung |
|---|---|
| `DEPLOY_HOST` | Server-IP oder Hostname |
| `DEPLOY_USER` | SSH-Benutzer auf dem Server |
| `DEPLOY_SSH_KEY` | Privater SSH-Schlüssel (PEM), dessen öffentliches Gegenstück in `~/.ssh/authorized_keys` des `DEPLOY_USER` auf dem Server steht — am besten ein **eigenes** Deploy-Key-Paar erzeugen (`ssh-keygen -t ed25519 -f deploy_key -N ""`), nicht den privaten Haupt-Schlüssel wiederverwenden |
| `DEPLOY_PATH` | Absoluter Pfad des Checkouts auf dem Server, z. B. `/home/<user>/zeiterfassung-dashboard` |
| `DEPLOY_PORT` | SSH-Port, optional (Default `22`) |

```bash
gh secret set DEPLOY_HOST
gh secret set DEPLOY_USER
gh secret set DEPLOY_SSH_KEY < deploy_key   # privater Schlüssel aus einer Datei, nie inline einfügen
gh secret set DEPLOY_PATH
```

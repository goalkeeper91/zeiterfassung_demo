# Zeiterfassung Dashboard

Mobile-first Kiosk-Dashboard für Zeiterfassung: ein Tablet am Empfang, an dem
Mitarbeitende per PIN Arbeitsbeginn, Pause und Feierabend erfassen — plus ein
Admin-Dashboard mit Tagesübersicht. Gebaut als Demo-/Portfolio-Projekt, um
Softwareentwicklung an einem konkreten, realistischen Use Case zu zeigen,
nicht als fertiges Produkt für den Produktivbetrieb.

> Screenshots/GIF vom Kiosk-Flow und Dashboard folgen hier, sobald sie
> erzeugt sind — der aktuelle Stand ist per `npm run dev` oder Docker-Build
> selbst durchklickbar (siehe unten).

## Die Idee

Firmen mit Publikumsverkehr am Empfang lösen Zeiterfassung oft über Papier,
Excel oder teure Fertiglösungen. Dieses Projekt zeigt, wie ein
Tablet-Terminal dafür aussehen könnte: groß genug zum Antippen, ohne
Tastatur, mit sofortigem visuellem Feedback, und robust genug für den
Dauerbetrieb an einer Rezeption (Idle-Timeout, PIN-Lockout, Offline-Hinweis,
Vollbildmodus).

Die Datenhaltung läuft aktuell komplett lokal (siehe "Architektur" unten) —
bewusst so gebaut, dass eine echte Anbindung an ein Zeiterfassungs-Backend
wie [Blink](https://www.blink.de/) später an **einer** Stelle nachgerüstet
werden kann, ohne die UI anzufassen.

## Kiosk-Flow

1. **PIN eingeben** — großer Ziffernblock, kein Keyboard nötig
2. **Kontextabhängiges Menü** — nur die im aktuellen Schichtstatus gültigen
   Aktionen werden angezeigt (z. B. während der Pause nur "Pause beenden")
3. **Bestätigung** mit Uhrzeit, danach automatische Rückkehr zum PIN-Screen
4. Nach 15s Inaktivität oder 5 Fehlversuchen (PIN-Lockout, 30s Sperre) geht
   es automatisch zurück zum Ausgangszustand — ein Kiosk darf nie in einem
   Zwischenzustand hängen bleiben

## Admin-Dashboard

Tagesübersicht aller Mitarbeitenden: aktueller Status, chronologische
Punch-Liste, gearbeitete Zeit. Reagiert live auf Änderungen aus einem
anderen Tab/Gerät (z. B. Kiosk-Tablet in einem Fenster, Dashboard daneben
zur Präsentation).

## Architektur

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v8

Der wichtigste Design-Entscheid: eine `TimeTrackingProvider`-Schnittstelle
(`src/providers/types.ts`) entkoppelt die UI komplett von der
Datenquelle. Aktuell implementiert `LocalMockProvider` diese Schnittstelle
gegen `localStorage` mit statischen Beispiel-Mitarbeitenden — ein späterer
`BlinkProvider` würde dieselbe Schnittstelle gegen die echte Blink-API
implementieren, ohne dass eine einzige Zeile in `KioskPage`, `ShiftMenu`
oder `DashboardPage` sich ändern müsste. Alle Provider-Methoden sind bewusst
`Promise`-basiert, obwohl die lokale Implementierung synchron arbeiten
könnte — das erspart einen zweiten Umbau, sobald echte Netzwerk-Latenz
dazukommt.

```
src/
├── providers/        # TimeTrackingProvider-Interface + LocalMockProvider
├── data/             # localStorage-Persistenz, PIN-Lockout, Mock-Daten
├── components/       # PinPad, ShiftMenu, PunchConfirmation, StatusBadge
├── pages/            # KioskPage, DashboardPage
└── hooks/            # Idle-Timeout, Fullscreen, Online-Status, PIN-Lockout
```

## Entwicklung

```bash
npm install
npm run dev
```

## Deployment & Zugriffsschutz

Läuft als eigener Docker-Container (`Dockerfile` + `docker-compose.yml`) und
hängt sich per externem Docker-Netzwerk an den bereits laufenden
Shared-Reverse-Proxy des Zielservers an — unter
`zeiterfassung.goalkeeper91.de`, per HTTP-Basic-Auth (ein gemeinsames
Passwort) geschützt, damit nur autorisierte Personen (z. B. potenzielle
Arbeitgeber) Zugriff haben, nicht aber Crawler oder zufällige Besucher.

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für den vollständigen Ablauf (DNS,
nginx-Konfiguration, Zertifikat, Passwort einrichten).

## Stand & nächste Schritte

Dies ist bewusst ein **klickbarer Dummy** ohne echte Blink-Anbindung — Fokus
liegt auf UI/UX, Zustandslogik und einer sauberen Architektur, die eine
echte Anbindung später nicht ausbremst. Nicht enthalten (bewusst, siehe
Architektur-Begründung oben): echte Blink-API-Integration, Mehrbenutzer-
Authentifizierung jenseits der PIN, Backend/Datenbank.

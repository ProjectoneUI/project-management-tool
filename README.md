# Projektmanagement-Tool

Ein umfassendes Open-Source-Projektmanagement-Tool mit React, Node.js und Ollama KI-Integration.

## Technologien

- **Frontend**: React mit TypeScript
- **Backend**: Node.js mit Express
- **Datenbank**: MongoDB
- **KI**: Ollama (lokale Open-Source-KI)
- **Speicher**: OneDrive-Integration
- **Hosting**: Kostenlose Tiers von Vercel (Frontend) und Render (Backend)

## Funktionen

- Authentifizierung und Benutzerverwaltung
- Dashboard mit KI-generierten Einblicken
- Projektmanagement mit Zielen und Meilensteinen
- Aufgabenmanagement mit Kanban-Board
- Dokumentenverwaltung mit Wiki und OneDrive-Integration
- Kalender und Terminplanung
- Team-Kommunikation
- KI-gestützte Berichterstellung

## Projektstruktur

```
pmtool/
├── client/                # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # UI-Komponenten
│   │   ├── pages/         # Seitenkomponenten
│   │   ├── context/       # React Context für State Management
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── services/      # API-Services
│   │   ├── utils/         # Hilfsfunktionen
│   │   ├── types/         # TypeScript Typdefinitionen
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── server/                # Node.js Backend
│   ├── src/
│   │   ├── config/        # Konfigurationsdateien
│   │   ├── controllers/   # Request Handler
│   │   ├── middleware/    # Express Middleware
│   │   ├── models/        # MongoDB/Mongoose Models
│   │   ├── routes/        # API Routes
│   │   ├── services/      # Business Logic
│   │   ├── utils/         # Hilfsfunktionen
│   │   ├── ai/            # Ollama KI-Integration
│   │   ├── integrations/  # Externe API-Integrationen
│   │   └── index.ts       # Einstiegspunkt
│   ├── package.json
│   └── tsconfig.json
```

## Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- MongoDB
- Ollama (für KI-Funktionen)

### Frontend einrichten

```bash
cd client
npm install
npm start
```

### Backend einrichten

```bash
cd server
npm install
npm run dev
```

## KI-Integration

Das Projektmanagement-Tool verfügt über eine umfassende KI-Integration, die auf Ollama basiert und lokale Sprachmodelle nutzt. Diese Integration bietet verschiedene Funktionen zur Unterstützung des Projektmanagements:

### KI-Funktionen

- **KI-Assistent**: Ein Chat-Interface, um Fragen zu Projekten oder allgemeine Fragen zum Projektmanagement zu stellen.
- **Projektvorschläge**: Generierung von Vorschlägen für Projektziele, Meilensteine und potenzielle Risiken basierend auf einer Projektbeschreibung.
- **Aufgabenvorschläge**: Vorschläge für relevante Aufgaben basierend auf dem Projektkontext und bestehenden Aufgaben.
- **Dokumentzusammenfassung**: Automatische Erstellung von Zusammenfassungen für Dokumente.
- **Projektbericht**: Generierung detaillierter Projektberichte mit Fortschrittsanalyse und Empfehlungen.

### Technische Details

Die KI-Funktionen basieren auf Ollama, einer lokalen Lösung für KI-Modelle, die Daten privat und sicher hält. Alle Verarbeitungen finden auf dem Server statt, ohne dass Daten an externe Dienste gesendet werden.

### Einrichtung von Ollama

1. Installieren Sie Ollama von [ollama.ai](https://ollama.ai)
2. Laden Sie ein geeignetes Modell herunter, z.B. `llama2` oder `mistral`:
   ```
   ollama pull llama2
   ```
3. Stellen Sie sicher, dass der Ollama-Dienst läuft:
   ```
   ollama serve
   ```
4. Konfigurieren Sie die Umgebungsvariable `OLLAMA_API_URL` in der `.env`-Datei:
   ```
   OLLAMA_API_URL=http://localhost:11434/api
   ```

### Verwendung

Die KI-Funktionen sind über verschiedene Bereiche der Anwendung zugänglich:
- Über den KI-Assistent in der Seitenleiste
- Direkt in Projekten über den KI-Assistent-Button
- In der Dokumentenansicht für Zusammenfassungen
- In der Projektübersicht für Berichte und Vorschläge 
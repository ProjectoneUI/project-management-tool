# KI-Integration im Projektmanagement-Tool

## Übersicht

Das Projektmanagement-Tool verfügt über eine umfassende KI-Integration, die auf Ollama basiert und lokale Sprachmodelle nutzt. Diese Integration bietet verschiedene Funktionen zur Unterstützung des Projektmanagements und der Teamarbeit.

## Implementierte KI-Funktionen

### 1. KI-Assistent

Der KI-Assistent bietet ein Chat-Interface, über das Benutzer Fragen zu ihren Projekten oder allgemeine Fragen zum Projektmanagement stellen können. Der Assistent kann bei der Lösung von Problemen helfen, Ratschläge geben und Informationen bereitstellen.

**Technische Implementierung:**
- Frontend-Komponente: `client/src/components/ai/AIAssistant.tsx`
- Backend-Controller: `server/src/controllers/aiController.ts` (Funktion: `generateText`)
- API-Endpunkt: `POST /api/ai/generate-text`

### 2. Projektvorschläge

Die KI kann basierend auf einer Projektbeschreibung Vorschläge für Projektziele, Meilensteine und potenzielle Risiken generieren. Diese Vorschläge können direkt in das Projekt übernommen werden.

**Technische Implementierung:**
- Frontend-Komponente: `client/src/components/projects/ProjectAIHelper.tsx`
- Backend-Controller: `server/src/controllers/aiController.ts` (Funktion: `generateProjectSuggestions`)
- API-Endpunkt: `POST /api/ai/project-suggestions`
- Datenformat:
  ```json
  {
    "objectives": ["Ziel 1", "Ziel 2", ...],
    "milestones": [
      {
        "title": "Meilenstein 1",
        "dueDate": "2023-12-31",
        "status": "pending"
      },
      ...
    ],
    "risks": [
      {
        "title": "Risiko 1",
        "description": "Beschreibung",
        "impact": "hoch",
        "probability": "mittel"
      },
      ...
    ]
  }
  ```

### 3. Aufgabenvorschläge

Die KI analysiert ein Projekt und schlägt relevante Aufgaben vor, die hinzugefügt werden können, um die Projektziele zu erreichen. Die Vorschläge berücksichtigen den Projektkontext und bestehende Aufgaben.

**Technische Implementierung:**
- Frontend-Komponente: `client/src/components/projects/ProjectAIHelper.tsx`
- Backend-Controller: `server/src/controllers/aiController.ts` (Funktion: `generateTaskSuggestions`)
- API-Endpunkt: `POST /api/ai/task-suggestions`
- Datenformat:
  ```json
  [
    {
      "title": "Aufgabe 1",
      "description": "Beschreibung",
      "priority": "High",
      "estimatedHours": 4
    },
    ...
  ]
  ```

### 4. Dokumentzusammenfassung

Die KI kann lange Dokumente analysieren und eine prägnante Zusammenfassung erstellen, die die wichtigsten Punkte hervorhebt. Dies ist besonders nützlich für umfangreiche Projektdokumentationen.

**Technische Implementierung:**
- Frontend-Komponente: `client/src/components/ai/AIAssistant.tsx`
- Backend-Controller: `server/src/controllers/aiController.ts` (Funktion: `generateDocumentSummary`)
- API-Endpunkt: `POST /api/ai/document-summary`

### 5. Projektbericht

Die KI kann automatisch einen detaillierten Projektbericht mit Fortschrittsanalyse, Meilenstein-Status und Empfehlungen für die weitere Vorgehensweise generieren.

**Technische Implementierung:**
- Frontend-Komponente: `client/src/components/projects/ProjectAIHelper.tsx`
- Backend-Controller: `server/src/controllers/aiController.ts` (Funktion: `generateProjectReport`)
- API-Endpunkt: `POST /api/ai/project-report`

## Technische Architektur

### Backend-Komponenten

1. **Ollama-Service (`server/src/ai/ollamaService.ts`):**
   - Singleton-Klasse für die Kommunikation mit der Ollama API
   - Methoden für verschiedene KI-Funktionen
   - Fehlerbehandlung und Logging

2. **AI-Controller (`server/src/controllers/aiController.ts`):**
   - Express-Controller für die Verarbeitung von API-Anfragen
   - Validierung von Eingabedaten
   - Aufruf des Ollama-Services
   - Formatierung der Antworten

3. **AI-Routen (`server/src/routes/aiRoutes.ts`):**
   - Definition der API-Endpunkte
   - Authentifizierung und Autorisierung
   - Validierungsregeln

### Frontend-Komponenten

1. **AI-Assistent (`client/src/components/ai/AIAssistant.tsx`):**
   - Chat-Interface für die Kommunikation mit der KI
   - Tabs für verschiedene KI-Funktionen
   - Anzeige von Vorschlägen und Berichten

2. **Projekt-AI-Helper (`client/src/components/projects/ProjectAIHelper.tsx`):**
   - Integration der KI-Funktionen in die Projektansicht
   - Dialog für Projektvorschläge und Aufgabenvorschläge
   - Möglichkeit, Vorschläge direkt zu übernehmen

3. **AI-Seite (`client/src/pages/AI.tsx`):**
   - Eigenständige Seite für den KI-Assistenten
   - Kontextbezogene Hilfe für Projekte und Dokumente
   - Informationen zu den KI-Funktionen

4. **AI-Hook (`client/src/hooks/useAI.ts`):**
   - React-Query-Hooks für die Kommunikation mit der API
   - Fehlerbehandlung und Caching

## Einrichtung und Konfiguration

### Ollama-Installation

1. Installieren Sie Ollama von [ollama.ai](https://ollama.ai)
2. Laden Sie ein geeignetes Modell herunter:
   ```
   ollama pull llama2
   ```
   oder
   ```
   ollama pull mistral
   ```
3. Stellen Sie sicher, dass der Ollama-Dienst läuft:
   ```
   ollama serve
   ```

### Konfiguration im Projektmanagement-Tool

1. Konfigurieren Sie die Umgebungsvariable `OLLAMA_API_URL` in der `.env`-Datei:
   ```
   OLLAMA_API_URL=http://localhost:11434/api
   ```
2. Optional: Konfigurieren Sie das zu verwendende Modell:
   ```
   OLLAMA_MODEL=llama2
   ```
3. Optional: Konfigurieren Sie die Modellparameter:
   ```
   OLLAMA_TEMPERATURE=0.7
   OLLAMA_MAX_TOKENS=2048
   ```

## Sicherheitshinweise

- Die KI-Integration basiert auf lokalen Modellen, sodass keine Daten an externe Dienste gesendet werden.
- Alle Verarbeitungen finden auf dem Server statt, was die Datensicherheit erhöht.
- Die API-Endpunkte sind durch Authentifizierung und Autorisierung geschützt.
- Für sensible Funktionen (z.B. Textgenerierung) sind bestimmte Benutzerrollen erforderlich.

## Erweiterungsmöglichkeiten

- Integration weiterer Modelle und Parameter
- Feinabstimmung der Modelle für spezifische Aufgaben
- Implementierung von Dokumentenanalyse und -klassifizierung
- Automatische Erstellung von Projektplänen basierend auf Anforderungen
- KI-gestützte Priorisierung von Aufgaben und Ressourcenzuweisung 
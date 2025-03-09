import fetch from 'node-fetch';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * Ollama API-Service für KI-Funktionen
 */
class OllamaService {
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiUrl = config.ollama.apiUrl;
    this.model = config.ollama.model;
  }

  /**
   * Generiert Text mit dem Ollama-Modell
   * @param prompt Der Eingabetext für die KI
   * @param options Optionale Parameter für die Generierung
   * @returns Der generierte Text
   */
  async generateText(prompt: string, options: GenerationOptions = {}): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || this.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
            top_k: options.topK || 40,
            max_tokens: options.maxTokens || 500,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API-Fehler: ${response.status} ${errorText}`);
      }

      const data = await response.json() as OllamaResponse;
      return data.response;
    } catch (error) {
      logger.error('Fehler bei der Ollama-Textgenerierung:', error);
      throw new Error('Fehler bei der KI-Textgenerierung');
    }
  }

  /**
   * Generiert Projektvorschläge basierend auf einer Beschreibung
   * @param description Die Projektbeschreibung
   * @returns Vorschläge für Projektziele, Meilensteine und Risiken
   */
  async generateProjectSuggestions(description: string): Promise<ProjectSuggestions> {
    try {
      const prompt = `
        Als KI-Assistent für Projektmanagement, analysiere bitte die folgende Projektbeschreibung 
        und generiere sinnvolle Vorschläge für Projektziele, Meilensteine und potenzielle Risiken.
        Formatiere die Antwort als JSON mit den Schlüsseln "objectives", "milestones" und "risks".
        
        Projektbeschreibung:
        ${description}
      `;

      const response = await this.generateText(prompt, { temperature: 0.7 });
      
      try {
        // Versuchen, die Antwort als JSON zu parsen
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0]);
          return {
            objectives: Array.isArray(jsonResponse.objectives) ? jsonResponse.objectives : [],
            milestones: Array.isArray(jsonResponse.milestones) ? jsonResponse.milestones : [],
            risks: Array.isArray(jsonResponse.risks) ? jsonResponse.risks : []
          };
        }
      } catch (parseError) {
        logger.error('Fehler beim Parsen der JSON-Antwort:', parseError);
      }

      // Fallback: Manuelles Parsen der Antwort
      return this.parseUnstructuredResponse(response);
    } catch (error) {
      logger.error('Fehler bei der Generierung von Projektvorschlägen:', error);
      return {
        objectives: [],
        milestones: [],
        risks: []
      };
    }
  }

  /**
   * Generiert Aufgabenvorschläge basierend auf einer Projektbeschreibung
   * @param projectDescription Die Projektbeschreibung
   * @param existingTasks Bestehende Aufgaben (optional)
   * @returns Vorschläge für Aufgaben
   */
  async generateTaskSuggestions(
    projectDescription: string, 
    existingTasks: string[] = []
  ): Promise<TaskSuggestion[]> {
    try {
      const existingTasksText = existingTasks.length > 0 
        ? `Bestehende Aufgaben:\n${existingTasks.join('\n')}` 
        : 'Es gibt noch keine bestehenden Aufgaben.';

      const prompt = `
        Als KI-Assistent für Projektmanagement, analysiere bitte die folgende Projektbeschreibung 
        und generiere sinnvolle Vorschläge für Aufgaben, die erledigt werden sollten.
        Berücksichtige dabei die bereits bestehenden Aufgaben und schlage neue, ergänzende Aufgaben vor.
        Formatiere die Antwort als JSON-Array mit Objekten, die die Schlüssel "title", "description", 
        "priority" (High, Medium, Low) und "estimatedHours" enthalten.
        
        Projektbeschreibung:
        ${projectDescription}
        
        ${existingTasksText}
      `;

      const response = await this.generateText(prompt, { temperature: 0.7 });
      
      try {
        // Versuchen, die Antwort als JSON zu parsen
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        logger.error('Fehler beim Parsen der JSON-Antwort:', parseError);
      }

      // Fallback: Leeres Array zurückgeben
      return [];
    } catch (error) {
      logger.error('Fehler bei der Generierung von Aufgabenvorschlägen:', error);
      return [];
    }
  }

  /**
   * Generiert eine Zusammenfassung eines Dokuments
   * @param content Der Dokumentinhalt
   * @returns Eine Zusammenfassung des Dokuments
   */
  async generateDocumentSummary(content: string): Promise<string> {
    try {
      const prompt = `
        Bitte fasse den folgenden Text prägnant zusammen und hebe die wichtigsten Punkte hervor:
        
        ${content}
      `;

      return await this.generateText(prompt, { 
        temperature: 0.5,
        maxTokens: 300
      });
    } catch (error) {
      logger.error('Fehler bei der Generierung der Dokumentzusammenfassung:', error);
      return 'Zusammenfassung konnte nicht generiert werden.';
    }
  }

  /**
   * Generiert einen Projektbericht basierend auf Projektdaten
   * @param projectData Die Projektdaten
   * @returns Ein generierter Projektbericht
   */
  async generateProjectReport(projectData: ProjectReportData): Promise<string> {
    try {
      const prompt = `
        Als KI-Assistent für Projektmanagement, erstelle bitte einen detaillierten Projektbericht 
        basierend auf den folgenden Daten. Der Bericht sollte eine Zusammenfassung des Projektstatus, 
        Fortschritte bei Meilensteinen, offene Risiken und nächste Schritte enthalten.
        
        Projektname: ${projectData.name}
        Beschreibung: ${projectData.description}
        Status: ${projectData.status}
        Startdatum: ${projectData.startDate}
        Enddatum: ${projectData.endDate}
        
        Meilensteine:
        ${projectData.milestones.map(m => `- ${m.title}: ${m.status} (Fällig: ${m.dueDate})`).join('\n')}
        
        Risiken:
        ${projectData.risks.map(r => `- ${r.title} (Auswirkung: ${r.impact}, Wahrscheinlichkeit: ${r.probability})`).join('\n')}
        
        Aufgabenstatus:
        - Abgeschlossen: ${projectData.taskStats.completed}
        - In Bearbeitung: ${projectData.taskStats.inProgress}
        - Offen: ${projectData.taskStats.todo}
        - Überfällig: ${projectData.taskStats.overdue}
        
        Formatiere den Bericht in Markdown mit Überschriften, Aufzählungen und Hervorhebungen.
      `;

      return await this.generateText(prompt, { 
        temperature: 0.7,
        maxTokens: 1000
      });
    } catch (error) {
      logger.error('Fehler bei der Generierung des Projektberichts:', error);
      return 'Projektbericht konnte nicht generiert werden.';
    }
  }

  /**
   * Hilfsfunktion zum Parsen unstrukturierter Antworten
   * @param response Die unstrukturierte Antwort
   * @returns Strukturierte Projektvorschläge
   */
  private parseUnstructuredResponse(response: string): ProjectSuggestions {
    const objectives: string[] = [];
    const milestones: any[] = [];
    const risks: any[] = [];

    // Einfache Heuristik zum Extrahieren von Informationen
    const lines = response.split('\n');
    let currentSection: 'objectives' | 'milestones' | 'risks' | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/ziele|objectives/i)) {
        currentSection = 'objectives';
        continue;
      } else if (trimmedLine.match(/meilensteine|milestones/i)) {
        currentSection = 'milestones';
        continue;
      } else if (trimmedLine.match(/risiken|risks/i)) {
        currentSection = 'risks';
        continue;
      }

      // Aufzählungszeichen erkennen
      if (trimmedLine.match(/^[-*•]\s+(.+)$/)) {
        const content = trimmedLine.replace(/^[-*•]\s+/, '');
        
        if (content && currentSection === 'objectives') {
          objectives.push(content);
        } else if (content && currentSection === 'milestones') {
          milestones.push({ title: content, dueDate: null, status: 'Pending' });
        } else if (content && currentSection === 'risks') {
          risks.push({ 
            title: content, 
            description: '', 
            impact: 'Medium', 
            probability: 'Medium' 
          });
        }
      }
    }

    return { objectives, milestones, risks };
  }
}

// Typen
interface GenerationOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ProjectSuggestions {
  objectives: string[];
  milestones: {
    title: string;
    dueDate: string | null;
    status: string;
  }[];
  risks: {
    title: string;
    description: string;
    impact: string;
    probability: string;
  }[];
}

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
}

export interface ProjectReportData {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  milestones: {
    title: string;
    status: string;
    dueDate: string;
  }[];
  risks: {
    title: string;
    impact: string;
    probability: string;
  }[];
  taskStats: {
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
  };
}

// Singleton-Instanz exportieren
const ollamaService = new OllamaService();
export default ollamaService; 
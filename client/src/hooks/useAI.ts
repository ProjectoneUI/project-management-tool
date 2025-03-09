import { useMutation } from 'react-query';
import api from '../services/api';

export const useAI = () => {
  // Text generieren
  const generateText = useMutation(
    (prompt: string) => api.post('/ai/generate-text', { prompt }),
    {
      onError: (error: any) => {
        console.error('Fehler beim Generieren von Text:', error);
      }
    }
  );

  // Projektvorschläge generieren
  const generateProjectSuggestions = useMutation(
    (description: string) => api.post('/ai/project-suggestions', { description }),
    {
      onError: (error: any) => {
        console.error('Fehler beim Generieren von Projektvorschlägen:', error);
      }
    }
  );

  // Aufgabenvorschläge generieren
  const generateTaskSuggestions = useMutation(
    (projectId: string) => api.post('/ai/task-suggestions', { projectId }),
    {
      onError: (error: any) => {
        console.error('Fehler beim Generieren von Aufgabenvorschlägen:', error);
      }
    }
  );

  // Dokumentzusammenfassung generieren
  const generateDocumentSummary = useMutation(
    (documentId: string) => api.post('/ai/document-summary', { documentId }),
    {
      onError: (error: any) => {
        console.error('Fehler beim Generieren einer Dokumentzusammenfassung:', error);
      }
    }
  );

  // Projektbericht generieren
  const generateProjectReport = useMutation(
    (projectId: string) => api.post('/ai/project-report', { projectId }),
    {
      onError: (error: any) => {
        console.error('Fehler beim Generieren eines Projektberichts:', error);
      }
    }
  );

  return {
    generateText,
    generateProjectSuggestions,
    generateTaskSuggestions,
    generateDocumentSummary,
    generateProjectReport
  };
}; 
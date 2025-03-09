import { Router } from 'express';
import { check } from 'express-validator';
import * as aiController from '../controllers/aiController';
import { authenticateJWT, authorize } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

/**
 * @route POST /api/ai/project-suggestions
 * @desc Projektvorschläge generieren
 * @access Private
 */
router.post(
  '/project-suggestions',
  [
    check('description', 'Projektbeschreibung ist erforderlich').not().isEmpty()
  ],
  aiController.generateProjectSuggestions
);

/**
 * @route POST /api/ai/task-suggestions
 * @desc Aufgabenvorschläge generieren
 * @access Private
 */
router.post(
  '/task-suggestions',
  [
    check('projectId', 'Projekt-ID ist erforderlich').isMongoId()
  ],
  aiController.generateTaskSuggestions
);

/**
 * @route POST /api/ai/document-summary
 * @desc Dokumentzusammenfassung generieren
 * @access Private
 */
router.post(
  '/document-summary',
  [
    check('documentId', 'Dokument-ID ist erforderlich').isMongoId()
  ],
  aiController.generateDocumentSummary
);

/**
 * @route POST /api/ai/project-report
 * @desc Projektbericht generieren
 * @access Private
 */
router.post(
  '/project-report',
  [
    check('projectId', 'Projekt-ID ist erforderlich').isMongoId()
  ],
  aiController.generateProjectReport
);

/**
 * @route POST /api/ai/generate-text
 * @desc Einfache Textgenerierung
 * @access Private (nur Admin und ProjectManager)
 */
router.post(
  '/generate-text',
  authorize(['admin', 'projectManager']),
  [
    check('prompt', 'Prompt ist erforderlich').not().isEmpty()
  ],
  aiController.generateText
);

// Platzhalter-Routen
router.post('/generate-text', (req, res) => {
  res.json({ 
    data: { 
      text: 'Dies ist ein generierter Text von der KI.' 
    } 
  });
});

router.post('/project-suggestions', (req, res) => {
  res.json({ 
    data: { 
      objectives: ['Ziel 1', 'Ziel 2', 'Ziel 3'],
      milestones: [
        { title: 'Meilenstein 1', dueDate: '2023-12-31', status: 'pending' },
        { title: 'Meilenstein 2', dueDate: '2024-01-31', status: 'pending' }
      ],
      risks: [
        { title: 'Risiko 1', description: 'Beschreibung 1', impact: 'hoch', probability: 'mittel' },
        { title: 'Risiko 2', description: 'Beschreibung 2', impact: 'mittel', probability: 'niedrig' }
      ]
    } 
  });
});

router.post('/task-suggestions', (req, res) => {
  res.json({ 
    data: [
      { title: 'Aufgabe 1', description: 'Beschreibung 1', priority: 'High', estimatedHours: 4 },
      { title: 'Aufgabe 2', description: 'Beschreibung 2', priority: 'Medium', estimatedHours: 2 },
      { title: 'Aufgabe 3', description: 'Beschreibung 3', priority: 'Low', estimatedHours: 1 }
    ]
  });
});

router.post('/document-summary', (req, res) => {
  res.json({ 
    data: { 
      title: 'Dokument-Titel',
      summary: 'Dies ist eine Zusammenfassung des Dokuments.' 
    } 
  });
});

router.post('/project-report', (req, res) => {
  res.json({ 
    data: { 
      name: 'Projekt-Name',
      report: '# Projektbericht\n\nDies ist ein Projektbericht mit Markdown-Formatierung.\n\n## Fortschritt\n\nDer Projektfortschritt beträgt 50%.\n\n## Empfehlungen\n\n- Empfehlung 1\n- Empfehlung 2' 
    } 
  });
});

export default router; 
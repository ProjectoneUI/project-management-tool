import { Router } from 'express';
import { check } from 'express-validator';
import * as taskController from '../controllers/taskController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

/**
 * @route GET /api/tasks
 * @desc Alle Aufgaben abrufen
 * @access Private
 */
router.get('/', taskController.getAllTasks);

/**
 * @route GET /api/tasks/:id
 * @desc Aufgabe nach ID abrufen
 * @access Private
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route POST /api/tasks
 * @desc Neue Aufgabe erstellen
 * @access Private
 */
router.post(
  '/',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('project', 'Projekt-ID ist erforderlich').isMongoId(),
    check('board', 'Board-ID ist erforderlich').isMongoId(),
    check('columnId', 'Spalten-ID ist erforderlich').isMongoId()
  ],
  taskController.createTask
);

/**
 * @route PUT /api/tasks/:id
 * @desc Aufgabe aktualisieren
 * @access Private
 */
router.put(
  '/:id',
  [
    check('title', 'Titel muss gültig sein').optional().not().isEmpty(),
    check('dueDate', 'Fälligkeitsdatum muss ein gültiges Datum sein').optional().isISO8601().toDate()
  ],
  taskController.updateTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc Aufgabe löschen
 * @access Private
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route PUT /api/tasks/:id/move
 * @desc Aufgabe einer anderen Spalte zuweisen
 * @access Private
 */
router.put(
  '/:id/move',
  [
    check('columnId', 'Spalten-ID ist erforderlich').isMongoId(),
    check('position', 'Position muss eine Zahl sein').optional().isNumeric()
  ],
  taskController.moveTask
);

/**
 * @route POST /api/tasks/:id/comments
 * @desc Kommentar zu einer Aufgabe hinzufügen
 * @access Private
 */
router.post(
  '/:id/comments',
  [
    check('content', 'Kommentarinhalt ist erforderlich').not().isEmpty()
  ],
  taskController.addComment
);

/**
 * @route POST /api/tasks/:id/attachments
 * @desc Anhang zu einer Aufgabe hinzufügen
 * @access Private
 */
router.post(
  '/:id/attachments',
  [
    check('fileName', 'Dateiname ist erforderlich').not().isEmpty(),
    check('filePath', 'Dateipfad ist erforderlich').not().isEmpty(),
    check('fileType', 'Dateityp ist erforderlich').not().isEmpty()
  ],
  taskController.addAttachment
);

/**
 * @route POST /api/tasks/:id/assignees
 * @desc Benutzer einer Aufgabe zuweisen
 * @access Private
 */
router.post(
  '/:id/assignees',
  [
    check('assignees', 'Benutzer-IDs müssen als Array angegeben werden').isArray()
  ],
  taskController.assignUsers
);

/**
 * @route DELETE /api/tasks/:id/assignees
 * @desc Benutzer von einer Aufgabe entfernen
 * @access Private
 */
router.delete(
  '/:id/assignees',
  [
    check('assignees', 'Benutzer-IDs müssen als Array angegeben werden').isArray()
  ],
  taskController.removeAssignees
);

export default router; 
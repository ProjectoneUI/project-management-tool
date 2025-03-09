import { Router } from 'express';
import { check } from 'express-validator';
import * as projectController from '../controllers/projectController';
import { authenticateJWT, authorize } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

/**
 * @route GET /api/projects
 * @desc Alle Projekte abrufen
 * @access Private
 */
router.get('/', projectController.getAllProjects);

/**
 * @route GET /api/projects/:id
 * @desc Projekt nach ID abrufen
 * @access Private
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route POST /api/projects
 * @desc Neues Projekt erstellen
 * @access Private (Projektmanager und Admin)
 */
router.post(
  '/',
  authorize(['admin', 'projectManager']),
  [
    check('name', 'Projektname ist erforderlich').not().isEmpty(),
    check('description', 'Projektbeschreibung ist erforderlich').not().isEmpty(),
    check('startDate', 'Startdatum ist erforderlich').isISO8601().toDate(),
    check('endDate', 'Enddatum ist erforderlich').isISO8601().toDate(),
    check('manager', 'Manager-ID ist erforderlich').isMongoId()
  ],
  projectController.createProject
);

/**
 * @route PUT /api/projects/:id
 * @desc Projekt aktualisieren
 * @access Private
 */
router.put(
  '/:id',
  [
    check('name', 'Projektname muss gültig sein').optional().not().isEmpty(),
    check('startDate', 'Startdatum muss ein gültiges Datum sein').optional().isISO8601().toDate(),
    check('endDate', 'Enddatum muss ein gültiges Datum sein').optional().isISO8601().toDate(),
    check('manager', 'Manager-ID muss eine gültige ID sein').optional().isMongoId()
  ],
  projectController.updateProject
);

/**
 * @route DELETE /api/projects/:id
 * @desc Projekt löschen
 * @access Private
 */
router.delete('/:id', projectController.deleteProject);

/**
 * @route POST /api/projects/:id/team
 * @desc Teammitglieder zum Projekt hinzufügen
 * @access Private
 */
router.post(
  '/:id/team',
  [
    check('members', 'Teammitglieder müssen ein Array von gültigen IDs sein').isArray().notEmpty()
  ],
  projectController.addTeamMembers
);

/**
 * @route DELETE /api/projects/:id/team
 * @desc Teammitglieder aus dem Projekt entfernen
 * @access Private
 */
router.delete(
  '/:id/team',
  [
    check('members', 'Teammitglieder müssen ein Array von gültigen IDs sein').isArray().notEmpty()
  ],
  projectController.removeTeamMembers
);

/**
 * @route POST /api/projects/:id/milestones
 * @desc Meilenstein zum Projekt hinzufügen
 * @access Private
 */
router.post(
  '/:id/milestones',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('dueDate', 'Fälligkeitsdatum muss ein gültiges Datum sein').isISO8601().toDate()
  ],
  projectController.addMilestone
);

/**
 * @route PUT /api/projects/:id/milestones/:milestoneId
 * @desc Meilenstein aktualisieren
 * @access Private
 */
router.put(
  '/:id/milestones/:milestoneId',
  [
    check('title', 'Titel muss gültig sein').optional().not().isEmpty(),
    check('dueDate', 'Fälligkeitsdatum muss ein gültiges Datum sein').optional().isISO8601().toDate()
  ],
  projectController.updateMilestone
);

/**
 * @route DELETE /api/projects/:id/milestones/:milestoneId
 * @desc Meilenstein löschen
 * @access Private
 */
router.delete('/:id/milestones/:milestoneId', projectController.deleteMilestone);

export default router; 
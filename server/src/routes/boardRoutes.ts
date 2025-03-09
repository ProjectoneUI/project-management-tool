import { Router } from 'express';
import { check } from 'express-validator';
import * as boardController from '../controllers/boardController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

/**
 * @route GET /api/boards
 * @desc Alle Boards abrufen
 * @access Private
 */
router.get('/', boardController.getAllBoards);

/**
 * @route GET /api/boards/:id
 * @desc Board nach ID abrufen
 * @access Private
 */
router.get('/:id', boardController.getBoardById);

/**
 * @route POST /api/boards
 * @desc Neues Board erstellen
 * @access Private
 */
router.post(
  '/',
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('project', 'Projekt-ID ist erforderlich').isMongoId()
  ],
  boardController.createBoard
);

/**
 * @route PUT /api/boards/:id
 * @desc Board aktualisieren
 * @access Private
 */
router.put(
  '/:id',
  [
    check('name', 'Name ist erforderlich').not().isEmpty()
  ],
  boardController.updateBoard
);

/**
 * @route DELETE /api/boards/:id
 * @desc Board löschen
 * @access Private
 */
router.delete('/:id', boardController.deleteBoard);

/**
 * @route POST /api/boards/:id/columns
 * @desc Spalte zum Board hinzufügen
 * @access Private
 */
router.post(
  '/:id/columns',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty()
  ],
  boardController.addColumn
);

/**
 * @route PUT /api/boards/:id/columns/:columnId
 * @desc Spalte aktualisieren
 * @access Private
 */
router.put(
  '/:id/columns/:columnId',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty()
  ],
  boardController.updateColumn
);

/**
 * @route DELETE /api/boards/:id/columns/:columnId
 * @desc Spalte löschen
 * @access Private
 */
router.delete('/:id/columns/:columnId', boardController.deleteColumn);

/**
 * @route PUT /api/boards/:id/columns/reorder
 * @desc Spaltenreihenfolge aktualisieren
 * @access Private
 */
router.put(
  '/:id/columns/reorder',
  [
    check('columnOrder', 'Spaltenreihenfolge ist erforderlich').isArray().notEmpty()
  ],
  boardController.reorderColumns
);

export default router; 
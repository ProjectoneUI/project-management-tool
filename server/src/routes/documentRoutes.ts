import { Router } from 'express';
import { check } from 'express-validator';
import * as documentController from '../controllers/documentController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

/**
 * @route GET /api/documents
 * @desc Alle Dokumente abrufen
 * @access Private
 */
router.get('/', documentController.getAllDocuments);

/**
 * @route GET /api/documents/:id
 * @desc Dokument nach ID abrufen
 * @access Private
 */
router.get('/:id', documentController.getDocumentById);

/**
 * @route POST /api/documents
 * @desc Neues Dokument erstellen
 * @access Private
 */
router.post(
  '/',
  [
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('content', 'Inhalt ist erforderlich').not().isEmpty(),
    check('project', 'Projekt-ID ist erforderlich').isMongoId()
  ],
  documentController.createDocument
);

/**
 * @route PUT /api/documents/:id
 * @desc Dokument aktualisieren
 * @access Private
 */
router.put(
  '/:id',
  [
    check('title', 'Titel muss gültig sein').optional().not().isEmpty()
  ],
  documentController.updateDocument
);

/**
 * @route DELETE /api/documents/:id
 * @desc Dokument löschen
 * @access Private
 */
router.delete('/:id', documentController.deleteDocument);

/**
 * @route GET /api/documents/:id/versions/:versionIndex
 * @desc Frühere Version eines Dokuments abrufen
 * @access Private
 */
router.get('/:id/versions/:versionIndex', documentController.getDocumentVersion);

/**
 * @route POST /api/documents/:id/versions/:versionIndex/restore
 * @desc Frühere Version eines Dokuments wiederherstellen
 * @access Private
 */
router.post('/:id/versions/:versionIndex/restore', documentController.restoreDocumentVersion);

/**
 * @route POST /api/documents/:id/tags
 * @desc Tag zu einem Dokument hinzufügen
 * @access Private
 */
router.post(
  '/:id/tags',
  [
    check('tag', 'Tag ist erforderlich').not().isEmpty()
  ],
  documentController.addTag
);

/**
 * @route DELETE /api/documents/:id/tags/:tag
 * @desc Tag von einem Dokument entfernen
 * @access Private
 */
router.delete('/:id/tags/:tag', documentController.removeTag);

export default router; 
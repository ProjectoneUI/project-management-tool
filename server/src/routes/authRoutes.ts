import { Router } from 'express';
import { check } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Benutzer registrieren
 * @access Public
 */
router.post(
  '/register',
  [
    check('username', 'Benutzername ist erforderlich').not().isEmpty(),
    check('email', 'Bitte geben Sie eine gültige E-Mail-Adresse an').isEmail(),
    check('password', 'Bitte geben Sie ein Passwort mit mindestens 6 Zeichen ein').isLength({ min: 6 }),
    check('firstName', 'Vorname ist erforderlich').not().isEmpty(),
    check('lastName', 'Nachname ist erforderlich').not().isEmpty()
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Benutzer anmelden
 * @access Public
 */
router.post(
  '/login',
  [
    check('email', 'Bitte geben Sie eine gültige E-Mail-Adresse an').isEmail(),
    check('password', 'Passwort ist erforderlich').exists()
  ],
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc Aktuellen Benutzer abrufen
 * @access Private
 */
router.get('/me', authenticateJWT, authController.getMe);

/**
 * @route POST /api/auth/refresh-token
 * @desc Token aktualisieren
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    check('token', 'Token ist erforderlich').not().isEmpty()
  ],
  authController.refreshToken
);

/**
 * @route PUT /api/auth/change-password
 * @desc Passwort ändern
 * @access Private
 */
router.put(
  '/change-password',
  authenticateJWT,
  [
    check('currentPassword', 'Aktuelles Passwort ist erforderlich').not().isEmpty(),
    check('newPassword', 'Neues Passwort muss mindestens 6 Zeichen lang sein').isLength({ min: 6 })
  ],
  authController.changePassword
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Passwort zurücksetzen (Anfrage)
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    check('email', 'Bitte geben Sie eine gültige E-Mail-Adresse an').isEmail()
  ],
  authController.forgotPassword
);

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout erfolgreich' });
});

export default router; 
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * Benutzerregistrierung
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(new AppError('Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits', 400));
    }

    // Neuen Benutzer erstellen
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // JWT-Token generieren
    const token = user.generateAuthToken();

    // Benutzerinformationen ohne Passwort zurückgeben
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Registrierungsfehler:', error);
    next(error);
  }
};

/**
 * Benutzeranmeldung
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Benutzer mit Passwort abrufen
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new AppError('Ungültige Anmeldeinformationen', 401));
    }

    // Passwort überprüfen
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return next(new AppError('Ungültige Anmeldeinformationen', 401));
    }

    // JWT-Token generieren
    const token = user.generateAuthToken();

    // Benutzerinformationen ohne Passwort zurückgeben
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Anmeldefehler:', error);
    next(error);
  }
};

/**
 * Aktuellen Benutzer abrufen
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('Benutzer nicht gefunden', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen des Benutzers:', error);
    next(error);
  }
};

/**
 * Token aktualisieren
 * @route POST /api/auth/refresh-token
 * @access Public
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return next(new AppError('Token ist erforderlich', 400));
    }

    // Token verifizieren und Benutzer-ID extrahieren
    // Hinweis: Dies ist eine vereinfachte Version, in der Produktion sollten Refresh-Tokens verwendet werden
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    
    if (!decoded || !decoded.id) {
      return next(new AppError('Ungültiger Token', 401));
    }

    // Benutzer abrufen
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new AppError('Benutzer nicht gefunden', 404));
    }

    // Neuen Token generieren
    const newToken = user.generateAuthToken();

    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch (error) {
    logger.error('Fehler beim Token-Refresh:', error);
    next(error);
  }
};

/**
 * Passwort ändern
 * @route PUT /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new AppError('Aktuelles und neues Passwort sind erforderlich', 400));
    }

    // Benutzer mit Passwort abrufen
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return next(new AppError('Benutzer nicht gefunden', 404));
    }

    // Aktuelles Passwort überprüfen
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return next(new AppError('Aktuelles Passwort ist falsch', 401));
    }

    // Neues Passwort setzen
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });
  } catch (error) {
    logger.error('Fehler beim Ändern des Passworts:', error);
    next(error);
  }
};

/**
 * Passwort zurücksetzen (Anfrage)
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('E-Mail ist erforderlich', 400));
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return next(new AppError('Benutzer mit dieser E-Mail existiert nicht', 404));
    }

    // In einer vollständigen Implementierung würde hier ein Token generiert und per E-Mail gesendet werden
    // Für dieses Beispiel geben wir einfach eine Erfolgsmeldung zurück

    res.status(200).json({
      success: true,
      message: 'Anweisungen zum Zurücksetzen des Passworts wurden an Ihre E-Mail gesendet'
    });
  } catch (error) {
    logger.error('Fehler beim Zurücksetzen des Passworts:', error);
    next(error);
  }
}; 
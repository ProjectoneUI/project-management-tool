import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/User';
import logger from '../utils/logger';

// Erweiterte Request-Schnittstelle mit Benutzerinformationen
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * JWT-Authentifizierungs-Middleware
 * Überprüft den JWT-Token im Authorization-Header und fügt Benutzerinformationen zur Anfrage hinzu
 */
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Token aus dem Authorization-Header extrahieren
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Kein Authentifizierungstoken bereitgestellt', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Ungültiges Token-Format', 401);
    }
    
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as jwt.JwtPayload;
    
    if (!decoded.id) {
      throw new AppError('Ungültiger Token', 401);
    }
    
    // Benutzer in der Datenbank überprüfen
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 401);
    }
    
    // Benutzerinformationen zur Anfrage hinzufügen
    req.user = {
      id: user._id.toString(),
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Ungültiger Token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token abgelaufen', 401));
    }
    
    logger.error('Authentifizierungsfehler:', error);
    next(error);
  }
};

/**
 * Rollenbasierte Autorisierungs-Middleware
 * Überprüft, ob der authentifizierte Benutzer die erforderlichen Rollen hat
 * @param roles Array von erlaubten Rollen
 */
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Nicht authentifiziert', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Keine Berechtigung für diese Aktion', 403));
    }
    
    next();
  };
};

/**
 * Ressourcenbesitzer-Autorisierungs-Middleware
 * Überprüft, ob der authentifizierte Benutzer der Besitzer der Ressource ist oder Admin-Rechte hat
 * @param model Mongoose-Modell der Ressource
 * @param idParam Name des ID-Parameters in der Anfrage
 */
export const authorizeOwner = (model: any, idParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Nicht authentifiziert', 401));
      }
      
      // Admin darf alles
      if (req.user.role === 'admin') {
        return next();
      }
      
      const resourceId = req.params[idParam];
      
      if (!resourceId) {
        return next(new AppError(`Parameter ${idParam} nicht gefunden`, 400));
      }
      
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return next(new AppError('Ressource nicht gefunden', 404));
      }
      
      // Überprüfen, ob der Benutzer der Besitzer ist
      // Annahme: Die Ressource hat ein 'createdBy' oder 'owner' Feld
      const ownerId = resource.createdBy || resource.owner;
      
      if (!ownerId || ownerId.toString() !== req.user.id) {
        return next(new AppError('Keine Berechtigung für diese Ressource', 403));
      }
      
      next();
    } catch (error) {
      logger.error('Autorisierungsfehler:', error);
      next(error);
    }
  };
}; 
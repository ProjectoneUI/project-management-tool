import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Benutzerdefinierte Fehlerklasse
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Fehlerbehandlungs-Middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Standardwerte für Fehler
  let statusCode = 500;
  let message = 'Serverfehler';
  let isOperational = false;

  // Wenn es sich um einen AppError handelt, verwenden wir dessen Eigenschaften
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Mongoose-Validierungsfehler
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === 'CastError') {
    // Mongoose-Casting-Fehler (z.B. ungültige ID)
    statusCode = 400;
    message = 'Ungültige Ressourcen-ID';
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT-Fehler
    statusCode = 401;
    message = 'Ungültiger Token. Bitte melden Sie sich erneut an.';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    // JWT-Ablauf
    statusCode = 401;
    message = 'Ihr Token ist abgelaufen. Bitte melden Sie sich erneut an.';
    isOperational = true;
  }

  // Nur nicht-operationelle Fehler in der Produktion loggen
  if (!isOperational) {
    logger.error(`[${req.method}] ${req.path} >> ${err.stack}`);
  }

  // Antwort senden
  res.status(statusCode).json({
    success: false,
    message,
    // Stack-Trace nur in der Entwicklung senden
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}; 
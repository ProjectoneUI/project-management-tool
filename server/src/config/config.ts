import dotenv from 'dotenv';
import path from 'path';

// Umgebungsvariablen aus .env-Datei laden
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Konfigurationsobjekt
const config = {
  // Server-Konfiguration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // MongoDB-Konfiguration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/project-management',
  },
  
  // JWT-Konfiguration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '1', 10),
  },
  
  // CORS-Konfiguration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  
  // Ollama-API-Konfiguration
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434/api',
    model: process.env.OLLAMA_MODEL || 'llama3',
  },
  
  // Microsoft-Integration (OneDrive, Outlook)
  microsoft: {
    appId: process.env.MICROSOFT_APP_ID || '',
    appSecret: process.env.MICROSOFT_APP_SECRET || '',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/integrations/microsoft/callback',
  },
  
  // Logging-Konfiguration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config; 
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './services/socketService';
import logger from './utils/logger';

// Umgebungsvariablen laden
dotenv.config();

// Express-App erstellen
const app = express();
const httpServer = createServer(app);

// Socket.io-Server erstellen
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API-Routen
app.use('/api', routes);

// Fehlerbehandlung
app.use(errorHandler);

// Socket.io-Handler einrichten
setupSocketHandlers(io);

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/project-management';
    await mongoose.connect(mongoURI);
    logger.info('MongoDB verbunden');
  } catch (err) {
    logger.error('MongoDB-Verbindungsfehler:', err);
    process.exit(1);
  }
};

// Server starten
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  await connectDB();
  logger.info(`Server läuft auf Port ${PORT}`);
});

// Unbehandelte Fehler abfangen
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unbehandelter Fehler:', err);
  process.exit(1);
});

export default app; 
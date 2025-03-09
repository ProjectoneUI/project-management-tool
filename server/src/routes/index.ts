import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import boardRoutes from './boardRoutes';
import documentRoutes from './documentRoutes';
import aiRoutes from './aiRoutes';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Öffentliche Routen
router.use('/auth', authRoutes);

// Geschützte Routen (erfordern Authentifizierung)
router.use('/projects', authenticateJWT, projectRoutes);
router.use('/tasks', authenticateJWT, taskRoutes);
router.use('/boards', authenticateJWT, boardRoutes);
router.use('/documents', authenticateJWT, documentRoutes);
router.use('/ai', authenticateJWT, aiRoutes);

// API-Status-Route
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// Health-Check-Route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 
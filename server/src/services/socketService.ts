import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

// Benutzer-Socket-Map für aktive Verbindungen
const connectedUsers = new Map<string, string>();

/**
 * Socket.io-Handler einrichten
 * @param io Socket.io-Server-Instanz
 */
export const setupSocketHandlers = (io: Server): void => {
  // Verbindungshandler
  io.on('connection', (socket: Socket) => {
    logger.info(`Neue Socket-Verbindung: ${socket.id}`);

    // Authentifizierung
    socket.on('authenticate', (userId: string) => {
      logger.info(`Benutzer ${userId} authentifiziert auf Socket ${socket.id}`);
      connectedUsers.set(userId, socket.id);
      
      // Benutzer einer Raum für persönliche Nachrichten beitreten lassen
      socket.join(`user:${userId}`);
      
      // Benachrichtigung über Online-Status senden
      io.emit('user:status', { userId, status: 'online' });
    });

    // Nachrichtenhandler
    socket.on('message:send', (data: { recipientId: string, content: string }) => {
      const { recipientId, content } = data;
      const senderId = getUserIdBySocketId(socket.id);
      
      if (!senderId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Nachricht von ${senderId} an ${recipientId}: ${content}`);
      
      // Nachricht an den Empfänger senden
      io.to(`user:${recipientId}`).emit('message:receive', {
        senderId,
        content,
        timestamp: new Date().toISOString()
      });
    });

    // Projekt-Updates
    socket.on('project:update', (data: { projectId: string, update: any }) => {
      const { projectId, update } = data;
      const userId = getUserIdBySocketId(socket.id);
      
      if (!userId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Projekt-Update für ${projectId} von ${userId}`);
      
      // Update an alle Benutzer im Projektraum senden
      io.to(`project:${projectId}`).emit('project:updated', {
        projectId,
        update,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    });

    // Aufgaben-Updates
    socket.on('task:update', (data: { taskId: string, update: any }) => {
      const { taskId, update } = data;
      const userId = getUserIdBySocketId(socket.id);
      
      if (!userId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Aufgaben-Update für ${taskId} von ${userId}`);
      
      // Update an alle relevanten Benutzer senden
      io.to(`task:${taskId}`).emit('task:updated', {
        taskId,
        update,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    });

    // Projektraum beitreten
    socket.on('project:join', (projectId: string) => {
      const userId = getUserIdBySocketId(socket.id);
      
      if (!userId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Benutzer ${userId} tritt Projektraum ${projectId} bei`);
      socket.join(`project:${projectId}`);
    });

    // Projektraum verlassen
    socket.on('project:leave', (projectId: string) => {
      const userId = getUserIdBySocketId(socket.id);
      
      if (!userId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Benutzer ${userId} verlässt Projektraum ${projectId}`);
      socket.leave(`project:${projectId}`);
    });

    // Aufgabenraum beitreten
    socket.on('task:join', (taskId: string) => {
      const userId = getUserIdBySocketId(socket.id);
      
      if (!userId) {
        socket.emit('error', { message: 'Nicht authentifiziert' });
        return;
      }
      
      logger.debug(`Benutzer ${userId} tritt Aufgabenraum ${taskId} bei`);
      socket.join(`task:${taskId}`);
    });

    // Trennung
    socket.on('disconnect', () => {
      const userId = getUserIdBySocketId(socket.id);
      
      if (userId) {
        logger.info(`Benutzer ${userId} getrennt`);
        connectedUsers.delete(userId);
        
        // Benachrichtigung über Offline-Status senden
        io.emit('user:status', { userId, status: 'offline' });
      } else {
        logger.info(`Socket ${socket.id} getrennt (nicht authentifiziert)`);
      }
    });
  });
};

/**
 * Benutzer-ID anhand der Socket-ID abrufen
 * @param socketId Socket-ID
 * @returns Benutzer-ID oder undefined, wenn nicht gefunden
 */
const getUserIdBySocketId = (socketId: string): string | undefined => {
  for (const [userId, sid] of connectedUsers.entries()) {
    if (sid === socketId) {
      return userId;
    }
  }
  return undefined;
};

/**
 * Prüfen, ob ein Benutzer online ist
 * @param userId Benutzer-ID
 * @returns true, wenn der Benutzer online ist, sonst false
 */
export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

/**
 * Socket-ID eines Benutzers abrufen
 * @param userId Benutzer-ID
 * @returns Socket-ID oder undefined, wenn nicht gefunden
 */
export const getSocketIdByUserId = (userId: string): string | undefined => {
  return connectedUsers.get(userId);
}; 
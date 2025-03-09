import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Document from '../models/Document';
import Project from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Alle Dokumente abrufen
 * @route GET /api/documents
 * @access Private
 */
export const getAllDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project, search, page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Basis-Query
    const query: any = {};
    
    // Nach Projekt filtern
    if (project) {
      query.project = project;
    }
    
    // Suchfilter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { 'tags': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Dokumente abrufen
    const documents = await Document.find(query)
      .populate('project', 'name')
      .populate('createdBy', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Gesamtanzahl der Dokumente für Pagination
    const total = await Document.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: documents
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Dokumente:', error);
    next(error);
  }
};

/**
 * Dokument nach ID abrufen
 * @route GET /api/documents/:id
 * @access Private
 */
export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    
    // Dokument abrufen
    const document = await Document.findById(documentId)
      .populate('project', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate({
        path: 'versions.updatedBy',
        select: 'firstName lastName email'
      });
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen des Dokuments:', error);
    next(error);
  }
};

/**
 * Neues Dokument erstellen
 * @route POST /api/documents
 * @access Private
 */
export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, project, fileInfo, tags } = req.body;
    
    // Prüfen, ob das Projekt existiert
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return next(new AppError('Das angegebene Projekt existiert nicht', 400));
    }
    
    // Neues Dokument erstellen
    const document = new Document({
      title,
      content,
      project,
      fileInfo: fileInfo || null,
      tags: tags || [],
      versions: [],
      createdBy: req.user?.id
    });
    
    await document.save();
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen des Dokuments:', error);
    next(error);
  }
};

/**
 * Dokument aktualisieren
 * @route PUT /api/documents/:id
 * @access Private
 */
export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const documentId = req.params.id;
    const { title, content, fileInfo, tags, changeDescription } = req.body;
    
    // Dokument abrufen
    const document = await Document.findById(documentId);
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Aktuelle Version speichern
    if (content && content !== document.content) {
      document.versions.push({
        content: document.content,
        updatedBy: document.versions.length > 0 
          ? document.versions[document.versions.length - 1].updatedBy 
          : document.createdBy,
        updatedAt: new Date(),
        changeDescription: changeDescription || 'Inhalt aktualisiert'
      });
    }
    
    // Dokument aktualisieren
    document.title = title || document.title;
    document.content = content || document.content;
    document.fileInfo = fileInfo || document.fileInfo;
    document.tags = tags || document.tags;
    
    await document.save();
    
    // Aktualisiertes Dokument zurückgeben
    const updatedDocument = await Document.findById(documentId)
      .populate('project', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate({
        path: 'versions.updatedBy',
        select: 'firstName lastName email'
      });
    
    res.status(200).json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Dokuments:', error);
    next(error);
  }
};

/**
 * Dokument löschen
 * @route DELETE /api/documents/:id
 * @access Private
 */
export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    
    // Dokument abrufen
    const document = await Document.findById(documentId);
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Dokument löschen
    await Document.findByIdAndDelete(documentId);
    
    res.status(200).json({
      success: true,
      message: 'Dokument erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error('Fehler beim Löschen des Dokuments:', error);
    next(error);
  }
};

/**
 * Frühere Version eines Dokuments abrufen
 * @route GET /api/documents/:id/versions/:versionIndex
 * @access Private
 */
export const getDocumentVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: documentId, versionIndex } = req.params;
    const versionIdx = parseInt(versionIndex, 10);
    
    if (isNaN(versionIdx)) {
      return next(new AppError('Ungültiger Versionsindex', 400));
    }
    
    // Dokument abrufen
    const document = await Document.findById(documentId)
      .populate({
        path: 'versions.updatedBy',
        select: 'firstName lastName email'
      });
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Prüfen, ob die Version existiert
    if (versionIdx < 0 || versionIdx >= document.versions.length) {
      return next(new AppError('Version nicht gefunden', 404));
    }
    
    const version = document.versions[versionIdx];
    
    res.status(200).json({
      success: true,
      data: {
        version,
        versionIndex: versionIdx,
        totalVersions: document.versions.length
      }
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Dokumentversion:', error);
    next(error);
  }
};

/**
 * Frühere Version eines Dokuments wiederherstellen
 * @route POST /api/documents/:id/versions/:versionIndex/restore
 * @access Private
 */
export const restoreDocumentVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: documentId, versionIndex } = req.params;
    const versionIdx = parseInt(versionIndex, 10);
    
    if (isNaN(versionIdx)) {
      return next(new AppError('Ungültiger Versionsindex', 400));
    }
    
    // Dokument abrufen
    const document = await Document.findById(documentId);
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Prüfen, ob die Version existiert
    if (versionIdx < 0 || versionIdx >= document.versions.length) {
      return next(new AppError('Version nicht gefunden', 404));
    }
    
    // Aktuelle Version speichern
    document.versions.push({
      content: document.content,
      updatedBy: req.user?.id,
      updatedAt: new Date(),
      changeDescription: 'Automatisch gespeichert vor Wiederherstellung'
    });
    
    // Inhalt aus der ausgewählten Version wiederherstellen
    const version = document.versions[versionIdx];
    document.content = version.content;
    
    // Neue Version mit Wiederherstellungshinweis erstellen
    document.versions.push({
      content: version.content,
      updatedBy: req.user?.id,
      updatedAt: new Date(),
      changeDescription: `Version ${versionIdx + 1} wiederhergestellt`
    });
    
    await document.save();
    
    // Aktualisiertes Dokument zurückgeben
    const updatedDocument = await Document.findById(documentId)
      .populate('project', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate({
        path: 'versions.updatedBy',
        select: 'firstName lastName email'
      });
    
    res.status(200).json({
      success: true,
      message: `Version ${versionIdx + 1} erfolgreich wiederhergestellt`,
      data: updatedDocument
    });
  } catch (error) {
    logger.error('Fehler beim Wiederherstellen der Dokumentversion:', error);
    next(error);
  }
};

/**
 * Tag zu einem Dokument hinzufügen
 * @route POST /api/documents/:id/tags
 * @access Private
 */
export const addTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const { tag } = req.body;
    
    if (!tag) {
      return next(new AppError('Tag ist erforderlich', 400));
    }
    
    // Dokument abrufen
    const document = await Document.findById(documentId);
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Prüfen, ob der Tag bereits existiert
    if (document.tags.includes(tag)) {
      return res.status(200).json({
        success: true,
        message: 'Tag existiert bereits',
        data: document
      });
    }
    
    // Tag hinzufügen
    document.tags.push(tag);
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Tag erfolgreich hinzugefügt',
      data: document
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen des Tags:', error);
    next(error);
  }
};

/**
 * Tag von einem Dokument entfernen
 * @route DELETE /api/documents/:id/tags/:tag
 * @access Private
 */
export const removeTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: documentId, tag } = req.params;
    
    if (!tag) {
      return next(new AppError('Tag ist erforderlich', 400));
    }
    
    // Dokument abrufen
    const document = await Document.findById(documentId);
    
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }
    
    // Tag entfernen
    document.tags = document.tags.filter(t => t !== tag);
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Tag erfolgreich entfernt',
      data: document
    });
  } catch (error) {
    logger.error('Fehler beim Entfernen des Tags:', error);
    next(error);
  }
}; 
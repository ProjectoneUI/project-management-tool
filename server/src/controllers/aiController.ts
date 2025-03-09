import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Project from '../models/Project';
import Task from '../models/Task';
import Document from '../models/Document';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import ollamaService, { ProjectReportData } from '../ai/ollamaService';
import logger from '../utils/logger';

/**
 * Projektvorschläge generieren
 * @route POST /api/ai/project-suggestions
 * @access Private
 */
export const generateProjectSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return next(new AppError('Projektbeschreibung ist erforderlich', 400));
    }

    // Vorschläge generieren
    const suggestions = await ollamaService.generateProjectSuggestions(description);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Fehler bei der Generierung von Projektvorschlägen:', error);
    next(error);
  }
};

/**
 * Aufgabenvorschläge generieren
 * @route POST /api/ai/task-suggestions
 * @access Private
 */
export const generateTaskSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.body;

    if (!projectId) {
      return next(new AppError('Projekt-ID ist erforderlich', 400));
    }

    // Projekt abrufen
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }

    // Bestehende Aufgaben abrufen
    const existingTasks = await Task.find({ project: projectId });
    const existingTaskTitles = existingTasks.map(task => task.title);

    // Vorschläge generieren
    const suggestions = await ollamaService.generateTaskSuggestions(
      project.description,
      existingTaskTitles
    );

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Fehler bei der Generierung von Aufgabenvorschlägen:', error);
    next(error);
  }
};

/**
 * Dokumentzusammenfassung generieren
 * @route POST /api/ai/document-summary
 * @access Private
 */
export const generateDocumentSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId } = req.body;

    if (!documentId) {
      return next(new AppError('Dokument-ID ist erforderlich', 400));
    }

    // Dokument abrufen
    const document = await Document.findById(documentId);
    if (!document) {
      return next(new AppError('Dokument nicht gefunden', 404));
    }

    // Zusammenfassung generieren
    const summary = await ollamaService.generateDocumentSummary(document.content);

    res.status(200).json({
      success: true,
      data: {
        summary,
        documentTitle: document.title
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Generierung der Dokumentzusammenfassung:', error);
    next(error);
  }
};

/**
 * Projektbericht generieren
 * @route POST /api/ai/project-report
 * @access Private
 */
export const generateProjectReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.body;

    if (!projectId) {
      return next(new AppError('Projekt-ID ist erforderlich', 400));
    }

    // Projekt abrufen
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }

    // Aufgaben abrufen
    const tasks = await Task.find({ project: projectId });

    // Aufgabenstatistik berechnen
    const taskStats = {
      completed: tasks.filter(task => task.status === 'Done').length,
      inProgress: tasks.filter(task => task.status === 'InProgress').length,
      todo: tasks.filter(task => task.status === 'Todo').length,
      overdue: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate < today && task.status !== 'Done';
      }).length
    };

    // Projektdaten für den Bericht vorbereiten
    const projectData: ProjectReportData = {
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate.toISOString().split('T')[0],
      milestones: project.milestones.map(m => ({
        title: m.title,
        status: m.status,
        dueDate: m.dueDate.toISOString().split('T')[0]
      })),
      risks: project.risks.map(r => ({
        title: r.title,
        impact: r.impact,
        probability: r.probability
      })),
      taskStats
    };

    // Bericht generieren
    const report = await ollamaService.generateProjectReport(projectData);

    res.status(200).json({
      success: true,
      data: {
        report,
        projectName: project.name
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Generierung des Projektberichts:', error);
    next(error);
  }
};

/**
 * Einfache Textgenerierung
 * @route POST /api/ai/generate-text
 * @access Private
 */
export const generateText = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return next(new AppError('Prompt ist erforderlich', 400));
    }

    // Text generieren
    const generatedText = await ollamaService.generateText(prompt, options || {});

    res.status(200).json({
      success: true,
      data: {
        text: generatedText
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Textgenerierung:', error);
    next(error);
  }
}; 
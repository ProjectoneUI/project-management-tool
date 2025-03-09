import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Board from '../models/Board';
import Project from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Alle Aufgaben abrufen
 * @route GET /api/tasks
 * @access Private
 */
export const getAllTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      project, 
      board, 
      status, 
      priority, 
      assignee, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Basis-Query
    const query: any = {};
    
    // Filter
    if (project) query.project = project;
    if (board) query.board = board;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignees = assignee;
    
    // Suchfilter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Aufgaben abrufen
    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('board', 'name')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Gesamtanzahl der Aufgaben für Pagination
    const total = await Task.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: tasks
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Aufgaben:', error);
    next(error);
  }
};

/**
 * Aufgabe nach ID abrufen
 * @route GET /api/tasks/:id
 * @access Private
 */
export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId)
      .populate('project', 'name')
      .populate('board', 'name')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('dependencies', 'title status')
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email avatar'
      })
      .populate({
        path: 'attachments.uploadedBy',
        select: 'firstName lastName email'
      })
      .populate('createdBy', 'firstName lastName email');
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Aufgabe:', error);
    next(error);
  }
};

/**
 * Neue Aufgabe erstellen
 * @route POST /api/tasks
 * @access Private
 */
export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      title,
      description,
      project,
      board,
      columnId,
      assignees,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags,
      dependencies
    } = req.body;
    
    // Prüfen, ob das Projekt existiert
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return next(new AppError('Das angegebene Projekt existiert nicht', 400));
    }
    
    // Prüfen, ob das Board existiert
    const boardExists = await Board.findById(board);
    if (!boardExists) {
      return next(new AppError('Das angegebene Board existiert nicht', 400));
    }
    
    // Prüfen, ob die Spalte im Board existiert
    const column = boardExists.columns.id(columnId);
    if (!column) {
      return next(new AppError('Die angegebene Spalte existiert nicht', 400));
    }
    
    // Neue Aufgabe erstellen
    const task = new Task({
      title,
      description: description || '',
      project,
      board,
      columnId,
      assignees: assignees || [],
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      tags: tags || [],
      attachments: [],
      comments: [],
      dependencies: dependencies || [],
      createdBy: req.user?.id
    });
    
    await task.save();
    
    // Aufgabe zur Spalte hinzufügen
    column.tasks.push(task._id);
    await boardExists.save();
    
    // Aufgabe mit Beziehungen zurückgeben
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('board', 'name')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('dependencies', 'title status')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen der Aufgabe:', error);
    next(error);
  }
};

/**
 * Aufgabe aktualisieren
 * @route PUT /api/tasks/:id
 * @access Private
 */
export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const taskId = req.params.id;
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    const {
      title,
      description,
      assignees,
      status,
      priority,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
      dependencies
    } = req.body;
    
    // Aufgabe aktualisieren
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        assignees: assignees || task.assignees,
        status: status || task.status,
        priority: priority || task.priority,
        dueDate: dueDate || task.dueDate,
        estimatedHours: estimatedHours !== undefined ? estimatedHours : task.estimatedHours,
        actualHours: actualHours !== undefined ? actualHours : task.actualHours,
        tags: tags || task.tags,
        dependencies: dependencies || task.dependencies
      },
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('board', 'name')
      .populate('assignees', 'firstName lastName email avatar')
      .populate('dependencies', 'title status')
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email avatar'
      })
      .populate({
        path: 'attachments.uploadedBy',
        select: 'firstName lastName email'
      })
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Aufgabe:', error);
    next(error);
  }
};

/**
 * Aufgabe löschen
 * @route DELETE /api/tasks/:id
 * @access Private
 */
export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Board abrufen und Aufgabe aus der Spalte entfernen
    const board = await Board.findById(task.board);
    
    if (board) {
      const column = board.columns.id(task.columnId);
      
      if (column) {
        column.tasks = column.tasks.filter(
          t => t.toString() !== taskId
        );
        
        await board.save();
      }
    }
    
    // Aufgabe löschen
    await Task.findByIdAndDelete(taskId);
    
    res.status(200).json({
      success: true,
      message: 'Aufgabe erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error('Fehler beim Löschen der Aufgabe:', error);
    next(error);
  }
};

/**
 * Aufgabe einer anderen Spalte zuweisen
 * @route PUT /api/tasks/:id/move
 * @access Private
 */
export const moveTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { columnId, position } = req.body;
    
    if (!columnId) {
      return next(new AppError('Spalten-ID ist erforderlich', 400));
    }
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Board abrufen
    const board = await Board.findById(task.board);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Prüfen, ob die Zielspalte existiert
    const targetColumn = board.columns.id(columnId);
    
    if (!targetColumn) {
      return next(new AppError('Zielspalte nicht gefunden', 404));
    }
    
    // Quellspalte abrufen
    const sourceColumn = board.columns.id(task.columnId);
    
    if (!sourceColumn) {
      return next(new AppError('Quellspalte nicht gefunden', 404));
    }
    
    // Aufgabe aus der Quellspalte entfernen
    sourceColumn.tasks = sourceColumn.tasks.filter(
      t => t.toString() !== taskId
    );
    
    // Aufgabe in die Zielspalte einfügen
    if (position !== undefined && position >= 0 && position <= targetColumn.tasks.length) {
      targetColumn.tasks.splice(position, 0, task._id);
    } else {
      targetColumn.tasks.push(task._id);
    }
    
    // Status der Aufgabe aktualisieren, wenn die Spalte einem bestimmten Status entspricht
    // Dies ist eine vereinfachte Implementierung - in der Praxis könnte dies komplexer sein
    if (targetColumn.title === 'To Do') {
      task.status = 'Todo';
    } else if (targetColumn.title === 'In Progress') {
      task.status = 'InProgress';
    } else if (targetColumn.title === 'Review') {
      task.status = 'Review';
    } else if (targetColumn.title === 'Done') {
      task.status = 'Done';
    }
    
    // Spalten-ID der Aufgabe aktualisieren
    task.columnId = columnId;
    
    // Änderungen speichern
    await Promise.all([board.save(), task.save()]);
    
    res.status(200).json({
      success: true,
      message: 'Aufgabe erfolgreich verschoben',
      data: {
        task,
        board
      }
    });
  } catch (error) {
    logger.error('Fehler beim Verschieben der Aufgabe:', error);
    next(error);
  }
};

/**
 * Kommentar zu einer Aufgabe hinzufügen
 * @route POST /api/tasks/:id/comments
 * @access Private
 */
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;
    
    if (!content) {
      return next(new AppError('Kommentarinhalt ist erforderlich', 400));
    }
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Kommentar hinzufügen
    const comment = {
      content,
      author: req.user?.id,
      createdAt: new Date()
    };
    
    task.comments.push(comment);
    await task.save();
    
    // Aufgabe mit dem neuen Kommentar zurückgeben
    const updatedTask = await Task.findById(taskId)
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email avatar'
      });
    
    res.status(201).json({
      success: true,
      data: updatedTask?.comments[updatedTask.comments.length - 1],
      task: updatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen des Kommentars:', error);
    next(error);
  }
};

/**
 * Anhang zu einer Aufgabe hinzufügen
 * @route POST /api/tasks/:id/attachments
 * @access Private
 */
export const addAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { fileName, filePath, fileType } = req.body;
    
    if (!fileName || !filePath || !fileType) {
      return next(new AppError('Dateiname, Dateipfad und Dateityp sind erforderlich', 400));
    }
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Anhang hinzufügen
    const attachment = {
      fileName,
      filePath,
      fileType,
      uploadedBy: req.user?.id,
      uploadedAt: new Date()
    };
    
    task.attachments.push(attachment);
    await task.save();
    
    // Aufgabe mit dem neuen Anhang zurückgeben
    const updatedTask = await Task.findById(taskId)
      .populate({
        path: 'attachments.uploadedBy',
        select: 'firstName lastName email'
      });
    
    res.status(201).json({
      success: true,
      data: updatedTask?.attachments[updatedTask.attachments.length - 1],
      task: updatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen des Anhangs:', error);
    next(error);
  }
};

/**
 * Benutzer einer Aufgabe zuweisen
 * @route POST /api/tasks/:id/assignees
 * @access Private
 */
export const assignUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { assignees } = req.body;
    
    if (!assignees || !Array.isArray(assignees)) {
      return next(new AppError('Benutzer-IDs müssen als Array angegeben werden', 400));
    }
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Benutzer zuweisen (Duplikate vermeiden)
    const currentAssignees = task.assignees.map(a => a.toString());
    const newAssignees = assignees.filter(a => !currentAssignees.includes(a));
    
    task.assignees = [...task.assignees, ...newAssignees];
    await task.save();
    
    // Aktualisierte Aufgabe zurückgeben
    const updatedTask = await Task.findById(taskId)
      .populate('assignees', 'firstName lastName email avatar');
    
    res.status(200).json({
      success: true,
      message: `${newAssignees.length} Benutzer zugewiesen`,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Zuweisen von Benutzern:', error);
    next(error);
  }
};

/**
 * Benutzer von einer Aufgabe entfernen
 * @route DELETE /api/tasks/:id/assignees
 * @access Private
 */
export const removeAssignees = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { assignees } = req.body;
    
    if (!assignees || !Array.isArray(assignees)) {
      return next(new AppError('Benutzer-IDs müssen als Array angegeben werden', 400));
    }
    
    // Aufgabe abrufen
    const task = await Task.findById(taskId);
    
    if (!task) {
      return next(new AppError('Aufgabe nicht gefunden', 404));
    }
    
    // Benutzer entfernen
    task.assignees = task.assignees.filter(
      a => !assignees.includes(a.toString())
    );
    
    await task.save();
    
    // Aktualisierte Aufgabe zurückgeben
    const updatedTask = await Task.findById(taskId)
      .populate('assignees', 'firstName lastName email avatar');
    
    res.status(200).json({
      success: true,
      message: 'Benutzer erfolgreich entfernt',
      data: updatedTask
    });
  } catch (error) {
    logger.error('Fehler beim Entfernen von Benutzern:', error);
    next(error);
  }
}; 
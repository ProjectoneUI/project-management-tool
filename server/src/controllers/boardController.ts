import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Board from '../models/Board';
import Project from '../models/Project';
import Task from '../models/Task';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Alle Boards abrufen
 * @route GET /api/boards
 * @access Private
 */
export const getAllBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project } = req.query;
    
    // Basis-Query
    const query: any = {};
    
    // Nach Projekt filtern
    if (project) {
      query.project = project;
    }
    
    // Boards abrufen
    const boards = await Board.find(query)
      .populate('project', 'name')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: boards.length,
      data: boards
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Boards:', error);
    next(error);
  }
};

/**
 * Board nach ID abrufen
 * @route GET /api/boards/:id
 * @access Private
 */
export const getBoardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.id;
    
    // Board abrufen
    const board = await Board.findById(boardId)
      .populate('project', 'name')
      .populate({
        path: 'columns.tasks',
        select: 'title description status priority dueDate assignees',
        populate: {
          path: 'assignees',
          select: 'firstName lastName avatar'
        }
      });
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen des Boards:', error);
    next(error);
  }
};

/**
 * Neues Board erstellen
 * @route POST /api/boards
 * @access Private
 */
export const createBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, project, columns } = req.body;
    
    // Prüfen, ob das Projekt existiert
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return next(new AppError('Das angegebene Projekt existiert nicht', 400));
    }
    
    // Standardspalten, falls keine angegeben wurden
    const defaultColumns = [
      { title: 'To Do', order: 0, tasks: [] },
      { title: 'In Progress', order: 1, tasks: [] },
      { title: 'Review', order: 2, tasks: [] },
      { title: 'Done', order: 3, tasks: [] }
    ];
    
    // Neues Board erstellen
    const board = new Board({
      name,
      project,
      columns: columns || defaultColumns
    });
    
    await board.save();
    
    res.status(201).json({
      success: true,
      data: board
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen des Boards:', error);
    next(error);
  }
};

/**
 * Board aktualisieren
 * @route PUT /api/boards/:id
 * @access Private
 */
export const updateBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const boardId = req.params.id;
    const { name } = req.body;
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Board aktualisieren
    board.name = name || board.name;
    await board.save();
    
    res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Boards:', error);
    next(error);
  }
};

/**
 * Board löschen
 * @route DELETE /api/boards/:id
 * @access Private
 */
export const deleteBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.id;
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Alle Aufgaben des Boards löschen
    const taskIds = board.columns.reduce((acc, column) => {
      return [...acc, ...column.tasks];
    }, [] as mongoose.Types.ObjectId[]);
    
    if (taskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIds } });
    }
    
    // Board löschen
    await Board.findByIdAndDelete(boardId);
    
    res.status(200).json({
      success: true,
      message: 'Board erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error('Fehler beim Löschen des Boards:', error);
    next(error);
  }
};

/**
 * Spalte zum Board hinzufügen
 * @route POST /api/boards/:id/columns
 * @access Private
 */
export const addColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.id;
    const { title } = req.body;
    
    if (!title) {
      return next(new AppError('Spaltentitel ist erforderlich', 400));
    }
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Höchste Reihenfolge ermitteln
    const maxOrder = board.columns.length > 0
      ? Math.max(...board.columns.map(col => col.order))
      : -1;
    
    // Spalte hinzufügen
    board.columns.push({
      title,
      order: maxOrder + 1,
      tasks: []
    });
    
    await board.save();
    
    res.status(201).json({
      success: true,
      data: board.columns[board.columns.length - 1],
      board
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen der Spalte:', error);
    next(error);
  }
};

/**
 * Spalte aktualisieren
 * @route PUT /api/boards/:id/columns/:columnId
 * @access Private
 */
export const updateColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: boardId, columnId } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return next(new AppError('Spaltentitel ist erforderlich', 400));
    }
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Spalte finden
    const column = board.columns.id(columnId);
    
    if (!column) {
      return next(new AppError('Spalte nicht gefunden', 404));
    }
    
    // Spalte aktualisieren
    column.title = title;
    await board.save();
    
    res.status(200).json({
      success: true,
      data: column,
      board
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Spalte:', error);
    next(error);
  }
};

/**
 * Spalte löschen
 * @route DELETE /api/boards/:id/columns/:columnId
 * @access Private
 */
export const deleteColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: boardId, columnId } = req.params;
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Spalte finden
    const columnIndex = board.columns.findIndex(col => col._id.toString() === columnId);
    
    if (columnIndex === -1) {
      return next(new AppError('Spalte nicht gefunden', 404));
    }
    
    // Aufgaben der Spalte löschen
    const taskIds = board.columns[columnIndex].tasks;
    
    if (taskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIds } });
    }
    
    // Spalte entfernen
    board.columns.splice(columnIndex, 1);
    
    // Reihenfolge der verbleibenden Spalten aktualisieren
    board.columns.forEach((col, index) => {
      col.order = index;
    });
    
    await board.save();
    
    res.status(200).json({
      success: true,
      message: 'Spalte erfolgreich gelöscht',
      board
    });
  } catch (error) {
    logger.error('Fehler beim Löschen der Spalte:', error);
    next(error);
  }
};

/**
 * Spaltenreihenfolge aktualisieren
 * @route PUT /api/boards/:id/columns/reorder
 * @access Private
 */
export const reorderColumns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.id;
    const { columnOrder } = req.body;
    
    if (!columnOrder || !Array.isArray(columnOrder)) {
      return next(new AppError('Spaltenreihenfolge muss als Array angegeben werden', 400));
    }
    
    // Board abrufen
    const board = await Board.findById(boardId);
    
    if (!board) {
      return next(new AppError('Board nicht gefunden', 404));
    }
    
    // Prüfen, ob alle Spalten-IDs gültig sind
    const columnIds = board.columns.map(col => col._id.toString());
    const allIdsValid = columnOrder.every(id => columnIds.includes(id));
    
    if (!allIdsValid || columnOrder.length !== board.columns.length) {
      return next(new AppError('Ungültige Spalten-IDs in der Reihenfolge', 400));
    }
    
    // Spalten neu anordnen
    const reorderedColumns = columnOrder.map((id, index) => {
      const column = board.columns.find(col => col._id.toString() === id);
      if (column) {
        column.order = index;
      }
      return column;
    });
    
    board.columns = reorderedColumns as any;
    await board.save();
    
    res.status(200).json({
      success: true,
      message: 'Spaltenreihenfolge erfolgreich aktualisiert',
      data: board
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Spaltenreihenfolge:', error);
    next(error);
  }
}; 
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Project from '../models/Project';
import User from '../models/User';
import Board from '../models/Board';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Alle Projekte abrufen
 * @route GET /api/projects
 * @access Private
 */
export const getAllProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Basis-Query
    const query: any = {};
    
    // Wenn der Benutzer kein Admin ist, nur eigene Projekte oder Projekte, in denen er Teammitglied ist, anzeigen
    if (req.user?.role !== 'admin') {
      query.$or = [
        { createdBy: req.user?.id },
        { manager: req.user?.id },
        { team: req.user?.id }
      ];
    }
    
    // Suchfilter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Statusfilter
    if (status) {
      query.status = status;
    }
    
    // Projekte abrufen
    const projects = await Project.find(query)
      .populate('manager', 'firstName lastName email avatar')
      .populate('team', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Gesamtanzahl der Projekte für Pagination
    const total = await Project.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: projects
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Projekte:', error);
    next(error);
  }
};

/**
 * Projekt nach ID abrufen
 * @route GET /api/projects/:id
 * @access Private
 */
export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    
    // Projekt abrufen
    const project = await Project.findById(projectId)
      .populate('manager', 'firstName lastName email avatar')
      .populate('team', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email');
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Zugriff auf das Projekt hat
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id &&
      !project.team.some(member => member._id.toString() === req.user?.id)
    ) {
      return next(new AppError('Keine Berechtigung für dieses Projekt', 403));
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen des Projekts:', error);
    next(error);
  }
};

/**
 * Neues Projekt erstellen
 * @route POST /api/projects
 * @access Private
 */
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      description,
      objectives,
      startDate,
      endDate,
      status,
      manager,
      team,
      milestones,
      risks,
      resources,
      budget
    } = req.body;
    
    // Prüfen, ob der Manager existiert
    const managerExists = await User.findById(manager);
    if (!managerExists) {
      return next(new AppError('Der angegebene Manager existiert nicht', 400));
    }
    
    // Prüfen, ob alle Teammitglieder existieren
    if (team && team.length > 0) {
      const teamCount = await User.countDocuments({ _id: { $in: team } });
      if (teamCount !== team.length) {
        return next(new AppError('Einige der angegebenen Teammitglieder existieren nicht', 400));
      }
    }
    
    // Neues Projekt erstellen
    const project = new Project({
      name,
      description,
      objectives: objectives || [],
      startDate,
      endDate,
      status: status || 'Planning',
      manager,
      team: team || [],
      milestones: milestones || [],
      risks: risks || [],
      resources: resources || [],
      budget: budget || { planned: 0, actual: 0, currency: 'EUR' },
      createdBy: req.user?.id
    });
    
    await project.save();
    
    // Standard-Board für das Projekt erstellen
    const board = new Board({
      project: project._id,
      name: 'Hauptboard',
      columns: [
        { title: 'To Do', order: 0, tasks: [] },
        { title: 'In Progress', order: 1, tasks: [] },
        { title: 'Review', order: 2, tasks: [] },
        { title: 'Done', order: 3, tasks: [] }
      ]
    });
    
    await board.save();
    
    res.status(201).json({
      success: true,
      data: project,
      board
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen des Projekts:', error);
    next(error);
  }
};

/**
 * Projekt aktualisieren
 * @route PUT /api/projects/:id
 * @access Private
 */
export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const projectId = req.params.id;
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer das Projekt aktualisieren darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Aktualisieren dieses Projekts', 403));
    }
    
    const {
      name,
      description,
      objectives,
      startDate,
      endDate,
      status,
      manager,
      team,
      milestones,
      risks,
      resources,
      budget
    } = req.body;
    
    // Prüfen, ob der Manager existiert
    if (manager) {
      const managerExists = await User.findById(manager);
      if (!managerExists) {
        return next(new AppError('Der angegebene Manager existiert nicht', 400));
      }
    }
    
    // Prüfen, ob alle Teammitglieder existieren
    if (team && team.length > 0) {
      const teamCount = await User.countDocuments({ _id: { $in: team } });
      if (teamCount !== team.length) {
        return next(new AppError('Einige der angegebenen Teammitglieder existieren nicht', 400));
      }
    }
    
    // Projekt aktualisieren
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        name: name || project.name,
        description: description || project.description,
        objectives: objectives || project.objectives,
        startDate: startDate || project.startDate,
        endDate: endDate || project.endDate,
        status: status || project.status,
        manager: manager || project.manager,
        team: team || project.team,
        milestones: milestones || project.milestones,
        risks: risks || project.risks,
        resources: resources || project.resources,
        budget: budget || project.budget
      },
      { new: true, runValidators: true }
    )
      .populate('manager', 'firstName lastName email avatar')
      .populate('team', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Projekts:', error);
    next(error);
  }
};

/**
 * Projekt löschen
 * @route DELETE /api/projects/:id
 * @access Private
 */
export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer das Projekt löschen darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Löschen dieses Projekts', 403));
    }
    
    // Projekt löschen
    await Project.findByIdAndDelete(projectId);
    
    // Zugehörige Boards löschen
    await Board.deleteMany({ project: projectId });
    
    // Hier könnten weitere zugehörige Ressourcen gelöscht werden (Tasks, Dokumente, etc.)
    
    res.status(200).json({
      success: true,
      message: 'Projekt erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error('Fehler beim Löschen des Projekts:', error);
    next(error);
  }
};

/**
 * Teammitglieder zum Projekt hinzufügen
 * @route POST /api/projects/:id/team
 * @access Private
 */
export const addTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { members } = req.body;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return next(new AppError('Bitte geben Sie gültige Teammitglieder an', 400));
    }
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Teammitglieder hinzufügen darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Hinzufügen von Teammitgliedern', 403));
    }
    
    // Prüfen, ob alle Mitglieder existieren
    const membersCount = await User.countDocuments({ _id: { $in: members } });
    if (membersCount !== members.length) {
      return next(new AppError('Einige der angegebenen Benutzer existieren nicht', 400));
    }
    
    // Teammitglieder hinzufügen (Duplikate vermeiden)
    const currentTeam = project.team.map(member => member.toString());
    const newMembers = members.filter(member => !currentTeam.includes(member));
    
    if (newMembers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Alle angegebenen Mitglieder sind bereits im Team',
        data: project
      });
    }
    
    project.team = [...project.team, ...newMembers];
    await project.save();
    
    const updatedProject = await Project.findById(projectId)
      .populate('manager', 'firstName lastName email avatar')
      .populate('team', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: `${newMembers.length} Teammitglieder hinzugefügt`,
      data: updatedProject
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen von Teammitgliedern:', error);
    next(error);
  }
};

/**
 * Teammitglieder aus dem Projekt entfernen
 * @route DELETE /api/projects/:id/team
 * @access Private
 */
export const removeTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { members } = req.body;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return next(new AppError('Bitte geben Sie gültige Teammitglieder an', 400));
    }
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Teammitglieder entfernen darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Entfernen von Teammitgliedern', 403));
    }
    
    // Teammitglieder entfernen
    project.team = project.team.filter(
      member => !members.includes(member.toString())
    );
    
    await project.save();
    
    const updatedProject = await Project.findById(projectId)
      .populate('manager', 'firstName lastName email avatar')
      .populate('team', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: `Teammitglieder erfolgreich entfernt`,
      data: updatedProject
    });
  } catch (error) {
    logger.error('Fehler beim Entfernen von Teammitgliedern:', error);
    next(error);
  }
};

/**
 * Meilenstein zum Projekt hinzufügen
 * @route POST /api/projects/:id/milestones
 * @access Private
 */
export const addMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { title, description, dueDate, status } = req.body;
    
    if (!title || !dueDate) {
      return next(new AppError('Titel und Fälligkeitsdatum sind erforderlich', 400));
    }
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Meilensteine hinzufügen darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Hinzufügen von Meilensteinen', 403));
    }
    
    // Meilenstein hinzufügen
    const milestone = {
      title,
      description: description || '',
      dueDate,
      status: status || 'Pending'
    };
    
    project.milestones.push(milestone);
    await project.save();
    
    res.status(201).json({
      success: true,
      data: project.milestones[project.milestones.length - 1],
      project
    });
  } catch (error) {
    logger.error('Fehler beim Hinzufügen des Meilensteins:', error);
    next(error);
  }
};

/**
 * Meilenstein aktualisieren
 * @route PUT /api/projects/:id/milestones/:milestoneId
 * @access Private
 */
export const updateMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const { title, description, dueDate, status } = req.body;
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Meilensteine aktualisieren darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Aktualisieren von Meilensteinen', 403));
    }
    
    // Meilenstein finden
    const milestone = project.milestones.id(milestoneId);
    
    if (!milestone) {
      return next(new AppError('Meilenstein nicht gefunden', 404));
    }
    
    // Meilenstein aktualisieren
    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (dueDate) milestone.dueDate = new Date(dueDate);
    if (status) milestone.status = status;
    
    await project.save();
    
    res.status(200).json({
      success: true,
      data: milestone,
      project
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Meilensteins:', error);
    next(error);
  }
};

/**
 * Meilenstein löschen
 * @route DELETE /api/projects/:id/milestones/:milestoneId
 * @access Private
 */
export const deleteMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    
    // Projekt abrufen
    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Projekt nicht gefunden', 404));
    }
    
    // Prüfen, ob der Benutzer Meilensteine löschen darf
    if (
      req.user?.role !== 'admin' &&
      project.createdBy.toString() !== req.user?.id &&
      project.manager.toString() !== req.user?.id
    ) {
      return next(new AppError('Keine Berechtigung zum Löschen von Meilensteinen', 403));
    }
    
    // Meilenstein finden und entfernen
    const milestoneIndex = project.milestones.findIndex(
      m => m._id.toString() === milestoneId
    );
    
    if (milestoneIndex === -1) {
      return next(new AppError('Meilenstein nicht gefunden', 404));
    }
    
    project.milestones.splice(milestoneIndex, 1);
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Meilenstein erfolgreich gelöscht',
      project
    });
  } catch (error) {
    logger.error('Fehler beim Löschen des Meilensteins:', error);
    next(error);
  }
}; 
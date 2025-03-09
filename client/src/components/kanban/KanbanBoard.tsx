import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import KanbanCard from './KanbanCard';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';

// Typen
interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: User[];
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Column {
  _id: string;
  title: string;
  order: number;
  tasks: Task[];
}

interface Board {
  _id: string;
  name: string;
  project: {
    _id: string;
    name: string;
  };
  columns: Column[];
}

interface KanbanBoardProps {
  projectId: string;
  boardId?: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, boardId }) => {
  const queryClient = useQueryClient();
  const [board, setBoard] = useState<Board | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editColumnId, setEditColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  // Board-Daten abrufen
  const { data, isLoading, error } = useQuery(
    ['board', boardId || 'default'],
    async () => {
      if (boardId) {
        // Spezifisches Board abrufen
        const response = await api.get(`/boards/${boardId}`);
        return response.data.data;
      } else {
        // Boards für das Projekt abrufen und das erste verwenden
        const response = await api.get('/boards', { params: { project: projectId } });
        if (response.data.data.length === 0) {
          // Kein Board gefunden, ein neues erstellen
          const newBoardResponse = await api.post('/boards', {
            name: 'Hauptboard',
            project: projectId
          });
          return newBoardResponse.data.data;
        }
        return response.data.data[0];
      }
    },
    {
      onSuccess: (data) => {
        setBoard(data);
      }
    }
  );

  // Spalte hinzufügen
  const addColumnMutation = useMutation(
    (title: string) => api.post(`/boards/${board?._id}/columns`, { title }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId || 'default']);
        setIsAddColumnDialogOpen(false);
        setNewColumnTitle('');
      }
    }
  );

  // Spalte aktualisieren
  const updateColumnMutation = useMutation(
    ({ columnId, title }: { columnId: string; title: string }) => 
      api.put(`/boards/${board?._id}/columns/${columnId}`, { title }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId || 'default']);
        setEditColumnId(null);
        setEditColumnTitle('');
      }
    }
  );

  // Spalte löschen
  const deleteColumnMutation = useMutation(
    (columnId: string) => api.delete(`/boards/${board?._id}/columns/${columnId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId || 'default']);
        setColumnMenuAnchorEl(null);
        setActiveColumnId(null);
      }
    }
  );

  // Aufgabe verschieben
  const moveTaskMutation = useMutation(
    ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) => 
      api.put(`/tasks/${taskId}/move`, { columnId, position }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId || 'default']);
      }
    }
  );

  // Drag-and-Drop-Handler
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Wenn kein Ziel oder gleiche Position, nichts tun
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Lokale Aktualisierung für bessere UX
    if (board) {
      const newBoard = { ...board };
      const sourceColumn = newBoard.columns.find(col => col._id === source.droppableId);
      const destColumn = newBoard.columns.find(col => col._id === destination.droppableId);
      
      if (sourceColumn && destColumn) {
        // Aufgabe aus der Quellspalte entfernen
        const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
        
        // Aufgabe in die Zielspalte einfügen
        destColumn.tasks.splice(destination.index, 0, movedTask);
        
        setBoard(newBoard);
      }
    }

    // API-Aufruf zum Verschieben der Aufgabe
    moveTaskMutation.mutate({
      taskId: draggableId,
      columnId: destination.droppableId,
      position: destination.index
    });
  };

  // Spaltenmenü öffnen
  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    setColumnMenuAnchorEl(event.currentTarget);
    setActiveColumnId(columnId);
  };

  // Spaltenmenü schließen
  const handleColumnMenuClose = () => {
    setColumnMenuAnchorEl(null);
    setActiveColumnId(null);
  };

  // Spalte bearbeiten
  const handleEditColumn = () => {
    if (activeColumnId && board) {
      const column = board.columns.find(col => col._id === activeColumnId);
      if (column) {
        setEditColumnId(activeColumnId);
        setEditColumnTitle(column.title);
        handleColumnMenuClose();
      }
    }
  };

  // Spalte löschen
  const handleDeleteColumn = () => {
    if (activeColumnId) {
      deleteColumnMutation.mutate(activeColumnId);
    }
  };

  // Spalte hinzufügen Dialog öffnen
  const handleAddColumnDialogOpen = () => {
    setIsAddColumnDialogOpen(true);
  };

  // Spalte hinzufügen Dialog schließen
  const handleAddColumnDialogClose = () => {
    setIsAddColumnDialogOpen(false);
    setNewColumnTitle('');
  };

  // Spalte hinzufügen
  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumnMutation.mutate(newColumnTitle.trim());
    }
  };

  // Spalte aktualisieren
  const handleUpdateColumn = () => {
    if (editColumnId && editColumnTitle.trim()) {
      updateColumnMutation.mutate({
        columnId: editColumnId,
        title: editColumnTitle.trim()
      });
    }
  };

  // Wenn Daten geladen werden
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Wenn ein Fehler auftritt
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Fehler beim Laden des Boards</Typography>
      </Box>
    );
  }

  // Wenn kein Board gefunden wurde
  if (!board) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Kein Board gefunden</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Board-Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{board.name}</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddColumnDialogOpen}
        >
          Spalte hinzufügen
        </Button>
      </Box>

      {/* Kanban-Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box 
          sx={{ 
            display: 'flex', 
            overflowX: 'auto', 
            p: 2, 
            height: 'calc(100vh - 180px)',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
            }
          }}
        >
          {board.columns.sort((a, b) => a.order - b.order).map((column) => (
            <Box 
              key={column._id} 
              sx={{ 
                minWidth: 280, 
                width: 280, 
                mr: 2, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
              }}
            >
              {/* Spalten-Header */}
              <Paper 
                sx={{ 
                  p: 1, 
                  mb: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: theme => theme.palette.mode === 'dark' ? '#333' : '#f5f5f5'
                }}
              >
                {editColumnId === column._id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <TextField
                      size="small"
                      value={editColumnTitle}
                      onChange={(e) => setEditColumnTitle(e.target.value)}
                      fullWidth
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateColumn();
                        }
                      }}
                    />
                    <Button 
                      size="small" 
                      onClick={handleUpdateColumn}
                      sx={{ ml: 1 }}
                    >
                      Speichern
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {column.title} ({column.tasks.length})
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleColumnMenuOpen(e, column._id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Paper>

              {/* Aufgaben-Liste */}
              <Droppable droppableId={column._id}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ 
                      flex: 1, 
                      overflowY: 'auto',
                      backgroundColor: theme => 
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 1,
                      p: 1,
                      '&::-webkit-scrollbar': {
                        width: 6,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: 3,
                      }
                    }}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <KanbanCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Aufgabe hinzufügen Button */}
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={<AddIcon />}
                      sx={{ mt: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                      // Hier könnte ein Dialog zum Hinzufügen einer Aufgabe geöffnet werden
                    >
                      Aufgabe hinzufügen
                    </Button>
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>

      {/* Spaltenmenü */}
      <Menu
        anchorEl={columnMenuAnchorEl}
        open={Boolean(columnMenuAnchorEl)}
        onClose={handleColumnMenuClose}
      >
        <MenuItem onClick={handleEditColumn}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Bearbeiten
        </MenuItem>
        <MenuItem onClick={handleDeleteColumn}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Löschen
        </MenuItem>
      </Menu>

      {/* Spalte hinzufügen Dialog */}
      <Dialog open={isAddColumnDialogOpen} onClose={handleAddColumnDialogClose}>
        <DialogTitle>Neue Spalte hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Spaltentitel"
            fullWidth
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddColumn();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddColumnDialogClose}>Abbrechen</Button>
          <Button 
            onClick={handleAddColumn}
            disabled={!newColumnTitle.trim()}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard; 
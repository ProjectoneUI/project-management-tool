import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  AvatarGroup, 
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Flag as FlagIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Typen
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: User[];
}

interface KanbanCardProps {
  task: Task;
  onClick?: (taskId: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick }) => {
  // Prioritätsfarbe bestimmen
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Prioritätstext bestimmen
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'Hoch';
      case 'Medium':
        return 'Mittel';
      case 'Low':
        return 'Niedrig';
      default:
        return priority;
    }
  };

  // Statusfarbe bestimmen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Todo':
        return 'default';
      case 'InProgress':
        return 'primary';
      case 'Review':
        return 'info';
      case 'Done':
        return 'success';
      default:
        return 'default';
    }
  };

  // Statustext bestimmen
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Todo':
        return 'Zu erledigen';
      case 'InProgress':
        return 'In Bearbeitung';
      case 'Review':
        return 'Prüfung';
      case 'Done':
        return 'Erledigt';
      default:
        return status;
    }
  };

  // Fälligkeitsdatum formatieren
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd. MMM yyyy', { locale: de });
    } catch (error) {
      return null;
    }
  };

  // Prüfen, ob das Fälligkeitsdatum überschritten ist
  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today && task.status !== 'Done';
    } catch (error) {
      return false;
    }
  };

  // Karte anklicken
  const handleClick = () => {
    if (onClick) {
      onClick(task._id);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3
        }
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Titel und Menü */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            {task.title}
          </Typography>
          <IconButton 
            size="small" 
            sx={{ ml: 1, mt: -0.5, mr: -0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              // Hier könnte ein Menü geöffnet werden
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Beschreibung (gekürzt) */}
        {task.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1.5, 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {task.description}
          </Typography>
        )}
        
        {/* Status und Priorität */}
        <Box sx={{ display: 'flex', mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip 
            label={getStatusText(task.status)} 
            size="small" 
            color={getStatusColor(task.status) as any}
            variant="outlined"
          />
          <Chip 
            icon={<FlagIcon />} 
            label={getPriorityText(task.priority)} 
            size="small" 
            color={getPriorityColor(task.priority) as any}
            variant="outlined"
          />
        </Box>
        
        {/* Fälligkeitsdatum und Zugewiesene Benutzer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {task.dueDate ? (
            <Tooltip title="Fälligkeitsdatum">
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: isOverdue(task.dueDate) ? 'error.main' : 'text.secondary'
                }}
              >
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption">
                  {formatDueDate(task.dueDate)}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Box />
          )}
          
          {task.assignees && task.assignees.length > 0 && (
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
              {task.assignees.map((assignee) => (
                <Tooltip key={assignee._id} title={`${assignee.firstName} ${assignee.lastName}`}>
                  <Avatar 
                    alt={`${assignee.firstName} ${assignee.lastName}`} 
                    src={assignee.avatar}
                  />
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KanbanCard; 
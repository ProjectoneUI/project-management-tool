import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  CircularProgress
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Label as LabelIcon,
  Add as AddIcon,
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';

// Typen
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Version {
  _id: string;
  content: string;
  updatedBy: User;
  updatedAt: string;
  changeDescription: string;
}

interface Document {
  _id: string;
  title: string;
  content: string;
  project: {
    _id: string;
    name: string;
  };
  fileInfo?: {
    fileName: string;
    filePath: string;
    fileType: string;
    oneDriveId?: string;
  };
  tags: string[];
  versions: Version[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface DocumentViewerProps {
  documentId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versionPreviewOpen, setVersionPreviewOpen] = useState(false);

  // Dokument abrufen
  const { data: document, isLoading, error } = useQuery<Document>(
    ['document', documentId],
    async () => {
      const response = await api.get(`/documents/${documentId}`);
      return response.data.data;
    }
  );

  // Tag hinzufügen
  const addTagMutation = useMutation(
    (tag: string) => api.post(`/documents/${documentId}/tags`, { tag }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', documentId]);
        setAddTagDialogOpen(false);
        setNewTag('');
      }
    }
  );

  // Tag entfernen
  const removeTagMutation = useMutation(
    (tag: string) => api.delete(`/documents/${documentId}/tags/${tag}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', documentId]);
      }
    }
  );

  // Version wiederherstellen
  const restoreVersionMutation = useMutation(
    (versionIndex: number) => 
      api.post(`/documents/${documentId}/versions/${versionIndex}/restore`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', documentId]);
        setVersionsDialogOpen(false);
        setVersionPreviewOpen(false);
        setSelectedVersion(null);
      }
    }
  );

  // Menü öffnen
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Menü schließen
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Bearbeiten
  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit();
  };

  // Löschen
  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete();
  };

  // Versionen anzeigen
  const handleShowVersions = () => {
    handleMenuClose();
    setVersionsDialogOpen(true);
  };

  // Tag-Dialog öffnen
  const handleAddTagDialogOpen = () => {
    handleMenuClose();
    setAddTagDialogOpen(true);
  };

  // Tag hinzufügen
  const handleAddTag = () => {
    if (newTag.trim()) {
      addTagMutation.mutate(newTag.trim());
    }
  };

  // Tag entfernen
  const handleRemoveTag = (tag: string) => {
    removeTagMutation.mutate(tag);
  };

  // Version auswählen
  const handleSelectVersion = (version: Version) => {
    setSelectedVersion(version);
    setVersionPreviewOpen(true);
  };

  // Version wiederherstellen
  const handleRestoreVersion = () => {
    if (document && selectedVersion) {
      const versionIndex = document.versions.findIndex(
        v => v._id === selectedVersion._id
      );
      
      if (versionIndex !== -1) {
        restoreVersionMutation.mutate(versionIndex);
      }
    }
  };

  // Datum formatieren
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd. MMMM yyyy, HH:mm', { locale: de });
    } catch (error) {
      return dateString;
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
  if (error || !document) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Fehler beim Laden des Dokuments</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Dokument-Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {document.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Erstellt von {document.createdBy.firstName} {document.createdBy.lastName} am {formatDate(document.createdAt)}
            {document.createdAt !== document.updatedAt && 
              ` • Aktualisiert am ${formatDate(document.updatedAt)}`}
          </Typography>
        </Box>
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Tags */}
      {document.tags.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {document.tags.map(tag => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              onDelete={() => handleRemoveTag(tag)}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Dokument-Inhalt */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          backgroundColor: theme => 
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2
        }}
      >
        <ReactMarkdown>
          {document.content}
        </ReactMarkdown>
      </Paper>

      {/* Menü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShowVersions}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Versionen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddTagDialogOpen}>
          <ListItemIcon>
            <LabelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Tag hinzufügen</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {/* Versionen-Dialog */}
      <Dialog 
        open={versionsDialogOpen} 
        onClose={() => setVersionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Dokumentversionen</DialogTitle>
        <DialogContent>
          <List>
            {document.versions.length === 0 ? (
              <ListItem>
                <Typography>Keine früheren Versionen verfügbar</Typography>
              </ListItem>
            ) : (
              document.versions.map((version, index) => (
                <ListItem key={version._id} disablePadding>
                  <ListItemButton onClick={() => handleSelectVersion(version)}>
                    <ListItemText 
                      primary={`Version ${index + 1}: ${version.changeDescription}`}
                      secondary={`${version.updatedBy.firstName} ${version.updatedBy.lastName} • ${formatDate(version.updatedAt)}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Versionsvorschau-Dialog */}
      <Dialog 
        open={versionPreviewOpen} 
        onClose={() => setVersionPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Versionsvorschau</DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {selectedVersion.changeDescription}
              </Typography>
              <Typography variant="caption" display="block" gutterBottom color="text.secondary">
                Bearbeitet von {selectedVersion.updatedBy.firstName} {selectedVersion.updatedBy.lastName} am {formatDate(selectedVersion.updatedAt)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2
                }}
              >
                <ReactMarkdown>
                  {selectedVersion.content}
                </ReactMarkdown>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionPreviewOpen(false)}>Abbrechen</Button>
          <Button 
            startIcon={<RestoreIcon />}
            onClick={handleRestoreVersion}
            color="primary"
          >
            Diese Version wiederherstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag hinzufügen Dialog */}
      <Dialog open={addTagDialogOpen} onClose={() => setAddTagDialogOpen(false)}>
        <DialogTitle>Tag hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Neuer Tag"
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTagDialogOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            startIcon={<AddIcon />}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentViewer; 
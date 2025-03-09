import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  InputAdornment, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../services/api';
import DocumentViewer from '../components/documents/DocumentViewer';
import DocumentEditor from '../components/documents/DocumentEditor';

// Typen
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Document {
  _id: string;
  title: string;
  content: string;
  project: {
    _id: string;
    name: string;
  };
  tags: string[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
}

// Ansichtsmodi
enum ViewMode {
  LIST = 'list',
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Projekte abrufen
  const { data: projects } = useQuery<Project[]>(
    'projects',
    async () => {
      const response = await api.get('/projects');
      return response.data.data;
    }
  );

  // Dokumente abrufen
  const { data: documentsData, isLoading } = useQuery(
    ['documents', page, limit, searchTerm, projectFilter],
    async () => {
      const params: any = { page, limit };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (projectFilter) {
        params.project = projectFilter;
      }
      
      const response = await api.get('/documents', { params });
      return response.data;
    }
  );

  // Dokument löschen
  const deleteDocumentMutation = useMutation(
    (documentId: string) => api.delete(`/documents/${documentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
        if (viewMode !== ViewMode.LIST) {
          setViewMode(ViewMode.LIST);
          setSelectedDocument(null);
        }
      }
    }
  );

  // Menü öffnen
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, documentId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveDocumentId(documentId);
  };

  // Menü schließen
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveDocumentId(null);
  };

  // Dokument anzeigen
  const handleViewDocument = (documentId: string) => {
    setSelectedDocument(documentId);
    setViewMode(ViewMode.VIEW);
    handleMenuClose();
  };

  // Dokument bearbeiten
  const handleEditDocument = (documentId: string) => {
    setSelectedDocument(documentId);
    setViewMode(ViewMode.EDIT);
    handleMenuClose();
  };

  // Dokument löschen Dialog öffnen
  const handleDeleteDialogOpen = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Dokument löschen
  const handleDeleteDocument = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete);
    }
  };

  // Neues Dokument erstellen
  const handleCreateDocument = () => {
    setViewMode(ViewMode.CREATE);
    setSelectedDocument(null);
  };

  // Zurück zur Liste
  const handleBackToList = () => {
    setViewMode(ViewMode.LIST);
    setSelectedDocument(null);
  };

  // Seitenänderung
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Projektfilter ändern
  const handleProjectFilterChange = (event: SelectChangeEvent) => {
    setProjectFilter(event.target.value);
    setPage(1);
  };

  // Datum formatieren
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd. MMM yyyy', { locale: de });
    } catch (error) {
      return dateString;
    }
  };

  // Dokument nach dem Speichern anzeigen
  const handleDocumentSaved = (documentId: string) => {
    setSelectedDocument(documentId);
    setViewMode(ViewMode.VIEW);
  };

  // Wenn Dokument-Ansicht aktiv ist
  if (viewMode === ViewMode.VIEW && selectedDocument) {
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outlined" onClick={handleBackToList}>
            Zurück zur Liste
          </Button>
          <Box>
            <Button 
              variant="outlined" 
              sx={{ mr: 1 }}
              onClick={() => handleEditDocument(selectedDocument)}
            >
              Bearbeiten
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => handleDeleteDialogOpen(selectedDocument)}
            >
              Löschen
            </Button>
          </Box>
        </Box>
        <DocumentViewer 
          documentId={selectedDocument} 
          onEdit={() => handleEditDocument(selectedDocument)}
          onDelete={() => handleDeleteDialogOpen(selectedDocument)}
        />
      </Box>
    );
  }

  // Wenn Dokument-Bearbeitung aktiv ist
  if (viewMode === ViewMode.EDIT && selectedDocument) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={handleBackToList}>
            Zurück zur Liste
          </Button>
        </Box>
        <DocumentEditor 
          documentId={selectedDocument}
          onSave={handleDocumentSaved}
          onCancel={handleBackToList}
        />
      </Box>
    );
  }

  // Wenn Dokument-Erstellung aktiv ist
  if (viewMode === ViewMode.CREATE) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={handleBackToList}>
            Zurück zur Liste
          </Button>
        </Box>
        <DocumentEditor 
          onSave={handleDocumentSaved}
          onCancel={handleBackToList}
        />
      </Box>
    );
  }

  // Dokumentenliste
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dokumente</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateDocument}
        >
          Neues Dokument
        </Button>
      </Box>

      {/* Filter und Suche */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Dokumente durchsuchen..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="project-filter-label">Projekt</InputLabel>
          <Select
            labelId="project-filter-label"
            value={projectFilter}
            label="Projekt"
            onChange={handleProjectFilterChange}
          >
            <MenuItem value="">Alle Projekte</MenuItem>
            {projects?.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Dokumentenliste */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : documentsData?.data?.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Keine Dokumente gefunden
          </Typography>
          <Typography color="text.secondary" paragraph>
            Erstellen Sie ein neues Dokument oder ändern Sie Ihre Suchkriterien.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateDocument}
          >
            Neues Dokument erstellen
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {documentsData?.data?.map((document: Document) => (
              <Grid item xs={12} sm={6} md={4} key={document._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewDocument(document._id)}
                >
                  <CardContent sx={{ flexGrow: 1, position: 'relative', pt: 4 }}>
                    <IconButton 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, document._id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    
                    <Typography variant="h6" gutterBottom noWrap>
                      {document.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Projekt: {document.project.name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      Erstellt am {formatDate(document.createdAt)} von {document.createdBy.firstName} {document.createdBy.lastName}
                    </Typography>
                    
                    {document.tags.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {document.tags.slice(0, 3).map(tag => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                        {document.tags.length > 3 && (
                          <Chip label={`+${document.tags.length - 3}`} size="small" />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {documentsData?.pagination?.totalPages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={documentsData.pagination.totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}

      {/* Dokument-Menü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => activeDocumentId && handleViewDocument(activeDocumentId)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => activeDocumentId && handleEditDocument(activeDocumentId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => activeDocumentId && handleDeleteDialogOpen(activeDocumentId)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {/* Löschen-Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sind Sie sicher, dass Sie dieses Dokument löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={handleDeleteDocument} 
            color="error"
            autoFocus
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents; 
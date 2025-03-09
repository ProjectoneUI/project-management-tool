import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Divider, 
  CircularProgress,
  Tabs,
  Tab,
  Autocomplete,
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon,
  Preview as PreviewIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';

// Typen
interface Document {
  _id?: string;
  title: string;
  content: string;
  project: {
    _id: string;
    name: string;
  };
  tags: string[];
}

interface Project {
  _id: string;
  name: string;
}

interface DocumentEditorProps {
  documentId?: string;
  projectId?: string;
  onSave?: (documentId: string) => void;
  onCancel?: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  documentId, 
  projectId, 
  onSave, 
  onCancel 
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Projekte abrufen
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>(
    'projects',
    async () => {
      const response = await api.get('/projects');
      return response.data.data;
    }
  );

  // Dokument abrufen, wenn es bearbeitet wird
  const { data: document, isLoading: isLoadingDocument } = useQuery(
    ['document', documentId],
    async () => {
      if (!documentId) return null;
      const response = await api.get(`/documents/${documentId}`);
      return response.data.data;
    },
    {
      enabled: !!documentId,
      onSuccess: (data) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setSelectedProject(data.project);
          setTags(data.tags || []);
        }
      }
    }
  );

  // Dokument erstellen
  const createDocumentMutation = useMutation(
    (newDocument: Partial<Document>) => api.post('/documents', newDocument),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('documents');
        if (onSave) {
          onSave(response.data.data._id);
        }
        setIsSaving(false);
      },
      onError: () => {
        setIsSaving(false);
      }
    }
  );

  // Dokument aktualisieren
  const updateDocumentMutation = useMutation(
    ({ id, updatedDocument }: { id: string; updatedDocument: Partial<Document> }) => 
      api.put(`/documents/${id}`, updatedDocument),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['document', documentId]);
        queryClient.invalidateQueries('documents');
        if (onSave) {
          onSave(response.data.data._id);
        }
        setIsSaving(false);
      },
      onError: () => {
        setIsSaving(false);
      }
    }
  );

  // Wenn ein Projekt über die Props übergeben wird, dieses auswählen
  useEffect(() => {
    if (projectId && projects) {
      const project = projects.find(p => p._id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projectId, projects]);

  // Tab wechseln
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Tag hinzufügen
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  // Tag entfernen
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Dokument speichern
  const handleSave = () => {
    if (!title || !content || !selectedProject) {
      return;
    }

    setIsSaving(true);

    const documentData = {
      title,
      content,
      project: selectedProject._id,
      tags
    };

    if (documentId) {
      // Dokument aktualisieren
      updateDocumentMutation.mutate({
        id: documentId,
        updatedDocument: {
          ...documentData,
          changeDescription: changeDescription || 'Dokument aktualisiert'
        }
      });
    } else {
      // Neues Dokument erstellen
      createDocumentMutation.mutate(documentData);
    }
  };

  // Abbrechen
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Wenn Daten geladen werden
  const isLoading = isLoadingProjects || (documentId && isLoadingDocument);
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Editor-Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {documentId ? 'Dokument bearbeiten' : 'Neues Dokument erstellen'}
        </Typography>
      </Box>

      {/* Titel und Projekt */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Titel"
          variant="outlined"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        
        <Autocomplete
          options={projects || []}
          getOptionLabel={(option) => option.name}
          value={selectedProject}
          onChange={(_event, newValue) => setSelectedProject(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Projekt"
              variant="outlined"
              required
            />
          )}
          disabled={!!documentId} // Projekt kann nicht geändert werden, wenn das Dokument bearbeitet wird
        />
      </Box>

      {/* Tags */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Tags
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TextField
            label="Neuer Tag"
            variant="outlined"
            size="small"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
            sx={{ mr: 1 }}
          />
          <Button 
            variant="outlined" 
            onClick={handleAddTag}
            disabled={!newTag || tags.includes(newTag)}
          >
            Hinzufügen
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {tags.map(tag => (
            <Chip 
              key={tag} 
              label={tag} 
              onDelete={() => handleRemoveTag(tag)} 
            />
          ))}
        </Box>
      </Box>

      {/* Änderungsbeschreibung (nur bei Bearbeitung) */}
      {documentId && (
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Änderungsbeschreibung"
            variant="outlined"
            fullWidth
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            placeholder="Beschreiben Sie kurz, was Sie geändert haben"
            helperText="Diese Beschreibung wird in der Versionshistorie angezeigt"
          />
        </Box>
      )}

      {/* Editor-Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Bearbeiten" />
          <Tab label="Vorschau" />
        </Tabs>
      </Box>

      {/* Editor/Vorschau */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          minHeight: 400,
          backgroundColor: theme => 
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2
        }}
      >
        {activeTab === 0 ? (
          <TextField
            multiline
            fullWidth
            variant="outlined"
            placeholder="Markdown-Inhalt eingeben..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            minRows={15}
            maxRows={30}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'transparent'
              }
            }}
          />
        ) : (
          <Box sx={{ p: 2 }}>
            {content ? (
              <ReactMarkdown>
                {content}
              </ReactMarkdown>
            ) : (
              <Typography color="text.secondary" align="center">
                Keine Vorschau verfügbar. Bitte geben Sie Inhalt ein.
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Aktionsbuttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
        >
          Abbrechen
        </Button>
        <Button
          variant="contained"
          startIcon={<PreviewIcon />}
          onClick={() => setActiveTab(1)}
          disabled={activeTab === 1 || !content}
        >
          Vorschau
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!title || !content || !selectedProject || isSaving}
        >
          {isSaving ? <CircularProgress size={24} /> : 'Speichern'}
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentEditor; 
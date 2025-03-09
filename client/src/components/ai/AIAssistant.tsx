import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  AssessmentOutlined as ReportIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

// Typen
interface AIAssistantProps {
  projectId?: string;
  documentId?: string;
  onAddObjectives?: (objectives: string[]) => void;
  onAddMilestones?: (milestones: any[]) => void;
  onAddRisks?: (risks: any[]) => void;
  onAddTasks?: (tasks: any[]) => void;
}

interface ProjectSuggestions {
  objectives: string[];
  milestones: {
    title: string;
    dueDate: string | null;
    status: string;
  }[];
  risks: {
    title: string;
    description: string;
    impact: string;
    probability: string;
  }[];
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
}

// Assistenten-Modi
enum AssistantMode {
  CHAT = 'chat',
  PROJECT_SUGGESTIONS = 'project_suggestions',
  TASK_SUGGESTIONS = 'task_suggestions',
  DOCUMENT_SUMMARY = 'document_summary',
  PROJECT_REPORT = 'project_report'
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  projectId, 
  documentId,
  onAddObjectives,
  onAddMilestones,
  onAddRisks,
  onAddTasks
}) => {
  const [mode, setMode] = useState<AssistantMode>(AssistantMode.CHAT);
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [projectSuggestions, setProjectSuggestions] = useState<ProjectSuggestions | null>(null);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [documentSummary, setDocumentSummary] = useState<string>('');
  const [projectReport, setProjectReport] = useState<string>('');

  // Text generieren
  const generateTextMutation = useMutation(
    (prompt: string) => api.post('/ai/generate-text', { prompt }),
    {
      onSuccess: (response) => {
        const generatedText = response.data.data.text;
        setConversation([...conversation, { role: 'assistant', content: generatedText }]);
        setPrompt('');
      }
    }
  );

  // Projektvorschläge generieren
  const generateProjectSuggestionsMutation = useMutation(
    (description: string) => api.post('/ai/project-suggestions', { description }),
    {
      onSuccess: (response) => {
        const suggestions = response.data.data;
        setProjectSuggestions(suggestions);
        setDescription('');
      }
    }
  );

  // Aufgabenvorschläge generieren
  const generateTaskSuggestionsMutation = useMutation(
    (projectId: string) => api.post('/ai/task-suggestions', { projectId }),
    {
      onSuccess: (response) => {
        const suggestions = response.data.data;
        setTaskSuggestions(suggestions);
      }
    }
  );

  // Dokumentzusammenfassung generieren
  const generateDocumentSummaryMutation = useMutation(
    (documentId: string) => api.post('/ai/document-summary', { documentId }),
    {
      onSuccess: (response) => {
        const summary = response.data.data.summary;
        setDocumentSummary(summary);
      }
    }
  );

  // Projektbericht generieren
  const generateProjectReportMutation = useMutation(
    (projectId: string) => api.post('/ai/project-report', { projectId }),
    {
      onSuccess: (response) => {
        const report = response.data.data.report;
        setProjectReport(report);
      }
    }
  );

  // Nachricht senden
  const handleSendMessage = () => {
    if (!prompt.trim()) return;
    
    const newConversation = [...conversation, { role: 'user', content: prompt }];
    setConversation(newConversation);
    
    generateTextMutation.mutate(prompt);
  };

  // Projektvorschläge generieren
  const handleGenerateProjectSuggestions = () => {
    if (!description.trim()) return;
    
    generateProjectSuggestionsMutation.mutate(description);
  };

  // Aufgabenvorschläge generieren
  const handleGenerateTaskSuggestions = () => {
    if (!projectId) return;
    
    generateTaskSuggestionsMutation.mutate(projectId);
  };

  // Dokumentzusammenfassung generieren
  const handleGenerateDocumentSummary = () => {
    if (!documentId) return;
    
    generateDocumentSummaryMutation.mutate(documentId);
  };

  // Projektbericht generieren
  const handleGenerateProjectReport = () => {
    if (!projectId) return;
    
    generateProjectReportMutation.mutate(projectId);
  };

  // Modus wechseln
  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    
    // Automatisch generieren, wenn Projekt- oder Dokument-ID vorhanden ist
    if (newMode === AssistantMode.TASK_SUGGESTIONS && projectId) {
      handleGenerateTaskSuggestions();
    } else if (newMode === AssistantMode.DOCUMENT_SUMMARY && documentId) {
      handleGenerateDocumentSummary();
    } else if (newMode === AssistantMode.PROJECT_REPORT && projectId) {
      handleGenerateProjectReport();
    }
  };

  // Vorschläge hinzufügen
  const handleAddSuggestions = () => {
    if (!projectSuggestions) return;
    
    if (onAddObjectives && projectSuggestions.objectives.length > 0) {
      onAddObjectives(projectSuggestions.objectives);
    }
    
    if (onAddMilestones && projectSuggestions.milestones.length > 0) {
      onAddMilestones(projectSuggestions.milestones);
    }
    
    if (onAddRisks && projectSuggestions.risks.length > 0) {
      onAddRisks(projectSuggestions.risks);
    }
  };

  // Aufgaben hinzufügen
  const handleAddTasks = () => {
    if (!taskSuggestions.length || !onAddTasks) return;
    
    onAddTasks(taskSuggestions);
  };

  // Text in die Zwischenablage kopieren
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Lädt
  const isLoading = 
    generateTextMutation.isLoading || 
    generateProjectSuggestionsMutation.isLoading || 
    generateTaskSuggestionsMutation.isLoading || 
    generateDocumentSummaryMutation.isLoading || 
    generateProjectReportMutation.isLoading;

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        KI-Assistent
      </Typography>
      
      {/* Modus-Auswahl */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip 
          icon={<LightbulbIcon />} 
          label="Chat" 
          onClick={() => handleModeChange(AssistantMode.CHAT)}
          color={mode === AssistantMode.CHAT ? 'primary' : 'default'}
          variant={mode === AssistantMode.CHAT ? 'filled' : 'outlined'}
        />
        <Chip 
          icon={<LightbulbIcon />} 
          label="Projektvorschläge" 
          onClick={() => handleModeChange(AssistantMode.PROJECT_SUGGESTIONS)}
          color={mode === AssistantMode.PROJECT_SUGGESTIONS ? 'primary' : 'default'}
          variant={mode === AssistantMode.PROJECT_SUGGESTIONS ? 'filled' : 'outlined'}
        />
        <Chip 
          icon={<AssignmentIcon />} 
          label="Aufgabenvorschläge" 
          onClick={() => handleModeChange(AssistantMode.TASK_SUGGESTIONS)}
          color={mode === AssistantMode.TASK_SUGGESTIONS ? 'primary' : 'default'}
          variant={mode === AssistantMode.TASK_SUGGESTIONS ? 'filled' : 'outlined'}
          disabled={!projectId}
        />
        <Chip 
          icon={<DescriptionIcon />} 
          label="Dokumentzusammenfassung" 
          onClick={() => handleModeChange(AssistantMode.DOCUMENT_SUMMARY)}
          color={mode === AssistantMode.DOCUMENT_SUMMARY ? 'primary' : 'default'}
          variant={mode === AssistantMode.DOCUMENT_SUMMARY ? 'filled' : 'outlined'}
          disabled={!documentId}
        />
        <Chip 
          icon={<ReportIcon />} 
          label="Projektbericht" 
          onClick={() => handleModeChange(AssistantMode.PROJECT_REPORT)}
          color={mode === AssistantMode.PROJECT_REPORT ? 'primary' : 'default'}
          variant={mode === AssistantMode.PROJECT_REPORT ? 'filled' : 'outlined'}
          disabled={!projectId}
        />
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Chat-Modus */}
      {mode === AssistantMode.CHAT && (
        <>
          <Box sx={{ flexGrow: 1, mb: 3, overflow: 'auto' }}>
            {conversation.length === 0 ? (
              <Typography color="text.secondary" align="center">
                Stellen Sie eine Frage oder bitten Sie um Hilfe.
              </Typography>
            ) : (
              conversation.map((message, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: message.role === 'user' 
                      ? 'primary.light' 
                      : 'background.paper',
                    color: message.role === 'user' 
                      ? 'primary.contrastText' 
                      : 'text.primary',
                    ml: message.role === 'user' ? 'auto' : 0,
                    mr: message.role === 'assistant' ? 'auto' : 0,
                    maxWidth: '80%'
                  }}
                >
                  <Typography variant="body1">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </Typography>
                </Box>
              ))
            )}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Stellen Sie eine Frage..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              multiline
              maxRows={3}
              disabled={isLoading}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!prompt.trim() || isLoading}
            >
              Senden
            </Button>
          </Box>
        </>
      )}
      
      {/* Projektvorschläge-Modus */}
      {mode === AssistantMode.PROJECT_SUGGESTIONS && (
        <>
          {!projectSuggestions ? (
            <>
              <TextField
                fullWidth
                label="Projektbeschreibung"
                placeholder="Beschreiben Sie Ihr Projekt..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 2 }}
                disabled={isLoading}
              />
              
              <Button
                variant="contained"
                onClick={handleGenerateProjectSuggestions}
                disabled={!description.trim() || isLoading}
                sx={{ mb: 3 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Vorschläge generieren'}
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Generierte Vorschläge</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSuggestions}
                    sx={{ mr: 1 }}
                    disabled={!onAddObjectives && !onAddMilestones && !onAddRisks}
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setProjectSuggestions(null)}
                  >
                    Zurücksetzen
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Projektziele ({projectSuggestions.objectives.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {projectSuggestions.objectives.map((objective, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LightbulbIcon />
                          </ListItemIcon>
                          <ListItemText primary={objective} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Meilensteine ({projectSuggestions.milestones.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {projectSuggestions.milestones.map((milestone, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AssignmentIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={milestone.title} 
                            secondary={milestone.dueDate ? `Fällig: ${milestone.dueDate}` : 'Kein Fälligkeitsdatum'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Risiken ({projectSuggestions.risks.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {projectSuggestions.risks.map((risk, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LightbulbIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={risk.title} 
                            secondary={`Auswirkung: ${risk.impact}, Wahrscheinlichkeit: ${risk.probability}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </>
          )}
        </>
      )}
      
      {/* Aufgabenvorschläge-Modus */}
      {mode === AssistantMode.TASK_SUGGESTIONS && (
        <>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : taskSuggestions.length === 0 ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                Keine Aufgabenvorschläge verfügbar.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateTaskSuggestions}
                disabled={!projectId}
                sx={{ mt: 2 }}
              >
                Vorschläge generieren
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Aufgabenvorschläge</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddTasks}
                    sx={{ mr: 1 }}
                    disabled={!onAddTasks}
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateTaskSuggestions}
                  >
                    Neu generieren
                  </Button>
                </Box>
              </Box>
              
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {taskSuggestions.map((task, index) => (
                  <Paper key={index} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {task.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip 
                        label={`Priorität: ${task.priority}`} 
                        color={
                          task.priority === 'High' ? 'error' : 
                          task.priority === 'Medium' ? 'warning' : 
                          'success'
                        }
                        size="small"
                      />
                      <Chip 
                        label={`Geschätzte Zeit: ${task.estimatedHours} Stunden`} 
                        size="small"
                      />
                    </Box>
                  </Paper>
                ))}
              </List>
            </>
          )}
        </>
      )}
      
      {/* Dokumentzusammenfassung-Modus */}
      {mode === AssistantMode.DOCUMENT_SUMMARY && (
        <>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : documentSummary ? (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Dokumentzusammenfassung</Typography>
                <Box>
                  <Tooltip title="In Zwischenablage kopieren">
                    <IconButton onClick={() => handleCopyToClipboard(documentSummary)}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateDocumentSummary}
                    size="small"
                  >
                    Neu generieren
                  </Button>
                </Box>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2,
                  flexGrow: 1,
                  overflow: 'auto'
                }}
              >
                <ReactMarkdown>{documentSummary}</ReactMarkdown>
              </Paper>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                Keine Zusammenfassung verfügbar.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateDocumentSummary}
                disabled={!documentId}
                sx={{ mt: 2 }}
              >
                Zusammenfassung generieren
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* Projektbericht-Modus */}
      {mode === AssistantMode.PROJECT_REPORT && (
        <>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : projectReport ? (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Projektbericht</Typography>
                <Box>
                  <Tooltip title="In Zwischenablage kopieren">
                    <IconButton onClick={() => handleCopyToClipboard(projectReport)}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateProjectReport}
                    size="small"
                  >
                    Neu generieren
                  </Button>
                </Box>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2,
                  flexGrow: 1,
                  overflow: 'auto'
                }}
              >
                <ReactMarkdown>{projectReport}</ReactMarkdown>
              </Paper>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                Kein Projektbericht verfügbar.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateProjectReport}
                disabled={!projectId}
                sx={{ mt: 2 }}
              >
                Bericht generieren
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default AIAssistant; 
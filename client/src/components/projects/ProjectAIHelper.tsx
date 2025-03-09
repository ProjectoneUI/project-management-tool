import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Paper,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  SmartToy as SmartToyIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAI } from '../../hooks/useAI';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface ProjectAIHelperProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  onAddObjectives?: (objectives: string[]) => void;
  onAddTasks?: (tasks: any[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-helper-tabpanel-${index}`}
      aria-labelledby={`ai-helper-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `ai-helper-tab-${index}`,
    'aria-controls': `ai-helper-tabpanel-${index}`,
  };
};

const ProjectAIHelper: React.FC<ProjectAIHelperProps> = ({ 
  projectId, 
  projectName, 
  projectDescription,
  onAddObjectives,
  onAddTasks
}) => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  // AI-Hooks
  const { 
    generateProjectSuggestions, 
    generateTaskSuggestions,
    generateProjectReport
  } = useAI();
  
  // Ausgewählte Vorschläge
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  
  // Dialog öffnen/schließen
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setTabValue(0);
    setSelectedObjectives([]);
    setSelectedTasks([]);
  };
  
  // Tab wechseln
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Automatisch Vorschläge generieren, wenn noch keine vorhanden sind
    if (newValue === 0 && !generateProjectSuggestions.data && !generateProjectSuggestions.isLoading) {
      handleGenerateProjectSuggestions();
    } else if (newValue === 1 && !generateTaskSuggestions.data && !generateTaskSuggestions.isLoading) {
      handleGenerateTaskSuggestions();
    } else if (newValue === 2 && !generateProjectReport.data && !generateProjectReport.isLoading) {
      handleGenerateProjectReport();
    }
  };
  
  // Projektvorschläge generieren
  const handleGenerateProjectSuggestions = () => {
    if (!projectDescription) return;
    
    generateProjectSuggestions.mutate(projectDescription);
  };
  
  // Aufgabenvorschläge generieren
  const handleGenerateTaskSuggestions = () => {
    generateTaskSuggestions.mutate(projectId);
  };
  
  // Projektbericht generieren
  const handleGenerateProjectReport = () => {
    generateProjectReport.mutate(projectId);
  };
  
  // Ziel auswählen/abwählen
  const handleObjectiveToggle = (objective: string) => {
    const currentIndex = selectedObjectives.indexOf(objective);
    const newSelectedObjectives = [...selectedObjectives];
    
    if (currentIndex === -1) {
      newSelectedObjectives.push(objective);
    } else {
      newSelectedObjectives.splice(currentIndex, 1);
    }
    
    setSelectedObjectives(newSelectedObjectives);
  };
  
  // Aufgabe auswählen/abwählen
  const handleTaskToggle = (task: any) => {
    const currentIndex = selectedTasks.findIndex(t => t.title === task.title);
    const newSelectedTasks = [...selectedTasks];
    
    if (currentIndex === -1) {
      newSelectedTasks.push(task);
    } else {
      newSelectedTasks.splice(currentIndex, 1);
    }
    
    setSelectedTasks(newSelectedTasks);
  };
  
  // Ausgewählte Ziele hinzufügen
  const handleAddSelectedObjectives = () => {
    if (onAddObjectives && selectedObjectives.length > 0) {
      onAddObjectives(selectedObjectives);
      setSelectedObjectives([]);
    }
  };
  
  // Ausgewählte Aufgaben hinzufügen
  const handleAddSelectedTasks = () => {
    if (onAddTasks && selectedTasks.length > 0) {
      onAddTasks(selectedTasks);
      setSelectedTasks([]);
    }
  };
  
  // Zur KI-Seite navigieren
  const handleNavigateToAI = () => {
    navigate(`/ai/project/${projectId}`);
  };
  
  // Projektvorschläge
  const projectSuggestions = generateProjectSuggestions.data?.data.data;
  
  // Aufgabenvorschläge
  const taskSuggestions = generateTaskSuggestions.data?.data.data;
  
  // Projektbericht
  const projectReport = generateProjectReport.data?.data.data.report;
  
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SmartToyIcon />}
        onClick={handleOpen}
        size="small"
      >
        KI-Assistent
      </Button>
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              KI-Assistent für {projectName}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="KI-Assistent Tabs"
          >
            <Tab 
              icon={<LightbulbIcon />} 
              label="Projektziele" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<AssignmentIcon />} 
              label="Aufgabenvorschläge" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<DescriptionIcon />} 
              label="Projektbericht" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>
        
        <DialogContent sx={{ minHeight: '400px' }}>
          {/* Projektziele */}
          <TabPanel value={tabValue} index={0}>
            {generateProjectSuggestions.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : projectSuggestions ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Vorgeschlagene Projektziele
                </Typography>
                <List>
                  {projectSuggestions.objectives.map((objective: string, index: number) => (
                    <ListItem key={index} dense button onClick={() => handleObjectiveToggle(objective)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedObjectives.indexOf(objective) !== -1}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText primary={objective} />
                    </ListItem>
                  ))}
                </List>
                
                {selectedObjectives.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSelectedObjectives}
                    >
                      {selectedObjectives.length} Ziele hinzufügen
                    </Button>
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Vorgeschlagene Meilensteine
                </Typography>
                <List>
                  {projectSuggestions.milestones.map((milestone: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={milestone.title} 
                        secondary={milestone.dueDate ? `Fällig: ${milestone.dueDate}` : 'Kein Fälligkeitsdatum'} 
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Potenzielle Risiken
                </Typography>
                <List>
                  {projectSuggestions.risks.map((risk: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={risk.title} 
                        secondary={`Auswirkung: ${risk.impact}, Wahrscheinlichkeit: ${risk.probability}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography color="text.secondary" gutterBottom>
                  Keine Projektvorschläge verfügbar.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateProjectSuggestions}
                  sx={{ mt: 2 }}
                  disabled={!projectDescription}
                >
                  Vorschläge generieren
                </Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Aufgabenvorschläge */}
          <TabPanel value={tabValue} index={1}>
            {generateTaskSuggestions.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : taskSuggestions ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Vorgeschlagene Aufgaben
                </Typography>
                <List>
                  {taskSuggestions.map((task: any, index: number) => (
                    <Paper key={index} sx={{ mb: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={selectedTasks.findIndex(t => t.title === task.title) !== -1}
                          onChange={() => handleTaskToggle(task)}
                        />
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="subtitle1">{task.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {task.description}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Typography variant="caption" color="primary">
                              Priorität: {task.priority}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Geschätzte Zeit: {task.estimatedHours} Stunden
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
                
                {selectedTasks.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSelectedTasks}
                    >
                      {selectedTasks.length} Aufgaben hinzufügen
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography color="text.secondary" gutterBottom>
                  Keine Aufgabenvorschläge verfügbar.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateTaskSuggestions}
                  sx={{ mt: 2 }}
                >
                  Vorschläge generieren
                </Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Projektbericht */}
          <TabPanel value={tabValue} index={2}>
            {generateProjectReport.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : projectReport ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2
                }}
              >
                <ReactMarkdown>{projectReport}</ReactMarkdown>
              </Paper>
            ) : (
              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography color="text.secondary" gutterBottom>
                  Kein Projektbericht verfügbar.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateProjectReport}
                  sx={{ mt: 2 }}
                >
                  Bericht generieren
                </Button>
              </Box>
            )}
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleNavigateToAI} startIcon={<SmartToyIcon />}>
            Zum KI-Assistenten
          </Button>
          <Button onClick={handleClose}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectAIHelper; 
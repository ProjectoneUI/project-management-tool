import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Divider,
  useTheme
} from '@mui/material';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import AIAssistant from '../components/ai/AIAssistant';
import { useQuery } from 'react-query';
import api from '../services/api';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorDisplay from '../components/common/ErrorDisplay';

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
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      style={{ height: 'calc(100vh - 220px)' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `ai-tab-${index}`,
    'aria-controls': `ai-tabpanel-${index}`,
  };
};

const AI: React.FC = () => {
  const theme = useTheme();
  const { projectId, documentId } = useParams<{ projectId?: string, documentId?: string }>();
  const [tabValue, setTabValue] = useState(0);

  // Projekt-Daten laden, falls eine Projekt-ID vorhanden ist
  const { 
    data: projectData, 
    isLoading: projectLoading, 
    error: projectError 
  } = useQuery(
    ['project', projectId],
    () => api.get(`/projects/${projectId}`).then(res => res.data.data),
    { 
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000 // 5 Minuten
    }
  );

  // Dokument-Daten laden, falls eine Dokument-ID vorhanden ist
  const { 
    data: documentData, 
    isLoading: documentLoading, 
    error: documentError 
  } = useQuery(
    ['document', documentId],
    () => api.get(`/documents/${documentId}`).then(res => res.data.data),
    { 
      enabled: !!documentId,
      staleTime: 5 * 60 * 1000 // 5 Minuten
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Lädt
  const isLoading = (projectId && projectLoading) || (documentId && documentLoading);
  
  // Fehler
  const error = projectError || documentError;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        title="KI-Assistent" 
        subtitle={
          projectData 
            ? `Projekt: ${projectData.name}` 
            : documentData 
              ? `Dokument: ${documentData.title}` 
              : 'Intelligente Unterstützung für Ihre Projekte'
        }
      />

      <Paper 
        sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 'calc(100vh - 180px)',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="KI-Assistent Tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="KI-Assistent" {...a11yProps(0)} />
            <Tab label="Über KI-Funktionen" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AIAssistant 
            projectId={projectId} 
            documentId={documentId}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Verfügbare KI-Funktionen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Chat-Assistent
                </Typography>
                <Typography variant="body2" paragraph>
                  Stellen Sie Fragen zu Ihren Projekten, Aufgaben oder allgemeine Fragen zum Projektmanagement.
                  Der Assistent kann Ihnen bei der Lösung von Problemen helfen und Ratschläge geben.
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Projektvorschläge
                </Typography>
                <Typography variant="body2" paragraph>
                  Basierend auf einer Projektbeschreibung generiert die KI Vorschläge für Projektziele,
                  Meilensteine und potenzielle Risiken, die Sie direkt in Ihr Projekt übernehmen können.
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Aufgabenvorschläge
                </Typography>
                <Typography variant="body2" paragraph>
                  Die KI analysiert Ihr Projekt und schlägt relevante Aufgaben vor, die Sie hinzufügen können,
                  um Ihre Projektziele zu erreichen.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Weitere KI-Funktionen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Dokumentzusammenfassung
                </Typography>
                <Typography variant="body2" paragraph>
                  Die KI kann lange Dokumente analysieren und eine prägnante Zusammenfassung erstellen,
                  die die wichtigsten Punkte hervorhebt.
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Projektbericht
                </Typography>
                <Typography variant="body2" paragraph>
                  Generieren Sie automatisch einen detaillierten Projektbericht mit Fortschrittsanalyse,
                  Meilenstein-Status und Empfehlungen für die weitere Vorgehensweise.
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Technische Details
                </Typography>
                <Typography variant="body2" paragraph>
                  Unsere KI-Funktionen basieren auf Ollama und lokalen Sprachmodellen, die Ihre Daten
                  privat und sicher halten. Alle Verarbeitungen finden auf Ihrem Server statt, ohne
                  dass Daten an externe Dienste gesendet werden.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AI; 
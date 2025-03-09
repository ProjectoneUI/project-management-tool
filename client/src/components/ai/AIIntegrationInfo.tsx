import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { 
  SmartToy as SmartToyIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const AIIntegrationInfo: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">KI-Integration</Typography>
      </Box>
      
      <Typography variant="body1" paragraph>
        Unser Projektmanagement-Tool nutzt lokale KI-Modelle über Ollama, um Ihre Arbeit zu unterstützen und zu verbessern.
        Die KI-Funktionen sind vollständig in die Anwendung integriert und können in verschiedenen Bereichen genutzt werden.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Verfügbare KI-Funktionen
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon>
            <ChatIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="KI-Assistent" 
            secondary="Stellen Sie Fragen zu Ihren Projekten oder allgemeine Fragen zum Projektmanagement." 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <LightbulbIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Projektvorschläge" 
            secondary="Generieren Sie Vorschläge für Projektziele, Meilensteine und potenzielle Risiken basierend auf einer Projektbeschreibung." 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <AssignmentIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Aufgabenvorschläge" 
            secondary="Lassen Sie die KI relevante Aufgaben für Ihr Projekt vorschlagen, die Sie direkt hinzufügen können." 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <DescriptionIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Dokumentzusammenfassung" 
            secondary="Erstellen Sie automatisch Zusammenfassungen von Dokumenten, um schnell einen Überblick zu erhalten." 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <AssessmentIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Projektbericht" 
            secondary="Generieren Sie detaillierte Projektberichte mit Fortschrittsanalyse und Empfehlungen." 
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Technische Details
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" paragraph>
          Die KI-Funktionen basieren auf Ollama, einer lokalen Lösung für KI-Modelle, die Ihre Daten privat und sicher hält.
          Alle Verarbeitungen finden auf Ihrem Server statt, ohne dass Daten an externe Dienste gesendet werden.
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip icon={<CodeIcon />} label="Ollama" />
          <Chip icon={<CodeIcon />} label="Lokale Modelle" />
          <Chip icon={<CodeIcon />} label="Datenschutz" />
        </Box>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Verwendung
      </Typography>
      
      <Typography variant="body2">
        Sie können auf die KI-Funktionen über den KI-Assistent in der Seitenleiste zugreifen oder direkt in Projekten und Dokumenten.
        Jede Projektseite bietet einen KI-Assistent-Button, der kontextbezogene Hilfe und Vorschläge anbietet.
      </Typography>
    </Paper>
  );
};

export default AIIntegrationInfo; 
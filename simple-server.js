// Einfacher Express-Server
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routen
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/projects', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Projekt 1', description: 'Beschreibung für Projekt 1' },
      { id: 2, name: 'Projekt 2', description: 'Beschreibung für Projekt 2' },
      { id: 3, name: 'Projekt 3', description: 'Beschreibung für Projekt 3' }
    ]
  });
});

app.get('/api/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  
  // Simulierte Projektdetails
  const project = {
    id: projectId,
    name: `Projekt ${projectId}`,
    description: `Detaillierte Beschreibung für Projekt ${projectId}. Dieses Projekt umfasst verschiedene Aufgaben und Meilensteine.`,
    key: `PROJ-${projectId}`,
    manager: 'Max Mustermann',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'in-progress',
    team: [
      { id: 1, name: 'Max Mustermann', role: 'Projektleiter', avatar: 'MM' },
      { id: 2, name: 'Anna Schmidt', role: 'Entwickler', avatar: 'AS' },
      { id: 3, name: 'Thomas Müller', role: 'Designer', avatar: 'TM' }
    ],
    milestones: [
      { id: 1, title: 'Projektstart', dueDate: '2025-01-15', status: 'completed' },
      { id: 2, title: 'Alpha-Version', dueDate: '2025-04-30', status: 'in-progress' },
      { id: 3, title: 'Beta-Version', dueDate: '2025-08-15', status: 'planned' },
      { id: 4, title: 'Release', dueDate: '2025-12-01', status: 'planned' }
    ]
  };
  
  res.json({ data: project });
});

app.get('/api/tasks', (req, res) => {
  res.json({
    data: [
      { id: 1, title: 'Aufgabe 1', description: 'Beschreibung für Aufgabe 1', status: 'todo' },
      { id: 2, title: 'Aufgabe 2', description: 'Beschreibung für Aufgabe 2', status: 'in-progress' },
      { id: 3, title: 'Aufgabe 3', description: 'Beschreibung für Aufgabe 3', status: 'done' }
    ]
  });
});

app.get('/api/projects/:id/tasks', (req, res) => {
  const projectId = parseInt(req.params.id);
  
  // Simulierte Aufgaben für ein bestimmtes Projekt
  const tasks = [
    { 
      id: 1, 
      title: `Anforderungsanalyse für Projekt ${projectId}`, 
      description: 'Sammlung und Dokumentation aller Anforderungen', 
      status: 'done',
      assignee: { id: 1, name: 'Max Mustermann', avatar: 'MM' },
      dueDate: '2025-01-20'
    },
    { 
      id: 2, 
      title: `Design-Konzept für Projekt ${projectId}`, 
      description: 'Erstellung des UI/UX-Konzepts', 
      status: 'done',
      assignee: { id: 3, name: 'Thomas Müller', avatar: 'TM' },
      dueDate: '2025-02-15'
    },
    { 
      id: 3, 
      title: `Frontend-Entwicklung für Projekt ${projectId}`, 
      description: 'Implementierung der Benutzeroberfläche', 
      status: 'in-progress',
      assignee: { id: 2, name: 'Anna Schmidt', avatar: 'AS' },
      dueDate: '2025-04-10'
    },
    { 
      id: 4, 
      title: `Backend-Entwicklung für Projekt ${projectId}`, 
      description: 'Implementierung der Serverlogik und API', 
      status: 'in-progress',
      assignee: { id: 1, name: 'Max Mustermann', avatar: 'MM' },
      dueDate: '2025-04-20'
    },
    { 
      id: 5, 
      title: `Datenbank-Design für Projekt ${projectId}`, 
      description: 'Entwurf und Implementierung der Datenbankstruktur', 
      status: 'todo',
      assignee: { id: 2, name: 'Anna Schmidt', avatar: 'AS' },
      dueDate: '2025-03-30'
    },
    { 
      id: 6, 
      title: `Testing für Projekt ${projectId}`, 
      description: 'Durchführung von Unit- und Integrationstests', 
      status: 'todo',
      assignee: { id: 3, name: 'Thomas Müller', avatar: 'TM' },
      dueDate: '2025-05-15'
    },
    { 
      id: 7, 
      title: `Dokumentation für Projekt ${projectId}`, 
      description: 'Erstellung der technischen Dokumentation', 
      status: 'todo',
      assignee: { id: 1, name: 'Max Mustermann', avatar: 'MM' },
      dueDate: '2025-06-01'
    },
    { 
      id: 8, 
      title: `Deployment für Projekt ${projectId}`, 
      description: 'Vorbereitung und Durchführung des Deployments', 
      status: 'review',
      assignee: { id: 2, name: 'Anna Schmidt', avatar: 'AS' },
      dueDate: '2025-06-15'
    }
  ];
  
  res.json({ data: tasks });
});

app.post('/api/ai/generate-text', (req, res) => {
  res.json({ 
    data: { 
      text: 'Dies ist ein generierter Text von der KI.' 
    } 
  });
});

app.post('/api/ai/project-suggestions', (req, res) => {
  res.json({ 
    data: { 
      objectives: ['Ziel 1', 'Ziel 2', 'Ziel 3'],
      milestones: [
        { title: 'Meilenstein 1', dueDate: '2023-12-31', status: 'pending' },
        { title: 'Meilenstein 2', dueDate: '2024-01-31', status: 'pending' }
      ],
      risks: [
        { title: 'Risiko 1', description: 'Beschreibung 1', impact: 'hoch', probability: 'mittel' },
        { title: 'Risiko 2', description: 'Beschreibung 2', impact: 'mittel', probability: 'niedrig' }
      ]
    } 
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 
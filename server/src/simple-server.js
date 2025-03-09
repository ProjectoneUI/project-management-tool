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

app.get('/api/tasks', (req, res) => {
  res.json({
    data: [
      { id: 1, title: 'Aufgabe 1', description: 'Beschreibung für Aufgabe 1', status: 'todo' },
      { id: 2, title: 'Aufgabe 2', description: 'Beschreibung für Aufgabe 2', status: 'in-progress' },
      { id: 3, title: 'Aufgabe 3', description: 'Beschreibung für Aufgabe 3', status: 'done' }
    ]
  });
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
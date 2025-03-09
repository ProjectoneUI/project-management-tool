// Einfache React-Anwendung
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [prompt, setPrompt] = useState('');

  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Projekte laden
        const projectsResponse = await fetch(`${API_URL}/projects`);
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data);

        // Aufgaben laden
        const tasksResponse = await fetch(`${API_URL}/tasks`);
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.data);

        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // KI-Text generieren
  const handleGenerateText = async () => {
    if (!prompt) return;

    try {
      const response = await fetch(`${API_URL}/ai/generate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setAiResponse(data.data.text);
    } catch (err) {
      console.error('Fehler bei der KI-Anfrage:', err);
    }
  };

  if (loading) {
    return <div>Wird geladen...</div>;
  }

  if (error) {
    return <div>Fehler: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Projektmanagement-Tool</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>KI-Assistent</h2>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Stellen Sie eine Frage..."
            style={{ flex: 1, padding: '8px', marginRight: '10px' }}
          />
          <button 
            onClick={handleGenerateText}
            style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Senden
          </button>
        </div>
        {aiResponse && (
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p>{aiResponse}</p>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2>Projekte</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {projects.map((project) => (
              <li 
                key={project.id} 
                style={{ 
                  padding: '10px', 
                  marginBottom: '10px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '5px' 
                }}
              >
                <h3>{project.name}</h3>
                <p>{project.description}</p>
              </li>
            ))}
          </ul>
        </div>
        
        <div style={{ flex: 1 }}>
          <h2>Aufgaben</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li 
                key={task.id} 
                style={{ 
                  padding: '10px', 
                  marginBottom: '10px', 
                  backgroundColor: 
                    task.status === 'todo' ? '#ffecb3' : 
                    task.status === 'in-progress' ? '#bbdefb' : 
                    '#c8e6c9', 
                  borderRadius: '5px' 
                }}
              >
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <span 
                  style={{ 
                    display: 'inline-block', 
                    padding: '3px 8px', 
                    backgroundColor: 
                      task.status === 'todo' ? '#ffa000' : 
                      task.status === 'in-progress' ? '#1976d2' : 
                      '#388e3c', 
                    color: 'white', 
                    borderRadius: '3px', 
                    fontSize: '12px' 
                  }}
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root')); 
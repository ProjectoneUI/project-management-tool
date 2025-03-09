import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Typen
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Context erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook für einfachen Zugriff auf den Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
};

// Provider-Komponente
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Beim ersten Laden und bei Token-Änderungen den Benutzer laden
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Token im API-Client setzen
        api.setAuthToken(token);
        
        // Benutzerdaten abrufen
        const response = await api.get('/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Fehler beim Laden des Benutzers:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login-Funktion
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Token speichern
      localStorage.setItem('token', token);
      api.setAuthToken(token);
      
      // Zustand aktualisieren
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Zur Startseite navigieren
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Anmeldung fehlgeschlagen');
      console.error('Login-Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  // Registrierungsfunktion
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      // Token speichern
      localStorage.setItem('token', token);
      api.setAuthToken(token);
      
      // Zustand aktualisieren
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Zur Startseite navigieren
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrierung fehlgeschlagen');
      console.error('Registrierungsfehler:', err);
    } finally {
      setLoading(false);
    }
  };

  // Logout-Funktion
  const logout = () => {
    // Token entfernen
    localStorage.removeItem('token');
    api.removeAuthToken();
    
    // Zustand zurücksetzen
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Zur Login-Seite navigieren
    navigate('/login');
  };

  // Fehlermeldung löschen
  const clearError = () => {
    setError(null);
  };

  // Context-Wert
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
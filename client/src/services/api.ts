import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API-Basis-URL aus der Umgebungsvariable oder Standard-URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request-Interceptor für Fehlerbehandlung
    this.api.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response-Interceptor für Fehlerbehandlung
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Automatische Abmeldung bei 401-Fehlern (nicht autorisiert)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth-Token setzen
  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Auth-Token entfernen
  removeAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // GET-Anfrage
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  // POST-Anfrage
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  // PUT-Anfrage
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  // PATCH-Anfrage
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  // DELETE-Anfrage
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // Datei-Upload
  async uploadFile<T = any>(url: string, file: File, onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }
}

// Singleton-Instanz exportieren
const api = new ApiService();
export default api; 
/**
 * API Service
 * Handles all API communication with backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async signup(data) {
    const response = await fetch(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: { ...this.getAuthHeader() }
    });
    return response.json();
  }

  async updateProfile(data) {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/analysis/analyze`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  }

  async getAnalysisHistory(page = 1, pageSize = 10) {
    const response = await fetch(
      `${this.baseURL}/analysis/history?page=${page}&page_size=${pageSize}`,
      {
        headers: this.getAuthHeader()
      }
    );
    return response.json();
  }

  async getAnalysisDetail(analysisId) {
    const response = await fetch(
      `${this.baseURL}/analysis/history/${analysisId}`,
      {
        headers: this.getAuthHeader()
      }
    );
    return response.json();
  }

  async deleteAnalysis(analysisId) {
    const response = await fetch(
      `${this.baseURL}/analysis/history/${analysisId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeader()
      }
    );
    return response.json();
  }

  async getAnalysisStats() {
    const response = await fetch(
      `${this.baseURL}/analysis/stats`,
      {
        headers: this.getAuthHeader()
      }
    );
    return response.json();
  }

  // ============================================================================
  // HEALTH
  // ============================================================================

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new APIService();

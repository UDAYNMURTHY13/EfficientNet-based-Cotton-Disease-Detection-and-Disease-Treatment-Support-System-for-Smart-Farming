/**
 * API Service
 * Handles all API communication with backend
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Central fetch wrapper. Fires 'auth:expired' event on 401 so
   * AuthContext can clear state and redirect to /login automatically.
   */
  async fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      const err = new Error('Session expired. Please log in again.');
      err.status = 401;
      throw err;
    }
    return response;
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

  async getProfile(token = null) {
    const authHeader = token
      ? { Authorization: `Bearer ${token}` }
      : this.getAuthHeader();
    const response = await this.fetchWithAuth(`${this.baseURL}/auth/me`, {
      headers: { ...authHeader }
    });
    return response.json();
  }

  async updateProfile(data) {
    const response = await this.fetchWithAuth(`${this.baseURL}/auth/profile`, {
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
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/history?page=${page}&page_size=${pageSize}`,
      { headers: this.getAuthHeader() }
    );
    return response.json();
  }

  async getReviewedAnalyses(page = 1, pageSize = 20) {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/history?page=${page}&page_size=${pageSize}&reviewed_only=true`,
      { headers: this.getAuthHeader() }
    );
    return response.json();
  }

  async getAnalysisDetail(analysisId) {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/history/${analysisId}`,
      { headers: this.getAuthHeader() }
    );
    return response.json();
  }

  async getAnalysisFullDetail(analysisId) {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/history/${analysisId}/full`,
      { headers: this.getAuthHeader() }
    );
    return response.json();
  }

  async deleteAnalysis(analysisId) {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/history/${analysisId}`,
      { method: 'DELETE', headers: this.getAuthHeader() }
    );
    return response.json();
  }

  async getAnalysisStats() {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/analysis/stats`,
      { headers: this.getAuthHeader() }
    );
    return response.json();
  }

  // ============================================================================
  // MESSAGES (from experts to this farmer)
  // ============================================================================

  async getMyMessages() {
    const response = await this.fetchWithAuth(
      `${this.baseURL}/expert/my-messages`,
      { headers: this.getAuthHeader() }
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

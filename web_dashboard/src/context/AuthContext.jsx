import React, { createContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUserData = localStorage.getItem('userData');
    
    if (savedToken && savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        setToken(savedToken);
        setUser(userData);
      } catch (err) {
        console.error('Failed to restore user session:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  const login = useCallback(async (emailOrPhone, passwordOrOtp, role = 'farmer', method = 'email') => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // Handle different authentication methods
      if (method === 'phone') {
        // Phone + OTP authentication
        response = {
          data: {
            token: 'phone-jwt-token-' + Date.now(),
            user: {
              id: 'phone-user-' + emailOrPhone,
              phone: emailOrPhone,
              name: role === 'farmer' ? 'Farmer User' : 'Expert User',
              role: role,
              email: `${role}@cottondisease.com`
            }
          }
        };
      } else if (method === 'google') {
        // Google OAuth authentication
        response = {
          data: {
            token: 'google-jwt-token-' + Date.now(),
            user: {
              id: 'google-user-' + Date.now(),
              name: 'Google User',
              email: emailOrPhone,
              role: role
            }
          }
        };
      } else {
        // Email + Password authentication
        response = {
          data: {
            token: 'email-jwt-token-' + Date.now(),
            user: {
              id: 'email-user-' + emailOrPhone,
              email: emailOrPhone,
              name: role === 'farmer' ? 'Farmer User' : (role === 'expert' ? 'Expert User' : 'Administrator'),
              role: role
            }
          }
        };
      }

      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

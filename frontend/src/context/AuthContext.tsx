import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  bio?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  isMasterAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set baseURL - in development, Vite proxy handles /api routes
// In production, set VITE_API_URL to your backend URL (e.g., http://your-backend.com)
const API_URL = import.meta.env.VITE_API_URL;

if (API_URL) {
  // Production: use full URL (with or without /api suffix)
  axios.defaults.baseURL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
} else {
  // Development: use empty baseURL, Vite proxy will forward /api/* to http://localhost:5000
  axios.defaults.baseURL = '';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, expectedRole?: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      // Check if expected role matches
      if (expectedRole && userData.role !== expectedRole) {
        throw new Error(`Invalid role. Expected ${expectedRole}, got ${userData.role}`);
      }
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      // Re-throw with better error message
      if (error.response) {
        throw error; // Let the component handle the response error
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const response = await axios.post(`/api/auth/register/${role || 'student'}`, { name, email, password });
    // Registration doesn't automatically log in - user needs approval first
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

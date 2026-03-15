import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// In production: empty baseURL lets Vercel proxy /api/* to VPS:5000 (avoids Mixed Content)
// In dev: point directly to VPS or local backend
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_BASE_URL || '')
  : (process.env.REACT_APP_API_BASE_URL || 'http://103.86.177.125:5000');

if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = API_BASE_URL;
}

const getErrorMessage = (error, fallback) => {
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return `Cannot connect to server at ${API_BASE_URL}. Ensure the backend is running and accessible. Check console for details.`;
  }
  const data = error.response?.data;
  if (data?.message) return data.message;
  if (data?.errors?.length) return data.errors.map(e => e.msg).join('. ');
  return fallback;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      const msg = getErrorMessage(error, 'Login failed');
      return { success: false, message: msg };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const response = await axios.post('/api/auth/google', { credential });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true };
    } catch (error) {
      const msg = getErrorMessage(error, 'Google login failed');
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: userInfo } = response.data;
      
      setToken(newToken);
      setUser(userInfo);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      const msg = getErrorMessage(error, 'Registration failed');
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

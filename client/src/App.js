import React, { useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TabularView from './pages/TabularView';
import Devices from './pages/Devices';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';

// Configure axios with API base URL from environment variable.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://103.86.177.125';

axios.defaults.baseURL = API_BASE_URL;

// Add axios interceptor for debugging
axios.interceptors.response.use(
  response => response,
  error => {
    console.error(`[AXIOS ERROR] URL: ${error.config?.url || 'unknown'}`, error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error(`[NETWORK ERROR] Cannot reach ${API_BASE_URL}. Please ensure the backend is running and accessible.`);
    }
    return Promise.reject(error);
  }
);

console.log(`[APP INIT] Using API Base URL: ${API_BASE_URL}`);

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';


function ThemeSync() {
  useEffect(() => {
    const stored = localStorage.getItem('reshm_settings');
    if (stored) {
      try {
        const { darkMode } = JSON.parse(stored);
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      } catch (e) { }
    }
  }, []);
  return null;
}

function App() {
  const app = (
    <AuthProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tabular-view" element={<TabularView />} />
              <Route path="devices" element={<Devices />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </RoomProvider>
    </AuthProvider>
  );

  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeSync />
      {app}
    </GoogleOAuthProvider>
  ) : (
    <>
      <ThemeSync />
      {app}
    </>
  );
}

export default App;

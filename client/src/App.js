import React, { useEffect } from 'react';
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

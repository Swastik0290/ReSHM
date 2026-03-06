import React from 'react';
import { useAuth } from '../context/AuthContext';
import './PendingVerification.css';

const PendingVerification = () => {
  const { user, logout } = useAuth();

  return (
    <div className="pending-verification">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1>Account Pending Verification</h1>
        <p>
          Your account <strong>{user?.email}</strong> is awaiting approval by an administrator.
        </p>
        <p className="pending-note">
          You will be able to access the dashboard and data once an admin verifies your account.
        </p>
        <button type="button" className="pending-logout" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default PendingVerification;

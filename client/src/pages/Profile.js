import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiCheck, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', assignedRoom: '' });
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchRooms();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/api/rooms');
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRooms([]);
    }
  };

  const handleVerify = async (u) => {
    try {
      await axios.put(`/api/users/${u._id}`, { verified: true });
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to verify');
    }
  };

  const handleEdit = (u) => {
    setEditingId(u._id);
    setEditForm({
      role: u.role || 'limited',
      assignedRoom: u.assignedRoom?._id || u.assignedRoom || ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingId) return;
    try {
      await axios.put(`/api/users/${editingId}`, {
        role: editForm.role,
        assignedRoom: editForm.assignedRoom || null
      });
      setEditingId(null);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'admin') {
      alert('Cannot delete an admin user.');
      return;
    }
    if (!window.confirm(`Delete user "${u.username}"?`)) return;
    try {
      await axios.delete(`/api/users/${u._id}`);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete');
    }
  };

  if (isAdmin) {
    return (
      <div className="profile-page">
        <h1>User Management</h1>
        <p className="profile-subtitle">View and manage all users. Verify Google sign-ups to grant dashboard access.</p>
        {loading ? (
          <div className="profile-loading">Loading users...</div>
        ) : (
          <div className="profile-card users-table-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <span className="user-name-cell">{u.username}</span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {editingId === u._id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                        >
                          <option value="limited">Limited</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>
                      {editingId === u._id ? (
                        <select
                          value={editForm.assignedRoom}
                          onChange={(e) => setEditForm((f) => ({ ...f, assignedRoom: e.target.value }))}
                        >
                          <option value="">—</option>
                          {rooms.map((r) => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        u.assignedRoom?.name || '—'
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${u.verified ? 'verified' : 'pending'}`}>
                        {u.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {editingId === u._id ? (
                        <>
                          <button type="button" className="btn-save" onClick={handleSaveUser}>Save</button>
                          <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {!u.verified && (
                            <button type="button" className="btn-verify" onClick={() => handleVerify(u)} title="Verify">
                              <FiCheck /> Verify
                            </button>
                          )}
                          <button type="button" className="btn-edit" onClick={() => handleEdit(u)} title="Edit">
                            <FiEdit2 />
                          </button>
                          {u.role !== 'admin' && (
                            <button type="button" className="btn-delete" onClick={() => handleDeleteUser(u)} title="Delete">
                              <FiTrash2 />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-content">
        <div className="profile-card">
          <h2>User Information</h2>
          <div className="profile-info">
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{user?.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role</span>
              <span className="info-value">{user?.role === 'admin' ? 'Admin' : 'Limited User'}</span>
            </div>
            {user?.assignedRoom && (
              <div className="info-item">
                <span className="info-label">Assigned Room</span>
                <span className="info-value">{user.assignedRoom.name || user.assignedRoom}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

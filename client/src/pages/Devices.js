import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiX } from 'react-icons/fi';
import LocationPicker from '../components/LocationPicker';
import './Devices.css';

const Devices = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', latitude: '', longitude: '', deviceId: ''
  });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        },
        deviceId: formData.deviceId || undefined
      };
      if (editingId) {
        await axios.put(`/api/rooms/${editingId}`, payload);
      } else {
        await axios.post('/api/rooms', payload);
      }
      cancelForm();
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || (editingId ? 'Error updating device' : 'Error creating device'));
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id);
    setFormData({
      name: room.name,
      description: room.description || '',
      latitude: room.location?.latitude?.toString() ?? '',
      longitude: room.location?.longitude?.toString() ?? '',
      deviceId: room.deviceId || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/rooms/${room._id}`);
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting device');
    }
  };

  const handleViewData = (roomId) => navigate('/dashboard', { state: { roomId } });

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', latitude: '', longitude: '', deviceId: '' });
  };

  const safeLoc = (room) => {
    const loc = room?.location;
    if (loc && typeof loc === 'object' && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return { lat: loc.latitude, lon: loc.longitude };
    }
    return { lat: 0, lon: 0 };
  };

  if (!isAdmin) {
    return (
      <div className="devices-page">
        <h1>Devices</h1>
        <p>You don't have permission to manage devices. Please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="devices-page">

      {/* ── Page header ── */}
      <div className="devices-header">
        <div className="devices-header-text">
          <h1>Devices</h1>
          <p className="devices-subtitle">Register rooms and assign Device IDs to your IoT hardware.</p>
        </div>
        <button
          className={`add-device-btn ${showForm ? 'add-device-btn--cancel' : ''}`}
          onClick={() => { showForm ? cancelForm() : setShowForm(true); }}
        >
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Device</>}
        </button>
      </div>

      {/* ── Add / Edit form ── */}
      {showForm && (
        <form className="device-form" onSubmit={handleSubmit}>
          {editingId && <h3 className="form-edit-title">Edit Device</h3>}

          <div className="form-row">
            <div className="form-group">
              <label>Room / Device Name <span className="required">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Server Room A"
                required
              />
            </div>
            <div className="form-group">
              <label>Device ID <span className="label-hint">(used by hardware to send data)</span></label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                placeholder="e.g. esp32-room-101"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              placeholder="Optional notes about this location"
            />
          </div>

          <LocationPicker
            addressLabel="Location — search or click map to pin"
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLatLonChange={(lat, lon) => setFormData({ ...formData, latitude: String(lat), longitude: String(lon) })}
          />

          <div className="form-row form-row--coords">
            <div className="form-group">
              <label>Latitude <span className="required">*</span></label>
              <input
                type="number" step="any" value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. 28.6139"
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude <span className="required">*</span></label>
              <input
                type="number" step="any" value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. 77.2090"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingId ? 'Update Device' : 'Create Device'}
            </button>
            {editingId && (
              <button type="button" className="cancel-btn" onClick={cancelForm}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {/* ── Device list ── */}
      <div className="rooms-list">
        <h2>Registered Devices</h2>
        {loading ? (
          <div className="loading">Loading devices…</div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">No devices found. Add your first device above.</div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => {
              const { lat, lon } = safeLoc(room);
              return (
                <div key={room._id} className="room-card">
                  {/* Card header */}
                  <div className="room-card-header">
                    <h3 className="room-card-name">{room.name}</h3>
                    <span className={`device-status-pill ${room.isActive !== false ? 'pill--active' : 'pill--inactive'}`}>
                      {room.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {room.description && <p className="room-desc">{room.description}</p>}

                  <div className="room-info">
                    <div className="room-info-row">
                      <span className="room-info-label">Lat</span>
                      <span className="room-info-value">{lat.toFixed(4)}°</span>
                    </div>
                    <div className="room-info-row">
                      <span className="room-info-label">Lon</span>
                      <span className="room-info-value">{lon.toFixed(4)}°</span>
                    </div>
                    <div className="room-info-row">
                      <span className="room-info-label">Device ID</span>
                      {room.deviceId
                        ? <code className="device-id-code">{room.deviceId}</code>
                        : <span className="no-device-id">⚠ Not set</span>
                      }
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="room-card-actions">
                    <button type="button" className="card-btn btn-view" onClick={() => handleViewData(room._id)}>
                      <FiEye aria-hidden="true" /><span>View Data</span>
                    </button>
                    <button type="button" className="card-btn btn-edit" onClick={() => handleEdit(room)}>
                      <FiEdit2 aria-hidden="true" /><span>Edit</span>
                    </button>
                    <button type="button" className="card-btn btn-delete" onClick={() => handleDelete(room)}>
                      <FiTrash2 aria-hidden="true" /><span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Devices;

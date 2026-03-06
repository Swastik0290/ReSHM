import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './DashboardCard.css';
import './CurrentLocation.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CurrentLocation = ({ latitude, longitude }) => {
  const mapRef = useRef(null);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className="dashboard-card current-location">
        <h3 className="card-title">Current Location</h3>
        <div className="no-location">Location data not available</div>
      </div>
    );
  }

  return (
    <div className="dashboard-card current-location">
      {/* Header: title left, toggle buttons right */}
      <div className="location-card-header">
        <h3 className="card-title">Current Location</h3>
        <div className="location-map-type">
          <button
            type="button"
            className={!satellite ? 'active' : ''}
            onClick={() => setSatellite(false)}
          >
            Map
          </button>
          <button
            type="button"
            className={satellite ? 'active' : ''}
            onClick={() => setSatellite(true)}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Map fills the rest — coords float over it */}
      <div className="location-map-wrap">
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          {satellite ? (
            <TileLayer
              attribution="&copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          <Marker position={[latitude, longitude]}>
            <Popup>
              Room Location<br />
              Lat: {latitude.toFixed(4)}°<br />
              Lon: {longitude.toFixed(4)}°
            </Popup>
          </Marker>
        </MapContainer>

        {/* Coords overlay — bottom-left of the map */}
        <div className="location-coords-overlay">
          <div className="coord-row">
            <span className="coord-label">LAT</span>
            <span className="coord-value">{latitude.toFixed(4)}° N</span>
          </div>
          <div className="coord-row">
            <span className="coord-label">LON</span>
            <span className="coord-value">{longitude.toFixed(4)}° E</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentLocation;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom ?? 16, { duration: 0.6 });
    }
  }, [center, zoom, map]);
  return null;
}

const LocationPicker = ({ latitude, longitude, onLatLonChange, addressLabel = 'Address' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [displayAddress, setDisplayAddress] = useState('');
  const [satellite, setSatellite] = useState(false);
  const searchTimeout = useRef(null);
  const wrapperRef = useRef(null);

  const lat = latitude != null && latitude !== '' ? parseFloat(latitude) : null;
  const lon = longitude != null && longitude !== '' ? parseFloat(longitude) : null;
  const center = lat != null && lon != null && !isNaN(lat) && !isNaN(lon)
    ? [lat, lon]
    : [20.5937, 78.9629];

  const reverseGeocode = useCallback(async (latVal, lonVal) => {
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/reverse?lat=${latVal}&lon=${lonVal}&format=json`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      const addr = data?.address;
      if (addr) {
        const parts = [
          addr.road,
          addr.suburb,
          addr.village,
          addr.town,
          addr.city,
          addr.state,
          addr.country
        ].filter(Boolean);
        setDisplayAddress(parts.join(', ') || data?.display_name || '');
      } else {
        setDisplayAddress(data?.display_name || `${latVal.toFixed(4)}°, ${lonVal.toFixed(4)}°`);
      }
    } catch {
      setDisplayAddress(`${latVal.toFixed(4)}°, ${lonVal.toFixed(4)}°`);
    }
  }, []);

  useEffect(() => {
    if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
      reverseGeocode(lat, lon);
    } else {
      setDisplayAddress('');
    }
  }, [lat, lon, reverseGeocode]);

  const searchAddress = useCallback(async (q) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(() => searchAddress(searchQuery), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, searchAddress]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item) => {
    const latVal = parseFloat(item.lat);
    const lonVal = parseFloat(item.lon);
    onLatLonChange(latVal, lonVal);
    setDisplayAddress(item.display_name || '');
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMapLocationSelect = (latVal, lonVal) => {
    onLatLonChange(latVal, lonVal);
    reverseGeocode(latVal, lonVal);
  };

  return (
    <div className="location-picker" ref={wrapperRef}>
      <label className="location-picker-label">{addressLabel}</label>
      <div className="location-picker-search-wrap">
        <input
          type="text"
          className="location-picker-search"
          placeholder="Search address (e.g. city, street, landmark)"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {loadingSearch && <span className="location-picker-spinner" />}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="location-picker-suggestions">
            {suggestions.map((item, i) => (
              <li
                key={i}
                className="location-picker-suggestion-item"
                onClick={() => handleSelectSuggestion(item)}
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {displayAddress && (
        <div className="location-picker-address">
          <span className="location-picker-address-label">Pinned:</span> {displayAddress}
        </div>
      )}
      <div className="location-picker-map-wrap">
        <div className="location-picker-map-toggle">
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
        <MapContainer
          center={center}
          zoom={lat != null && lon != null ? 15 : 4}
          style={{ height: 220, width: '100%', borderRadius: 8 }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          {satellite ? (
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          <MapViewUpdater center={lat != null && lon != null ? [lat, lon] : null} zoom={16} />
          <MapClickHandler onLocationSelect={handleMapLocationSelect} />
          {lat != null && lon != null && !isNaN(lat) && !isNaN(lon) && (
            <Marker position={[lat, lon]} />
          )}
        </MapContainer>
      </div>
      <p className="location-picker-hint">Click on the map to place the pin; search above to jump to an address.</p>
    </div>
  );
};

export default LocationPicker;

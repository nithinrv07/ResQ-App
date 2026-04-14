import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';

import { useNavigate } from 'react-router-dom';
import { Navigation, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

function MapClickHandler({ onLocationSelect, selectedLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
      console.log("📍 Map clicked:", lat, lng);
    },
  });

  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [map]);

  return null;
}

function GetLocationButton({ onGetLocation }) {
  return (
    <button
      onClick={onGetLocation}
      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all"
      title="Use current GPS location"
    >
      <Navigation className="w-6 h-6" />
    </button>
  );
}

export default function MapSelector() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tileFailed, setTileFailed] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const defaultCenter = [20.5937, 78.9629]; // India center

  const handleGetLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          setLoading(false);
          console.log("📍 GPS location:", latitude, longitude);
        },
        (error) => {
          console.error("GPS error:", error);
          alert("Could not get GPS location");
          setLoading(false);
        }
      );
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      console.log("✅ Confirmed location:", selectedLocation);
      localStorage.setItem('selectedEmergencyLocation', JSON.stringify(selectedLocation));
      navigate('/');
    } else {
      alert('Please select a location on the map');
    }
  };

  const applyManualCoordinates = () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert('Enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Latitude must be -90 to 90, longitude must be -180 to 180');
      return;
    }

    setSelectedLocation({ lat, lng });
  };

  return (
    <div className="relative h-screen w-full bg-white overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#e5e7eb' }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          eventHandlers={{
            tileerror: () => setTileFailed(true),
          }}
        />
        <MapClickHandler
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
        <MapResizer />
      </MapContainer>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000, background: 'linear-gradient(90deg, #7c3aed, #6d28d9)', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6" />
          <h1 className="text-xl font-black">Select Incident Location</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="hover:bg-purple-700 p-2 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute top-20 right-4 z-[10000] flex gap-2">
        <GetLocationButton onGetLocation={handleGetLocation} />
      </div>

      <div className="absolute top-20 right-20 z-[10000] bg-white border rounded-lg p-3 shadow-lg w-72">
        <p className="text-xs font-bold text-slate-700 mb-2">Manual Coordinates</p>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="w-1/2 border rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="w-1/2 border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={applyManualCoordinates}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded py-1.5"
        >
          Use Coordinates
        </button>
      </div>

      {!selectedLocation && (
        <div className="absolute top-20 left-4 z-[10000] bg-white rounded-lg p-4 shadow-lg max-w-xs border">
          <p className="text-sm font-bold text-gray-800">
            Click on the map to mark the hotel incident spot
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Or tap GPS to use your current hotel location
          </p>
        </div>
      )}

      {tileFailed && (
        <div className="absolute top-44 left-4 z-[10000] bg-amber-50 border border-amber-300 rounded-lg p-3 shadow-lg max-w-sm">
          <p className="text-sm font-bold text-amber-900">Map tiles failed to load.</p>
          <p className="text-xs text-amber-800 mt-1">You can still use the GPS button and confirm location.</p>
        </div>
      )}

      {selectedLocation && (
        <div className="absolute bottom-24 left-4 z-[10000] bg-purple-50 border-2 border-purple-300 rounded-lg p-4 shadow-lg">
          <div className="text-sm font-bold text-purple-900 mb-2">
            Incident Location Selected
          </div>
          <div className="font-mono text-sm text-purple-800">
            <div>Lat: {selectedLocation.lat.toFixed(6)}°</div>
            <div>Lng: {selectedLocation.lng.toFixed(6)}°</div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[10000] bg-white/95 p-4 flex gap-3 justify-end border-t-2 border-slate-200 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedLocation || loading}
          className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${
            selectedLocation && !loading
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Getting location...' : selectedLocation ? 'Confirm Incident Spot' : 'Select a location'}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issue with Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HOSTEL_LAT = parseFloat(import.meta.env.VITE_HOSTEL_LAT) || 23.2870;
const HOSTEL_LNG = parseFloat(import.meta.env.VITE_HOSTEL_LNG) || 77.3370;

// Custom campus pin (red)
const campusIcon = L.divIcon({
  className: "",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
      <div style="
        background:#ef4444;color:#fff;font-size:10px;font-weight:700;
        padding:2px 7px;border-radius:6px;margin-bottom:2px;white-space:nowrap;
        box-shadow:0 1px 6px rgba(0,0,0,0.3);
      ">Campus Center</div>
      <svg width="22" height="30" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>
    </div>`,
  iconAnchor: [0, 0],
  popupAnchor: [0, -10],
});

// Custom user location pin (blue)
const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
      <div style="
        background:#3b82f6;color:#fff;font-size:10px;font-weight:700;
        padding:2px 7px;border-radius:6px;margin-bottom:2px;white-space:nowrap;
        box-shadow:0 1px 6px rgba(0,0,0,0.3);
      ">You</div>
      <svg width="20" height="28" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#3b82f6"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>
    </div>`,
  iconAnchor: [0, 0],
  popupAnchor: [0, -10],
});

// Auto-adjusts map view whenever the user or campus coords change
const BoundsUpdater = ({ userLat, userLng, hostelLat, hostelLng }) => {
  const map = useMap();

  useEffect(() => {
    if (userLat && userLng) {
      const bounds = L.latLngBounds(
        [userLat, userLng],
        [hostelLat, hostelLng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    } else {
      map.setView([hostelLat, hostelLng], 16);
    }
  }, [map, userLat, userLng, hostelLat, hostelLng]);

  return null;
};

export const MapView = ({
  userLat,
  userLng,
  campusLat,
  campusLng,
  radiusMeters,
  distance,
  isInside,
  showGeofence = true,
  className = "",
}) => {
  const hostelLat = campusLat || HOSTEL_LAT;
  const hostelLng = campusLng || HOSTEL_LNG;
  const radius = radiusMeters || 500;

  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: 180 }}>
      <MapContainer
        center={[hostelLat, hostelLng]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        {/* Free OpenStreetMap tile layer — no API key required */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        {/* Geofence boundary circle */}
        {showGeofence && (
          <Circle
            center={[hostelLat, hostelLng]}
            radius={radius}
            pathOptions={{
              color: "#6366f1",
              fillColor: "#6366f1",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 4",
            }}
          />
        )}

        {/* Campus center marker */}
        <Marker position={[hostelLat, hostelLng]} icon={campusIcon}>
          <Popup>
            <strong>SISTec Campus Center</strong>
            <br />
            Geofence radius: {radius}m
          </Popup>
        </Marker>

        {/* Student current location marker */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup>
              <strong>Your Location</strong>
              <br />
              {distance
                ? `${distance} from campus center`
                : "Calculating distance..."}
              <br />
              <span
                style={{
                  color: isInside ? "#16a34a" : "#dc2626",
                  fontWeight: 600,
                }}
              >
                {isInside ? "✓ Inside campus area" : "✗ Outside campus area"}
              </span>
            </Popup>
          </Marker>
        )}

        {/* Auto-fit bounds */}
        <BoundsUpdater
          userLat={userLat}
          userLng={userLng}
          hostelLat={hostelLat}
          hostelLng={hostelLng}
        />
      </MapContainer>
    </div>
  );
};

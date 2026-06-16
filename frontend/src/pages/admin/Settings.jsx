import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Settings as SettingsIcon,
  Clock,
  MapPin,
  Save,
  ShieldAlert,
  Crosshair,
  Navigation,
} from "lucide-react";

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom red campus pin
const campusIcon = L.divIcon({
  className: "",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
      <div style="
        background:#ef4444;color:#fff;font-size:10px;font-weight:700;
        padding:2px 8px;border-radius:6px;margin-bottom:2px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(239,68,68,0.4);letter-spacing:0.02em;
      ">📍 Campus Center</div>
      <svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <circle cx="12" cy="12" r="3" fill="#ef4444"/>
      </svg>
    </div>`,
  iconAnchor: [0, 0],
  popupAnchor: [0, -10],
});

// Map click handler + draggable marker
const MapClickHandler = ({ lat, lng, radius, onLocationChange }) => {
  const map = useMap();
  const markerRef = useRef(null);

  // Re-center map when coords change from outside (inputs)
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);

  // Click on map to move pin
  useMapEvents({
    click(e) {
      onLocationChange(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6))
      );
    },
  });

  const eventHandlers = {
    dragend() {
      const m = markerRef.current;
      if (m) {
        const pos = m.getLatLng();
        onLocationChange(
          parseFloat(pos.lat.toFixed(6)),
          parseFloat(pos.lng.toFixed(6))
        );
      }
    },
  };

  return (
    <>
      {/* Geofence boundary preview */}
      <Circle
        center={[lat, lng]}
        radius={radius || 200}
        pathOptions={{
          color: "#6366f1",
          fillColor: "#6366f1",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "7 4",
        }}
      />

      {/* Draggable campus center marker */}
      <Marker
        position={[lat, lng]}
        icon={campusIcon}
        draggable={true}
        eventHandlers={eventHandlers}
        ref={markerRef}
      >
        <Popup>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-800">Campus Center</p>
            <p className="font-mono text-slate-600">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
            <p className="text-slate-500">
              Drag pin or click map to reposition
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [form, setForm] = useState({
    checkInTime: "20:00",
    cutoffTime: "22:00",
    geofenceRadius: 200,
    campusLatitude: 23.2815,
    campusLongitude: 77.4562,
  });

  const { success, error } = useToast();

  const fetchSettings = async () => {
    try {
      const data = await api.admin.getSettings();
      setForm({
        checkInTime: data.checkInTime || "20:00",
        cutoffTime: data.cutoffTime || "22:00",
        geofenceRadius: data.geofenceRadius || 200,
        campusLatitude: data.campusLatitude || 23.2815,
        campusLongitude: data.campusLongitude || 77.4562,
      });
    } catch (err) {
      error("Failed to load settings from server");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLocationChange = useCallback((lat, lng) => {
    setForm((prev) => ({
      ...prev,
      campusLatitude: lat,
      campusLongitude: lng,
    }));
  }, []);

  // Use browser geolocation to snap campus to current position
  const handleUseMyLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationChange(
          parseFloat(pos.coords.latitude.toFixed(6)),
          parseFloat(pos.coords.longitude.toFixed(6))
        );
        setIsLocating(false);
        success("Campus center set to your current location!");
      },
      (err) => {
        error("Could not get your location: " + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.checkInTime || !form.cutoffTime) {
      error("Check-in and Cutoff times are required");
      return;
    }
    if (isNaN(form.geofenceRadius) || form.geofenceRadius <= 0) {
      error("Geofence radius must be a positive number");
      return;
    }
    if (isNaN(form.campusLatitude) || isNaN(form.campusLongitude)) {
      error("Latitude and Longitude must be valid coordinates");
      return;
    }
    setIsSaving(true);
    try {
      await api.admin.updateSettings(form);
      success("Settings updated successfully!");
    } catch (err) {
      error(err.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 text-primary-700 rounded-xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-600 mt-1">
            Configure Geofence radius, coordinates and attendance window timing
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Geofence & Location Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Campus Geofence Setup
              </h2>
            </div>
            {/* Use My Location button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUseMyLocation}
              isLoading={isLocating}
              className="gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              Use My Location
            </Button>
          </div>

          {/* Instruction banner */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-700 font-medium">
            <Crosshair className="w-4 h-4 flex-shrink-0" />
            Click anywhere on the map or drag the pin to set the campus center.
            The purple ring shows the geofence boundary.
          </div>

          {/* Leaflet Map — full interactive, no API key */}
          <div
            className="w-full overflow-hidden rounded-xl border border-slate-200"
            style={{ height: 340 }}
          >
            <MapContainer
              center={[form.campusLatitude, form.campusLongitude]}
              zoom={16}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              <MapClickHandler
                lat={form.campusLatitude}
                lng={form.campusLongitude}
                radius={form.geofenceRadius}
                onLocationChange={handleLocationChange}
              />
            </MapContainer>
          </div>

          {/* Coordinate & Radius inputs below the map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Campus Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.campusLatitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleLocationChange(val, form.campusLongitude);
                }}
                placeholder="e.g. 23.2815"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Campus Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.campusLongitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleLocationChange(form.campusLatitude, val);
                }}
                placeholder="e.g. 77.4562"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Geofence Radius (meters)
              </label>
              <input
                type="number"
                min="10"
                max="10000"
                value={form.geofenceRadius}
                onChange={(e) =>
                  setForm({
                    ...form,
                    geofenceRadius: parseInt(e.target.value) || "",
                  })
                }
                placeholder="e.g. 200"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Live summary pill */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              Students must be within{" "}
              <strong className="text-slate-700">{form.geofenceRadius}m</strong>{" "}
              of{" "}
              <strong className="text-slate-700 font-mono">
                {form.campusLatitude.toFixed(5)},{" "}
                {form.campusLongitude.toFixed(5)}
              </strong>{" "}
              to mark attendance.
            </span>
          </div>
        </Card>

        {/* Time Window Setup Card */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Attendance Window Timing
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Check-in Start Time
              </label>
              <input
                type="time"
                value={form.checkInTime}
                onChange={(e) =>
                  setForm({ ...form, checkInTime: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Warden Cutoff Time (Late limit)
              </label>
              <input
                type="time"
                value={form.cutoffTime}
                onChange={(e) =>
                  setForm({ ...form, cutoffTime: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            isLoading={isSaving}
            className="px-8 gap-2 shadow-lg shadow-primary-500/20"
            size="lg"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

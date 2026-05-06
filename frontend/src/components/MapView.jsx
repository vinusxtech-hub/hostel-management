import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const HOSTEL_LAT = parseFloat(import.meta.env.VITE_HOSTEL_LAT) || 28.6139;
const HOSTEL_LNG = parseFloat(import.meta.env.VITE_HOSTEL_LNG) || 77.2090;

const MapContent = ({ userLat, userLng, hostelLat, hostelLng }) => {
  const center = userLat && userLng
    ? { lat: (userLat + hostelLat) / 2, lng: (userLng + hostelLng) / 2 }
    : { lat: hostelLat, lng: hostelLng };

  return (
    <Map
      defaultCenter={center}
      defaultZoom={15}
      mapId="hostel-attendance-map"
      style={{ width: "100%", height: "100%" }}
      gestureHandling="cooperative"
      disableDefaultUI={false}
    >
      {/* Hostel Marker */}
      <AdvancedMarker position={{ lat: hostelLat, lng: hostelLng }} title="Hostel Location">
        <Pin background="#ef4444" glyphColor="#fff" borderColor="#dc2626" scale={1.2} />
      </AdvancedMarker>

      {/* User Location Marker */}
      {userLat && userLng && (
        <AdvancedMarker position={{ lat: userLat, lng: userLng }} title="Your Location">
          <Pin background="#3b82f6" glyphColor="#fff" borderColor="#2563eb" scale={1.0} />
        </AdvancedMarker>
      )}
    </Map>
  );
};

// Fallback map component when no API key is provided
const FallbackMap = ({ userLat, userLng, distance, isInside }) => (
  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </div>
    {userLat && userLng ? (
      <>
        <p className="text-sm font-medium text-slate-700 mb-1">Your Coordinates</p>
        <p className="text-xs text-slate-500 font-mono">{userLat.toFixed(6)}, {userLng.toFixed(6)}</p>
        <div className={`mt-3 px-4 py-2 rounded-full text-sm font-semibold ${isInside ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isInside ? '✓ Inside Geofence' : '✗ Outside Geofence'} — {distance} km
        </div>
      </>
    ) : (
      <p className="text-sm text-slate-500">Fetching location...</p>
    )}
    <p className="text-xs text-slate-400 mt-3">Set VITE_GOOGLE_MAPS_API_KEY for interactive map</p>
  </div>
);

export const MapView = ({ userLat, userLng, distance, isInside, className = "" }) => {
  const hostelLat = HOSTEL_LAT;
  const hostelLng = HOSTEL_LNG;

  if (!API_KEY || API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <div className={`overflow-hidden rounded-xl ${className}`}>
        <FallbackMap userLat={userLat} userLng={userLng} distance={distance} isInside={isInside} />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <APIProvider apiKey={API_KEY}>
        <MapContent
          userLat={userLat}
          userLng={userLng}
          hostelLat={hostelLat}
          hostelLng={hostelLng}
        />
      </APIProvider>
    </div>
  );
};

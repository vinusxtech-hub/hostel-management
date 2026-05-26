import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const HOSTEL_LAT = parseFloat(import.meta.env.VITE_HOSTEL_LAT) || 23.2870;
const HOSTEL_LNG = parseFloat(import.meta.env.VITE_HOSTEL_LNG) || 77.3370;

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
      {/* Campus marker is the center point of the attendance geofence. */}
      <AdvancedMarker position={{ lat: hostelLat, lng: hostelLng }} title="SISTec Campus Center">
        <Pin background="#ef4444" glyphColor="#fff" borderColor="#dc2626" scale={1.2} />
      </AdvancedMarker>

      {userLat && userLng && (
        <AdvancedMarker position={{ lat: userLat, lng: userLng }} title="Your Location">
          <Pin background="#3b82f6" glyphColor="#fff" borderColor="#2563eb" scale={1.0} />
        </AdvancedMarker>
      )}
    </Map>
  );
};

const FallbackMap = ({ userLat, userLng, distance, isInside }) => (
  <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-500"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </div>

    {userLat && userLng ? (
      <>
        <div className={`mb-3 h-3 w-3 rounded-full animate-pulse ${isInside ? "bg-green-500" : "bg-red-500"}`}></div>
        <p className="mb-1 text-sm font-semibold text-slate-800">
          {isInside ? "Location Verified" : "Location Detected"}
        </p>
        <p className="text-xs text-slate-500">
          You are <span className="font-semibold text-slate-700">{distance}</span> from the SISTec campus center
        </p>
        <div className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold ${isInside ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {isInside ? "Inside SISTec campus area" : "Outside SISTec campus area"}
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
        <p className="text-sm text-slate-500">Detecting your location...</p>
      </div>
    )}
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

import { useEffect, useRef } from "react";

const HOSTEL_LAT = parseFloat(import.meta.env.VITE_HOSTEL_LAT) || 23.2870;
const HOSTEL_LNG = parseFloat(import.meta.env.VITE_HOSTEL_LNG) || 77.3370;

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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  const hostelLat = campusLat || HOSTEL_LAT;
  const hostelLng = campusLng || HOSTEL_LNG;
  const radius = radiusMeters || 500;

  useEffect(() => {
    // Ensure google maps is loaded
    if (!window.google || !window.google.maps) {
      console.warn("Google Maps JavaScript API is not loaded yet.");
      return;
    }

    const campusCenter = { lat: hostelLat, lng: hostelLng };

    // Initialize Map if not already initialized
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: campusCenter,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi.business",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & circle
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    // Geofence Circle
    if (showGeofence) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#6366f1",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#6366f1",
        fillOpacity: 0.08,
        map: map,
        center: campusCenter,
        radius: radius,
      });
    }

    // Campus Center Marker (Red)
    const campusMarker = new window.google.maps.Marker({
      position: campusCenter,
      map: map,
      title: "SISTec Campus Center",
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: "#ef4444",
        fillOpacity: 1,
        strokeWeight: 1,
        scale: 6,
      },
    });

    const campusInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family: Inter, sans-serif; padding: 4px; line-height: 1.4;">
          <strong style="color: #0f172a; font-size: 13px;">SISTec Campus Center</strong><br/>
          <span style="color: #64748b; font-size: 11px;">Geofence radius: ${radius}m</span>
        </div>
      `,
    });

    campusMarker.addListener("click", () => {
      campusInfoWindow.open(map, campusMarker);
    });

    markersRef.current.push(campusMarker);

    // Bounds calculator
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(campusCenter);

    // User Location Marker (Blue)
    if (userLat && userLng) {
      const userPosition = { lat: userLat, lng: userLng };
      const userMarker = new window.google.maps.Marker({
        position: userPosition,
        map: map,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });

      const userInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: Inter, sans-serif; padding: 4px; line-height: 1.5;">
            <strong style="color: #0f172a; font-size: 13px;">Your Location</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${
              distance ? `${distance} from center` : "Calculating distance..."
            }</span><br/>
            <strong style="color: ${isInside ? "#16a34a" : "#dc2626"}; font-size: 11px;">
              ${isInside ? "✓ Inside campus area" : "✗ Outside campus area"}
            </strong>
          </div>
        `,
      });

      userMarker.addListener("click", () => {
        userInfoWindow.open(map, userMarker);
      });

      markersRef.current.push(userMarker);
      bounds.extend(userPosition);

      // Fit bounds to show both user and campus
      map.fitBounds(bounds);
      
      // Prevent zooming in too close on fitBounds
      const listener = window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > 16) {
          map.setZoom(16);
        }
      });
    } else {
      map.setCenter(campusCenter);
      map.setZoom(16);
    }
  }, [userLat, userLng, hostelLat, hostelLng, radius, showGeofence, distance, isInside]);

  return (
    <div
      ref={mapRef}
      className={`overflow-hidden rounded-b-2xl ${className}`}
      style={{ width: "100%", height: "100%", minHeight: 180 }}
    />
  );
};

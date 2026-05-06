import { useState, useEffect, useCallback } from "react";

const HOSTEL_LAT = parseFloat(import.meta.env.VITE_HOSTEL_LAT) || 28.6139;
const HOSTEL_LNG = parseFloat(import.meta.env.VITE_HOSTEL_LNG) || 77.2090;
const RADIUS_KM = 0.2; // 200 meters

// Haversine formula to calculate distance in km
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInKm(latitude, longitude, HOSTEL_LAT, HOSTEL_LNG);
        const type = distance <= RADIUS_KM ? "Inside" : "Outside";

        setLocation({
          latitude,
          longitude,
          distance: distance.toFixed(4),
          distanceDisplay: distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`,
          type
        });
        setIsLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please enable GPS permissions in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please check your GPS.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred getting your location.");
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  return { location, error, isLoading, refreshLocation: checkLocation, hostelLat: HOSTEL_LAT, hostelLng: HOSTEL_LNG };
};

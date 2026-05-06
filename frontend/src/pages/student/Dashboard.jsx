import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { MapView } from "../../components/MapView";
import { useGeolocation } from "../../hooks/useGeolocation";
import { api } from "../../services/api";
import { MapPin, Clock, CheckCircle, AlertCircle, MapPinOff, RefreshCw } from "lucide-react";

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [settings, setSettings] = useState(null);
  const { location, error: geoError, isLoading: geoLoading, refreshLocation } = useGeolocation();
  const { success, error } = useToast();

  useEffect(() => {
    setIsLoading(false);
    const loadSettings = async () => {
      try {
        const data = await api.student.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleMarkAttendance = async () => {
    if (!location) {
      error("Location not available");
      return;
    }
    if (location.type === "Outside") {
      error("You are outside the hostel premises. Move closer to mark attendance.");
      return;
    }

    setIsMarkingAttendance(true);
    try {
      const result = await api.student.markAttendance({
        latitude: location.latitude,
        longitude: location.longitude
      });
      setAttendanceStatus(result);
      success(`Attendance marked as ${result.status}!`);
    } catch (err) {
      error(err.message);
      setAttendanceStatus({ status: "Rejected", message: err.message });
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  if (geoLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="animate-slide-in-down">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2 text-lg">Welcome back! Here's your attendance overview.</p>
      </div>

      {/* GPS Error Banner */}
      {geoError && (
        <div className="animate-slide-in-up bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{geoError}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={refreshLocation}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Map + Status Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Map View */}
        <div className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <Card className="p-0 overflow-hidden">
            <MapView
              userLat={location?.latitude}
              userLng={location?.longitude}
              distance={location?.distanceDisplay}
              isInside={location?.type === "Inside"}
              className="h-[280px]"
            />
          </Card>
        </div>

        {/* Location + Attendance Status */}
        <div className="space-y-6">
          {/* Location Status */}
          <div className="animate-slide-in-up" style={{ animationDelay: '150ms' }}>
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Geolocation Status</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {location?.type || "Unknown"}
                  </h3>
                </div>
                {location?.type === "Inside" ? (
                  <div className="p-3 bg-green-100/50 rounded-2xl">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-red-100/50 rounded-2xl">
                    <MapPinOff className="w-8 h-8 text-red-600" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                <span className="text-sm text-slate-600">Distance from hostel</span>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                  {location?.distanceDisplay || "N/A"}
                </span>
              </div>
            </Card>
          </div>

          {/* Today's Attendance Status */}
          <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Today's Attendance</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {attendanceStatus?.status || "Not Marked"}
                  </h3>
                </div>
                {attendanceStatus?.status === "Present" ? (
                  <div className="p-3 bg-green-100/50 rounded-2xl"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                ) : attendanceStatus?.status === "Late" ? (
                  <div className="p-3 bg-yellow-100/50 rounded-2xl"><Clock className="w-8 h-8 text-yellow-600" /></div>
                ) : (
                  <div className="p-3 bg-slate-100/50 rounded-2xl"><AlertCircle className="w-8 h-8 text-slate-400" /></div>
                )}
              </div>
              {attendanceStatus?.time && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                  <span className="text-sm text-slate-600">Marked at</span>
                  <span className="text-lg font-bold text-slate-900">{attendanceStatus.time}</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Attendance Time Window */}
      <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-4">Attendance Time Window</p>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-600">Check-in Time</p>
                <p className="text-2xl font-bold text-primary-700">{settings?.checkInTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Cutoff Time</p>
                <p className="text-2xl font-bold text-indigo-700">{settings?.cutoffTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Geofence</p>
                <p className="text-2xl font-bold text-emerald-700">{settings ? `${settings.geofenceRadius}m` : "—"}</p>
              </div>
            </div>
            <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Late marking after {settings?.cutoffTime ?? "cutoff time"}. You must be within {settings ? `${settings.geofenceRadius}m` : "the geofence"} of the hostel.</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Mark Attendance Button */}
      <div className="flex gap-4 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        <Button
          onClick={handleMarkAttendance}
          isLoading={isMarkingAttendance}
          disabled={!location || location.type === "Outside" || !!geoError}
          size="lg"
          className="flex-1 text-lg shadow-xl shadow-primary-500/20"
        >
          {isMarkingAttendance
            ? "Marking Attendance..."
            : geoError
            ? "Location Unavailable"
            : location?.type === "Outside"
            ? `Outside Hostel (${location.distanceDisplay}) — Cannot Mark`
            : "Mark Attendance"}
        </Button>
        <Button variant="secondary" size="lg" onClick={refreshLocation}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      {/* Attendance Result */}
      {attendanceStatus && (
        <div className="animate-zoom-in">
          <Card className={attendanceStatus.status === "Rejected" ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}>
            <div className="flex items-center gap-4">
              {attendanceStatus.status === "Present" && (
                <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-8 h-8 text-green-600" /></div>
              )}
              {attendanceStatus.status === "Late" && (
                <div className="p-3 bg-yellow-100 rounded-full"><Clock className="w-8 h-8 text-yellow-600" /></div>
              )}
              {attendanceStatus.status === "Rejected" && (
                <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="w-8 h-8 text-red-600" /></div>
              )}
              <div>
                <p className="font-bold text-lg text-slate-900">
                  {attendanceStatus.status === "Rejected" ? attendanceStatus.message : `Attendance marked as ${attendanceStatus.status}`}
                </p>
                {attendanceStatus.time && (
                  <p className="text-sm text-slate-600 font-medium">Marked at {attendanceStatus.time}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

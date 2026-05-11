import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { MapView } from "../../components/MapView";
import { useGeolocation } from "../../hooks/useGeolocation";
import { api } from "../../services/api";
import { MapPin, Clock, CheckCircle, AlertCircle, MapPinOff, RefreshCw, Timer, Lock } from "lucide-react";

// Helper: parse "HH:MM" into total minutes since midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: format seconds into MM:SS or HH:MM:SS
const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [settings, setSettings] = useState(null);
  const [timeInfo, setTimeInfo] = useState({ isOpen: false, countdown: 0, progress: 0 });
  const { location, error: geoError, isLoading: geoLoading, refreshLocation } = useGeolocation();
  const { success, error } = useToast();

  // Compute window status and countdown every second
  const computeTimeInfo = useCallback(() => {
    if (!settings) return;
    const checkInMin = parseTimeToMinutes(settings.checkInTime);
    const cutoffMin = parseTimeToMinutes(settings.cutoffTime);

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // Determine total window length in minutes (handle overnight)
    let windowLength;
    if (cutoffMin > checkInMin) {
      windowLength = cutoffMin - checkInMin;
    } else {
      windowLength = (1440 - checkInMin) + cutoffMin;
    }

    // Check if currently open
    let isOpen;
    if (cutoffMin > checkInMin) {
      isOpen = currentMin >= checkInMin && currentMin <= cutoffMin;
    } else {
      isOpen = currentMin >= checkInMin || currentMin <= cutoffMin;
    }

    // Compute remaining seconds until cutoff
    let remainingSec = 0;
    if (isOpen) {
      const cutoffSec = cutoffMin * 60;
      if (cutoffMin > checkInMin) {
        remainingSec = cutoffSec - currentSec;
      } else {
        // Overnight: if we're past checkIn, remaining = (1440*60 - currentSec) + cutoffSec
        if (currentMin >= checkInMin) {
          remainingSec = (1440 * 60 - currentSec) + cutoffSec;
        } else {
          remainingSec = cutoffSec - currentSec;
        }
      }
    }

    // Compute how many minutes have elapsed in the window
    let elapsedMin = 0;
    if (isOpen) {
      if (cutoffMin > checkInMin) {
        elapsedMin = currentMin - checkInMin;
      } else {
        if (currentMin >= checkInMin) {
          elapsedMin = currentMin - checkInMin;
        } else {
          elapsedMin = (1440 - checkInMin) + currentMin;
        }
      }
    }

    const progress = windowLength > 0 ? Math.min((elapsedMin / windowLength) * 100, 100) : 0;

    setTimeInfo({ isOpen, countdown: Math.max(0, remainingSec), progress });
  }, [settings]);

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

  // Tick countdown every second
  useEffect(() => {
    computeTimeInfo();
    const interval = setInterval(computeTimeInfo, 1000);
    return () => clearInterval(interval);
  }, [computeTimeInfo]);

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
        <Card className={`relative overflow-hidden group ${timeInfo.isOpen ? 'border-green-200' : 'border-red-200'}`}>
          <div className={`absolute inset-0 ${timeInfo.isOpen ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50' : 'bg-gradient-to-r from-red-50/30 to-slate-50/30'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative z-10">
            {/* Title + Live Status Badge */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Attendance Time Window</p>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${timeInfo.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${timeInfo.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {timeInfo.isOpen ? 'OPEN' : 'CLOSED'}
              </div>
            </div>

            {/* Time Slots */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-600">Check-in Opens</p>
                <p className="text-2xl font-bold text-primary-700">{settings?.checkInTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Window Closes</p>
                <p className="text-2xl font-bold text-indigo-700">{settings?.cutoffTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Geofence</p>
                <p className="text-2xl font-bold text-emerald-700">{settings ? `${settings.geofenceRadius}m` : "—"}</p>
              </div>
            </div>

            {/* Progress Bar + Countdown */}
            {timeInfo.isOpen ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Remaining</span>
                    <span className="text-sm font-bold text-primary-700 font-mono tabular-nums">{formatCountdown(timeInfo.countdown)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${100 - timeInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                  <Timer className="w-5 h-5 flex-shrink-0" />
                  <span>Attendance window is <strong>open</strong>. You have <strong>{formatCountdown(timeInfo.countdown)}</strong> left to mark your attendance.</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <span>Attendance window is <strong>closed</strong>. It opens daily at <strong>{settings?.checkInTime ?? "—"}</strong> and closes at <strong>{settings?.cutoffTime ?? "—"}</strong>.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Mark Attendance Button */}
      <div className="flex gap-4 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        <Button
          onClick={handleMarkAttendance}
          isLoading={isMarkingAttendance}
          disabled={!location || location.type === "Outside" || !!geoError || !timeInfo.isOpen}
          size="lg"
          className={`flex-1 text-lg shadow-xl ${timeInfo.isOpen ? 'shadow-primary-500/20' : 'shadow-slate-300/20 !bg-slate-400 cursor-not-allowed'}`}
        >
          {!timeInfo.isOpen ? (
            <><Lock className="w-5 h-5 mr-2" /> Attendance Window Closed</>
          ) : isMarkingAttendance ? (
            "Marking Attendance..."
          ) : geoError ? (
            "Location Unavailable"
          ) : location?.type === "Outside" ? (
            `Outside Hostel (${location.distanceDisplay}) — Cannot Mark`
          ) : (
            <><CheckCircle className="w-5 h-5 mr-2" /> Mark Attendance</>
          )}
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
